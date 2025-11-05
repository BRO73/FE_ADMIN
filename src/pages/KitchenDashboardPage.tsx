import React, { useEffect, useMemo, useRef, useState } from "react";
import { useKitchen } from "../hooks/useKitchen";
import type { KitchenTicketDto } from "../api/kitchenApi";
import { fetchAllMenuItemsLite } from "../api/menuAvailability.api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCcw, Search, Utensils, Timer, Undo2 } from "lucide-react";

type KitchenTicket = KitchenTicketDto;
type TabKey = "priority" | "byDish" | "byTable";

type GroupDish = {
    key: string;
    name: string;
    notes?: string | null;
    items: KitchenTicket[];
    earliest: number;
    totalQty: number;
};
type GroupTable = { key: string; table: string; items: KitchenTicket[] };

type TicketsShape =
    | {
    pending?: KitchenTicket[];
    inProgress?: KitchenTicket[];
    readyToServe?: KitchenTicket[];
    ready?: KitchenTicket[];
}
    | null
    | undefined;

const HIGHLIGHT_MS = 2500;

export default function KitchenDashboardPage(): JSX.Element {
    const {
        loading,
        error,
        tickets,
        connected,
        updateStatus,
        refresh,
        completeOneUnit,
        completeAllUnits,
        serveOneUnit,
    } = useKitchen({ intervalMs: 3000 });

    const tks = tickets as TicketsShape;

    const pending: KitchenTicket[] = Array.isArray(tks?.pending) ? (tks!.pending as KitchenTicket[]) : [];
    const working: KitchenTicket[] = Array.isArray(tks?.inProgress) ? (tks!.inProgress as KitchenTicket[]) : [];

    // Lấy mảng "ready" mà không dùng any
    const ready: KitchenTicket[] = (() => {
        const hasReadyToServe =
            tks && typeof tks === "object" && "readyToServe" in tks && Array.isArray((tks as { readyToServe?: unknown }).readyToServe);
        if (hasReadyToServe) {
            return ((tks as { readyToServe?: KitchenTicket[] }).readyToServe ?? []) as KitchenTicket[];
        }
        const hasReady = tks && typeof tks === "object" && "ready" in tks && Array.isArray((tks as { ready?: unknown }).ready);
        return hasReady ? (((tks as { ready?: KitchenTicket[] }).ready ?? []) as KitchenTicket[]) : [];
    })();

    const [active, setActive] = useState<TabKey>("priority");
    const [q, setQ] = useState("");

    // ==== Availability map: { menuItemId: true|false } ====
    const [availabilityMap, setAvailabilityMap] = useState<Record<number, boolean>>({});
    const loadAvailability = async (): Promise<void> => {
        try {
            const list = await fetchAllMenuItemsLite();
            const m: Record<number, boolean> = {};
            for (const it of list) m[it.id] = it.available;
            setAvailabilityMap(m);
        } catch {
            /* ignore */
        }
    };
    useEffect(() => {
        void loadAvailability();
    }, []);
    useEffect(() => {
        const id = window.setInterval(() => {
            void loadAvailability();
        }, 5000);
        return () => window.clearInterval(id);
    }, []);
    useEffect(() => {
        const onFocus = () => {
            void loadAvailability();
        };
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, []);
    const isUnavailable = (menuItemId?: number): boolean =>
        typeof menuItemId === "number" && availabilityMap[menuItemId] === false;

    // ==== Hiệu ứng "mới" (xanh) & "rollback" (vàng) ====
    const [newWork, setNewWork] = useState<Record<number, true>>({});
    const [newReady, setNewReady] = useState<Record<number, true>>({});
    const [rollbackWork, setRollbackWork] = useState<Record<number, true>>({}); // áp ở cột trái

    const prevWorkIds = useRef<Set<number>>(new Set());
    const prevReadyIds = useRef<Set<number>>(new Set());

    const addTemp = (setter: React.Dispatch<React.SetStateAction<Record<number, true>>>, id: number) => {
        setter((prev) => ({ ...prev, [id]: true }));
        window.setTimeout(() => {
            setter((prev) => {
                const { [id]: _, ...rest } = prev;
                return rest;
            });
        }, HIGHLIGHT_MS);
    };

    // Phát hiện item "mới" ở cột trái (pending+working)
    useEffect(() => {
        const curr = new Set<number>([...pending, ...working].map((t) => t.orderDetailId));
        curr.forEach((id) => {
            if (!prevWorkIds.current.has(id)) addTemp(setNewWork, id);
        });
        prevWorkIds.current = curr;
    }, [pending, working]);

    // Phát hiện item "mới" ở cột phải (ready)
    useEffect(() => {
        const curr = new Set<number>(ready.map((t) => t.orderDetailId));
        curr.forEach((id) => {
            if (!prevReadyIds.current.has(id)) addTemp(setNewReady, id);
        });
        prevReadyIds.current = curr;
    }, [ready]);

    const onRollback = async (t: KitchenTicket): Promise<void> => {
        addTemp(setRollbackWork, t.orderDetailId);
        try {
            await updateStatus(t.orderDetailId, "IN_PROGRESS");
            await onRefreshAll();
        } catch {
            setRollbackWork((prev) => {
                const { [t.orderDetailId]: _, ...rest } = prev;
                return rest;
            });
        }
    };

    const matchQ = (s?: string) => (q ? (s || "").toLowerCase().includes(q.toLowerCase()) : true);

    const priorityList: KitchenTicket[] = useMemo(() => {
        const all: KitchenTicket[] = [...pending, ...working];
        all.sort((a, b) => {
            const ta = a.orderedAt ? Date.parse(a.orderedAt) : 0;
            const tb = b.orderedAt ? Date.parse(b.orderedAt) : 0;
            if (ta !== tb) return ta - tb;
            return (a.orderDetailId || 0) - (b.orderDetailId || 0);
        });
        return all.filter((t) => matchQ(t.dishName) || matchQ(t.tableNumber));
    }, [pending, working, q]);

    const byDish: GroupDish[] = useMemo(() => {
        const all: KitchenTicket[] = [...pending, ...working];
        const groups = new Map<string, { key: string; name: string; notes?: string | null; items: KitchenTicket[] }>();
        for (const t of all) {
            if (!(matchQ(t.dishName) || matchQ(t.tableNumber))) continue;
            const notesKey = (t.notes || "").trim().toLowerCase();
            const key = `${t.dishName}__${notesKey}`;
            if (!groups.has(key)) groups.set(key, { key, name: t.dishName, notes: t.notes, items: [] });
            groups.get(key)!.items.push(t);
        }
        const list: GroupDish[] = Array.from(groups.values()).map((g) => {
            const earliest = g.items.map((i) => (i.orderedAt ? Date.parse(i.orderedAt) : 0)).sort((a, b) => a - b)[0] ?? 0;
            return { ...g, earliest, totalQty: g.items.reduce((s, i) => s + (i.quantity ?? 0), 0) };
        });
        list.sort((a, b) => a.earliest - b.earliest);
        return list;
    }, [pending, working, q]);

    const byTable: GroupTable[] = useMemo(() => {
        const all: KitchenTicket[] = [...pending, ...working];
        const groups = new Map<string, GroupTable>();
        for (const t of all) {
            const table = t.tableNumber || "N/A";
            if (!(matchQ(t.dishName) || matchQ(table))) continue;
            if (!groups.has(table)) groups.set(table, { key: table, table, items: [] });
            groups.get(table)!.items.push(t);
        }
        const list: GroupTable[] = Array.from(groups.values()).map((g) => {
            g.items.sort((a, b) => {
                const ta = a.orderedAt ? Date.parse(a.orderedAt) : 0;
                const tb = b.orderedAt ? Date.parse(b.orderedAt) : 0;
                return ta - tb;
            });
            return g;
        });
        list.sort((a, b) => a.table.localeCompare(b.table, "vi"));
        return list;
    }, [pending, working, q]);

    const onRefreshAll = async (): Promise<void> => {
        await Promise.allSettled([refresh(), loadAvailability()]);
    };

    const canCancel = (s?: string) => {
        const n = normStatus(s);
        return n === "PENDING" || n === "IN_PROGRESS";
    };

    const cancelOutOfStock = async (t: KitchenTicket) => {
        const ok = window.confirm("Món đã HẾT. Bạn có muốn HỦY vé này khỏi bếp?");
        if (!ok) return;
        await updateStatus(t.orderDetailId, "CANCELED");
        await onRefreshAll();
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Kitchen Dashboard</h1>
                    <span title={connected ? "Đang kết nối" : "Mất kết nối"} className="text-lg">
            {connected ? "🟢" : "🔴"}
          </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Tìm món, số bàn…"
                            className="pl-8"
                        />
                    </div>
                    <Button variant="outline" onClick={() => void onRefreshAll()} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                        Làm mới
                    </Button>
                </div>
            </div>

            {loading && (
                <Card>
                    <CardContent className="py-6 text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải dữ liệu bếp…
                    </CardContent>
                </Card>
            )}
            {!loading && error && (
                <Card>
                    <CardContent className="py-6 text-sm text-destructive">Lỗi: {error}</CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                {/* LEFT: Tabs with Pending + Working views */}
                <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Utensils className="h-4 w-4" />
                            Khu chế biến
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={active} onValueChange={(v) => setActive(v as TabKey)} className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="priority">Ưu tiên</TabsTrigger>
                                <TabsTrigger value="byDish">Theo món</TabsTrigger>
                                <TabsTrigger value="byTable">Theo bàn</TabsTrigger>
                            </TabsList>

                            {/* Ưu tiên */}
                            <TabsContent value="priority" className="space-y-3">
                                {priorityList.length === 0 ? (
                                    <EmptyState title="Không có món nào cần chế biến." />
                                ) : (
                                    <ul className="grid gap-3">
                                        {priorityList.map((t) => {
                                            const highlightNew = newWork[t.orderDetailId];
                                            const highlightRollback = rollbackWork[t.orderDetailId];
                                            const outOfStock = isUnavailable(t.menuItemId);
                                            const showActions = (isPending(t.status) || isInProgress(t.status)) && !outOfStock;
                                            const showCancelBecauseOOS = outOfStock && canCancel(t.status);

                                            return (
                                                <li
                                                    key={`p-${t.orderDetailId}`}
                                                    className={[
                                                        "rounded-xl border bg-card p-3 shadow-sm transition-all",
                                                        outOfStock && "border-destructive/70 bg-destructive/5",
                                                        highlightRollback && "ring-2 ring-amber-400/60",
                                                        highlightNew && !highlightRollback && "ring-2 ring-emerald-400/60",
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" ")}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className={[
                                                                        "text-base font-semibold",
                                                                        outOfStock && "text-destructive font-extrabold",
                                                                        highlightRollback && "text-amber-700",
                                                                    ]
                                                                        .filter(Boolean)
                                                                        .join(" ")}
                                                                >
                                                                    {t.dishName}
                                                                </div>
                                                                <QtyPill qty={t.quantity} />
                                                                {highlightRollback && <Badge className="bg-amber-500 hover:bg-amber-500">ROLLBACK</Badge>}
                                                                {highlightNew && !highlightRollback && (
                                                                    <Badge className="bg-emerald-600 hover:bg-emerald-600">MỚI</Badge>
                                                                )}
                                                                {outOfStock && <Badge variant="destructive">HẾT MÓN</Badge>}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Bàn <b>{t.tableNumber}</b> • ID: {t.orderDetailId}
                                                                {t.orderedAt ? (
                                                                    <>
                                                                        {" "}
                                                                        • <TimeChip iso={t.orderedAt} />
                                                                    </>
                                                                ) : null}
                                                                {t.notes ? (
                                                                    <span className="ml-1 italic text-amber-700">• Ghi chú: {t.notes}</span>
                                                                ) : null}
                                                            </div>
                                                        </div>

                                                        {showCancelBecauseOOS && (
                                                            <Button variant="destructive" size="sm" onClick={() => void cancelOutOfStock(t)}>
                                                                Hủy
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {showActions && (
                                                        <>
                                                            <Separator className="my-3" />
                                                            <div className="flex items-center justify-end gap-2">
                                                                {t.quantity >= 2 && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        className="!px-3 !py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow ring-1 ring-blue-500/30"
                                                                        onClick={() => void completeOneUnit(t.orderDetailId)}
                                                                    >
                                                                        &gt;
                                                                    </Button>
                                                                )}
                                                                <Button size="sm" onClick={() => void completeAllUnits(t.orderDetailId)}>
                                                                    {/* Giữ nguyên ký hiệu '>>' */}
                                                                    &gt;&gt;
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => confirmCancel(() => updateStatus(t.orderDetailId, "CANCELED"))}
                                                                >
                                                                    Hủy
                                                                </Button>
                                                            </div>
                                                        </>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </TabsContent>

                            {/* Theo món */}
                            <TabsContent value="byDish">
                                {byDish.length === 0 ? (
                                    <EmptyState title="Không có nhóm món." />
                                ) : (
                                    <ul className="grid gap-3">
                                        {byDish.map((g) => (
                                            <li key={g.key} className="rounded-xl border bg-card p-3 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-base font-semibold">{g.name}</div>
                                                    <Badge> Tổng: {g.totalQty}</Badge>
                                                </div>
                                                {g.notes ? <div className="mt-1 text-sm italic text-amber-700">Ghi chú: {g.notes}</div> : null}
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {g.items.slice(0, 8).map((t) => (
                                                        <span
                                                            key={t.orderDetailId}
                                                            className="rounded-full border px-2 py-0.5 text-xs text-foreground"
                                                        >
                              Bàn {t.tableNumber} x{t.quantity}
                            </span>
                                                    ))}
                                                    {g.items.length > 8 && (
                                                        <span className="text-sm text-muted-foreground">+{g.items.length - 8}…</span>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </TabsContent>

                            {/* Theo bàn */}
                            <TabsContent value="byTable">
                                {byTable.length === 0 ? (
                                    <EmptyState title="Không có bàn nào có món cần chế biến." />
                                ) : (
                                    <ul className="grid gap-3">
                                        {byTable.map((g) => (
                                            <li key={g.key} className="rounded-xl border bg-card p-3 shadow-sm">
                                                <div className="text-base font-semibold">Bàn {g.table}</div>
                                                <ul className="mt-2 grid gap-1">
                                                    {g.items.map((t) => (
                                                        <li
                                                            key={t.orderDetailId}
                                                            className="flex items-center justify-between border-b border-dashed border-muted-foreground/20 py-1"
                                                        >
                              <span className={[isUnavailable(t.menuItemId) ? "text-destructive font-semibold" : ""].join(" ")}>
                                {t.dishName}
                              </span>
                                                            <span className="text-sm text-muted-foreground">x{t.quantity}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* RIGHT: Đã xong / Chờ phục vụ */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Đã xong / Chờ phục vụ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ready.length === 0 ? (
                            <EmptyState title="Chưa có món mới hoàn tất.">
                                <Button variant="outline" onClick={() => void onRefreshAll()}>
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Làm mới
                                </Button>
                            </EmptyState>
                        ) : (
                            <ul className="grid gap-3">
                                {ready
                                    .slice()
                                    .sort((a, b) => {
                                        const ta = a.orderedAt ? Date.parse(a.orderedAt) : 0;
                                        const tb = b.orderedAt ? Date.parse(b.orderedAt) : 0;
                                        return tb - ta;
                                    })
                                    .map((t) => {
                                        const highlightNew = newReady[t.orderDetailId];
                                        const outOfStock = isUnavailable(t.menuItemId);
                                        return (
                                            <li
                                                key={`r-${t.orderDetailId}`}
                                                className={[
                                                    "rounded-xl border bg-emerald-50 p-3 shadow-sm text-emerald-800",
                                                    "border-emerald-200",
                                                    highlightNew && "ring-2 ring-emerald-400/70",
                                                    outOfStock && "border-destructive/70",
                                                ]
                                                    .filter(Boolean)
                                                    .join(" ")}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className={["text-base font-semibold", outOfStock && "text-destructive"].join(" ")}>
                                                                {t.dishName}
                                                            </div>
                                                            <QtyPill qty={t.quantity} accent="green" />
                                                            {highlightNew && <Badge className="bg-emerald-600 hover:bg-emerald-600">MỚI</Badge>}
                                                            {outOfStock && <Badge variant="destructive">HẾT MÓN</Badge>}
                                                        </div>
                                                        <div className="text-sm text-emerald-700">
                                                            Bàn <b>{t.tableNumber}</b> • ID: {t.orderDetailId}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Separator className="my-3" />
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="secondary" size="sm" onClick={() => void onRollback(t)}>
                                                        <Undo2 className="mr-1 h-4 w-4" />
                                                        Rollback
                                                    </Button>
                                                    {t.quantity > 2 && (
                                                        <Button size="sm" onClick={() => void serveOneUnit(t.orderDetailId)}>
                                                            {/* Giữ nguyên ký hiệu '>' */}
                                                            &gt;
                                                        </Button>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

/* ======= UI bits ======= */
function EmptyState({ title, children }: { title: string; children?: React.ReactNode }): JSX.Element {
    return (
        <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-center">
            <div className="font-semibold text-foreground">{title}</div>
            <div className="mt-2 text-sm text-muted-foreground">{children ?? "—"}</div>
        </div>
    );
}

function QtyPill({ qty, accent }: { qty: number; accent?: "green" | "gray" }): JSX.Element {
    const base = "rounded-full border px-2 py-0.5 text-xs";
    if (accent === "green") return <span className={`${base} border-emerald-300 bg-emerald-50 text-emerald-700`}>x{qty}</span>;
    return <span className={`${base} border-foreground bg-foreground text-background`}>x{qty}</span>;
}

function TimeChip({ iso }: { iso: string }): JSX.Element {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      <Timer className="h-3 w-3" />
            {fmtTime(iso)}
    </span>
    );
}

/* ===== Helpers ===== */
function fmtTime(iso: string): string {
    const d = new Date(iso);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
}
function normStatus(s?: string) {
    return (s || "").trim().toUpperCase().replace(/[-\s]+/g, "_");
}
function isPending(s?: string) {
    return normStatus(s) === "PENDING";
}
function isInProgress(s?: string) {
    return normStatus(s) === "IN_PROGRESS";
}
function confirmCancel(run: () => void) {
    if (window.confirm("Bạn chắc chắn muốn hủy món này?")) run();
}
