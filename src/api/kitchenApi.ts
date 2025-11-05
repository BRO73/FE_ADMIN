import axios from "./axiosInstance";

export type OrderItemStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELED" | "SERVED";

export interface KitchenTicketDto {
    orderDetailId: number;
    orderId: number | null;
    tableNumber: string;
    menuItemId: number;
    dishName: string;
    quantity: number;
    status: string; // server có thể trả "In Progress" / "IN_PROGRESS" / "READY"...
    notes?: string | null;
    orderedAt: string; // ISO
    elapsedSeconds?: number;
    overtime?: boolean;
}

export interface KitchenBoardCanonical {
    serverTime: string;
    pending: KitchenTicketDto[];
    inProgress: KitchenTicketDto[];
    ready: KitchenTicketDto[]; // chờ cung ứng
    overtimeMinutes?: number;
}

/* ==== type guard & normalize ==== */
function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

function isSplit(raw: unknown): raw is {
    serverTime: string;
    pending: KitchenTicketDto[];
    inProgress: KitchenTicketDto[];
    ready?: KitchenTicketDto[];
    prepared?: KitchenTicketDto[];
    done?: KitchenTicketDto[];
    readyToServe?: KitchenTicketDto[];
    waitingSupply?: KitchenTicketDto[];
    overtimeMinutes?: number;
} {
    if (!isObject(raw)) return false;
    return "serverTime" in raw && "pending" in raw && "inProgress" in raw;
}

function isFlat(raw: unknown): raw is { serverTime: string; items: KitchenTicketDto[]; overtimeMinutes?: number } {
    if (!isObject(raw)) return false;
    return "serverTime" in raw && "items" in raw;
}

function normalizeStatus(s?: string): OrderItemStatus | "READY" | null {
    if (!s) return null;
    const v = s.trim().toUpperCase().replace(/[-\s]+/g, "_");
    if (v === "IN_PROGESS") return "IN_PROGRESS";
    if (v === "CANCELLED") return "CANCELED";
    if (v === "READY" || v === "READY_TO_SERVE" || v === "PREPARED" || v === "WAITING_SUPPLY") return "READY";
    if (v === "PREPARING" || v === "COOKING" || v === "WORKING") return "IN_PROGRESS";
    if (v === "PENDING" || v === "IN_PROGRESS" || v === "DONE" || v === "CANCELED" || v === "SERVED") {
        return v as OrderItemStatus;
    }
    return null;
}

function groupFromFlat(items: KitchenTicketDto[]): Pick<KitchenBoardCanonical, "pending" | "inProgress" | "ready"> {
    const pending: KitchenTicketDto[] = [];
    const inProgress: KitchenTicketDto[] = [];
    const ready: KitchenTicketDto[] = [];
    for (const it of items) {
        const st = normalizeStatus(it.status);
        if (st === "PENDING" || st === null) pending.push(it);
        else if (st === "IN_PROGRESS") inProgress.push(it);
        else if (st === "DONE" || st === "READY") ready.push(it);
    }
    return { pending, inProgress, ready };
}

function pickReady(raw: any): KitchenTicketDto[] {
    if (Array.isArray(raw.ready)) return raw.ready;
    if (Array.isArray(raw.prepared)) return raw.prepared;
    if (Array.isArray(raw.done)) return raw.done;
    if (Array.isArray(raw.readyToServe)) return raw.readyToServe;
    if (Array.isArray(raw.waitingSupply)) return raw.waitingSupply;
    return [];
}

export function normalizeKitchenBoard(raw: unknown): KitchenBoardCanonical {
    if (isSplit(raw)) {
        return {
            serverTime: raw.serverTime,
            pending: Array.isArray(raw.pending) ? raw.pending : [],
            inProgress: Array.isArray(raw.inProgress) ? raw.inProgress : [],
            ready: pickReady(raw),
            overtimeMinutes: raw.overtimeMinutes,
        };
    }
    if (isFlat(raw)) {
        const g = groupFromFlat(Array.isArray(raw.items) ? raw.items : []);
        return { serverTime: raw.serverTime, pending: g.pending, inProgress: g.inProgress, ready: g.ready, overtimeMinutes: raw.overtimeMinutes };
    }
    if (isObject(raw) && "data" in raw) {
        return normalizeKitchenBoard((raw as Record<string, unknown>).data);
    }
    return { serverTime: new Date().toISOString(), pending: [], inProgress: [], ready: [] };
}

/* ==== API ==== */
export async function fetchKitchenBoard(limit = 200, storeName?: string): Promise<KitchenBoardCanonical> {
    const res = await axios.get<unknown>("/kitchen/board", { params: { limit, ...(storeName ? { storeName } : {}) } });
    return normalizeKitchenBoard(res.data);
}

export async function updateOrderDetailStatus(orderDetailId: number, status: OrderItemStatus): Promise<void> {
    await axios.patch(`/kitchen/order-details/${orderDetailId}/status`, { status });
}

/** “>” — hoàn thành 1 đơn vị (không body) */
export async function completeOne(orderDetailId: number): Promise<void> {
    await axios.patch(`/kitchen/order-details/${orderDetailId}/complete-one`, {});
}

/** (chờ cung ứng) “>” — xuất 1 đơn vị (không body) */
export async function serveOne(orderDetailId: number): Promise<void> {
    await axios.patch(`/kitchen/order-details/${orderDetailId}/serve-one`, {});
}
