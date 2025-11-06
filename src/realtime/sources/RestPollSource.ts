// src/realtime/sources/RestPollSource.ts
import { fetchKitchenBoard } from "../../api/kitchenApi";
import { isAxiosError } from "axios";

/** Dữ liệu ticket chuẩn hoá để UI dùng */
export type KitchenTicket = {
    orderDetailId: number;
    orderId: number | null;
    tableNumber: string;
    menuItemId: number;
    dishName: string;
    quantity: number;
    status: string; // PENDING | IN_PROGRESS | DONE | SERVED | CANCELED
    notes?: string | null;
    orderedAt: string; // ISO
    elapsedSeconds?: number;
    overtime?: boolean;
};

export type KitchenBoard = {
    serverTime?: string;
    overtimeMinutes?: number;
    pending: KitchenTicket[];
    inProgress: KitchenTicket[];
};

type EventPayload =
    | { type: "board"; payload: KitchenBoard }
    | { type: "error"; payload: string };

type Listener = (e: EventPayload) => void;

type AnyRecord = Record<string, unknown>;

/* ==================== Helpers (type-safe, no any) ==================== */

function isRecord(v: unknown): v is AnyRecord {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

function getStr(o: AnyRecord, keys: string[]): string | undefined {
    for (const k of keys) {
        const v = o[k];
        if (typeof v === "string") return v;
        if (typeof v === "number") return String(v);
    }
    return undefined;
}

function getNum(o: AnyRecord, keys: string[]): number | null {
    for (const k of keys) {
        const v = o[k];
        if (typeof v === "number") return v;
        if (typeof v === "string") {
            const n = Number(v);
            if (!Number.isNaN(n)) return n;
        }
    }
    return null;
}

function getBool(o: AnyRecord, keys: string[]): boolean | undefined {
    for (const k of keys) {
        const v = o[k];
        if (typeof v === "boolean") return v;
        if (typeof v === "string") {
            if (v.toLowerCase() === "true") return true;
            if (v.toLowerCase() === "false") return false;
        }
    }
    return undefined;
}

function normStatus(s: unknown): string {
    if (typeof s !== "string") return "PENDING";
    let raw = s.trim().replace(/[-\s./\\]+/g, "_").toUpperCase();
    if (raw === "CANCELLED") raw = "CANCELED";
    // Mappings hay gặp
    if (raw === "NEW" || raw === "WAITING") raw = "PENDING";
    if (raw === "COOKING" || raw === "PREPARING" || raw === "PROCESSING") raw = "IN_PROGRESS";
    if (raw === "FINISHED" || raw === "COMPLETE" || raw === "COMPLETED") raw = "DONE";
    return raw;
}

function toIsoOrEmpty(s?: string): string {
    if (!s) return "";
    const t = Date.parse(s);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
    return "";
}

/** Map 1 dòng bất kỳ từ BE sang KitchenTicket; trả null nếu thiếu id/tên món */
function mapTicket(row: unknown): KitchenTicket | null {
    if (!isRecord(row)) return null;

    const orderDetailId = getNum(row, ["orderDetailId", "order_detail_id", "detailId", "id"]);
    const menuItemId = getNum(row, ["menuItemId", "menu_item_id", "itemId"]);
    const orderId = getNum(row, ["orderId", "order_id"]) ?? null;

    const dishName =
        getStr(row, ["dishName", "name", "itemName", "menuItemName", "menu_item_name"]) ?? "";
    const tableNumber =
        getStr(row, ["tableNumber", "table", "tableName", "table_name", "table_no"]) ?? "";

    if (orderDetailId === null || dishName === "") return null;

    const quantity = getNum(row, ["quantity", "qty", "amount"]) ?? 1;
    const status = normStatus(getStr(row, ["status", "itemStatus", "orderItemStatus", "state"]));
    const notes = getStr(row, ["notes", "note", "remark"]);
    const orderedAt =
        toIsoOrEmpty(
            getStr(row, ["orderedAt", "createdAt", "ordered_at", "created_at", "orderTime"])
        ) || new Date().toISOString();

    const elapsedSeconds = getNum(row, ["elapsedSeconds", "elapsed_secs", "elapsed"]) ?? undefined;
    const overtime =
        getBool(row, ["overtime", "isOvertime", "over_time"]) ??
        (typeof elapsedSeconds === "number" ? elapsedSeconds > 60 * 15 : undefined);

    return {
        orderDetailId,
        orderId,
        tableNumber,
        menuItemId: menuItemId ?? 0,
        dishName,
        quantity,
        status,
        notes: notes ?? null,
        orderedAt,
        elapsedSeconds,
        overtime,
    };
}

/** Lấy mảng từ raw[key] nếu là array */
function arrAt(obj: AnyRecord, key: string): unknown[] {
    const v = obj[key];
    return Array.isArray(v) ? v : [];
}

/** Chuẩn hoá toàn bộ dữ liệu board từ BE thành KitchenBoard */
function normalizeBoard(raw: unknown): KitchenBoard {
    let pending: KitchenTicket[] = [];
    let inProgress: KitchenTicket[] = [];
    let serverTime: string | undefined = undefined;
    let overtimeMinutes: number | undefined = undefined;

    if (isRecord(raw)) {
        serverTime = getStr(raw, ["serverTime", "server_time", "time"]) ?? undefined;
        const ot = getNum(raw, ["overtimeMinutes", "overtime_minutes", "overtime"]);
        overtimeMinutes = ot === null ? undefined : ot;

        // Trường hợp BE đã chia sẵn 2 mảng:
        const p1 = arrAt(raw, "pending");
        const p2 = arrAt(raw, "inProgress").length ? arrAt(raw, "inProgress") : arrAt(raw, "in_progress");
        if (p1.length || p2.length) {
            pending = p1.map(mapTicket).filter((x): x is KitchenTicket => !!x);
            inProgress = p2.map(mapTicket).filter((x): x is KitchenTicket => !!x);
        } else {
            // Trường hợp BE trả 1 mảng lớn: data/items/orders/orderDetails...
            const candidates: unknown[] = [
                ...arrAt(raw, "data"),
                ...arrAt(raw, "items"),
                ...arrAt(raw, "orders"),
                ...arrAt(raw, "orderDetails"),
                ...arrAt(raw, "details"),
            ];
            if (candidates.length) {
                const mapped = candidates.map(mapTicket).filter((x): x is KitchenTicket => !!x);
                pending = mapped.filter((t) => t.status === "PENDING");
                inProgress = mapped.filter((t) => t.status === "IN_PROGRESS");
                // Nếu BE dùng trạng thái khác, gom thêm:
                if (pending.length === 0 && inProgress.length === 0) {
                    pending = mapped.filter((t) => ["PENDING", "NEW", "WAITING"].includes(t.status));
                    inProgress = mapped.filter((t) => ["IN_PROGRESS", "COOKING", "PREPARING"].includes(t.status));
                }
            }
        }
    } else if (Array.isArray(raw)) {
        // BE trả hẳn một mảng các item
        const mapped = raw.map(mapTicket).filter((x): x is KitchenTicket => !!x);
        pending = mapped.filter((t) => t.status === "PENDING");
        inProgress = mapped.filter((t) => t.status === "IN_PROGRESS");
    }

    // Log debug để dễ so lỗi dữ liệu
    // eslint-disable-next-line no-console
    console.debug(
        "[KitchenBoard] normalized:",
        { pending: pending.length, inProgress: inProgress.length, serverTime, overtimeMinutes }
    );

    return { serverTime, overtimeMinutes, pending, inProgress };
}

/* ==================== Source (polling) ==================== */

export class RestPollSource {
    private intervalMs: number;
    private listeners: Listener[] = [];
    private timer: number | undefined;
    private running = false;
    private lastBoard: KitchenBoard | undefined;

    constructor(intervalMs: number = 3000) {
        this.intervalMs = intervalMs;
    }

    on(listener: Listener) {
        this.listeners.push(listener);
    }

    off(listener: Listener) {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }

    private emit(e: EventPayload) {
        for (const l of this.listeners) {
            try {
                l(e);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error("[RestPollSource] listener error:", err);
            }
        }
    }

    isConnected(): boolean {
        return this.running === true;
    }

    getLast(): KitchenBoard | undefined {
        return this.lastBoard;
    }

    start(storeName?: string) {
        if (this.running) return;
        this.running = true;

        const tick = async () => {
            try {
                const raw = await fetchKitchenBoard(200, storeName);
                const board = normalizeBoard(raw as unknown);

                this.lastBoard = board;
                this.emit({ type: "board", payload: board });
            } catch (err: unknown) {
                // eslint-disable-next-line no-console
                console.error("[RestPollSource] fetch board error", err);

                if (isAxiosError(err)) {
                    const status = err.response?.status;
                    if (status === 401) {
                        this.stop();
                        this.emit({
                            type: "error",
                            payload: "401 Unauthorized — vui lòng đăng nhập lại hoặc kiểm tra token.",
                        });
                        return;
                    }
                }

                this.emit({
                    type: "error",
                    payload: "Không thể tải dữ liệu bếp. Thử lại sau.",
                });
            } finally {
                if (this.running) {
                    this.timer = window.setTimeout(tick, this.intervalMs) as unknown as number;
                }
            }
        };

        // Gọi lần đầu
        tick().catch((e) => {
            // eslint-disable-next-line no-console
            console.error("[RestPollSource] initial tick error", e);
        });
    }

    stop() {
        this.running = false;
        if (this.timer !== undefined) {
            window.clearTimeout(this.timer);
            this.timer = undefined;
        }
    }
}
