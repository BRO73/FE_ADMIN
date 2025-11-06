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
import { Loader2, RefreshCcw, Search, Utensils, Timer, Undo2, ChefHat, Clock, AlertTriangle } from "lucide-react";

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

// Một số BE có thêm các mốc thời gian này
type MaybeTimed = Partial<{
    queuedAt: string | null;
    startedAt: string | null;
    doneAt: string | null;
}>;

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
        serverNowMs, // <-- dùng đồng hồ server
    } = useKitchen({ intervalMs: 3000 });

    const tks = tickets as TicketsShape;
    const EMPTY = useRef<KitchenTicket[]>([]).current;
    const pending: KitchenTicket[] = Array.isArray(tks?.pending) ? (tks!.pending as KitchenTicket[]) : EMPTY;
    const working: KitchenTicket[] = Array.isArray(tks?.inProgress) ? (tks!.inProgress as KitchenTicket[]) : EMPTY;

    const ready: KitchenTicket[] = useMemo(() => {
        const hasReadyToServe =
            tks && typeof tks === "object" && "readyToServe" in tks && Array.isArray((tks as { readyToServe?: unknown }).readyToServe);
        if (hasReadyToServe) {
            return ((tks as { readyToServe?: KitchenTicket[] }).readyToServe ?? []) as KitchenTicket[];
        }
        const hasReady = tks && typeof tks === "object" && "ready" in tks && Array.isArray((tks as { ready?: unknown }).ready);
        return hasReady ? (((tks as { ready?: KitchenTicket[] }).ready ?? []) as KitchenTicket[]) : [];
    }, [tks]);

    const [active, setActive] = useState<TabKey>("priority");
    const [q, setQ] = useState<string>("");

    /* ======= Availability (hết hàng) ======= */
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
    // KÉO SNAPSHOT BAN ĐẦU (rất quan trọng)
    useEffect(() => {
        void onRefreshAll(); // sẽ gọi refresh() + loadAvailability()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isUnavailable = (menuItemId?: number): boolean =>
        typeof menuItemId === "number" && availabilityMap[menuItemId] === false;

    /* ======= Hiệu ứng highlight: vé mới / rollback / ready mới ======= */
    const [newWork, setNewWork] = useState<Record<number, true>>({});
    const [newReady, setNewReady] = useState<Record<number, true>>({});
    const [rollbackWork, setRollbackWork] = useState<Record<number, true>>({});

    const prevWorkIds = useRef<Set<number>>(new Set());
    const prevReadyIds = useRef<Set<number>>(new Set());

    const addTemp = (setter: React.Dispatch<React.SetStateAction<Record<number, true>>>, id: number): void => {
        setter((prev) => ({ ...prev, [id]: true }));
        window.setTimeout(() => {
            setter((prev) => {
                const { [id]: _, ...rest } = prev;
                return rest;
            });
        }, HIGHLIGHT_MS);
    };

    useEffect(() => {
        const curr = new Set<number>([...pending, ...working].map((t) => t.orderDetailId));
        curr.forEach((id) => {
            if (!prevWorkIds.current.has(id)) addTemp(setNewWork, id);
        });
        prevWorkIds.current = curr;
    }, [pending, working]);

    useEffect(() => {
        const curr = new Set<number>(ready.map((t) => t.orderDetailId));
        curr.forEach((id) => {
            if (!prevReadyIds.current.has(id)) addTemp(setNewReady, id);
        });
        prevReadyIds.current = curr;
    }, [ready]);

    /* ======= Actions ======= */
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

    const onRefreshAll = async (): Promise<void> => {
        await Promise.allSettled([refresh(), loadAvailability()]);
    };

    /* ======= Filter & Grouping ======= */
    const matchQ = (s?: string): boolean => (q ? (s || "").toLowerCase().includes(q.toLowerCase()) : true);

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
            const earliest =
                g.items
                    .map((i) => (i.orderedAt ? Date.parse(i.orderedAt) : 0))
                    .sort((a, b) => a - b)[0] ?? 0;
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

    /* ======= Cancel helpers ======= */
    const canCancel = (s?: string): boolean => {
        const n = normStatus(s);
        return n === "PENDING" || n === "IN_PROGRESS";
    };

    const cancelOutOfStock = async (t: KitchenTicket): Promise<void> => {
        const ok = window.confirm("Món đã HẾT. Bạn có muốn HỦY vé này khỏi bếp?");
        if (!ok) return;
        await updateStatus(t.orderDetailId, "CANCELED");
        await onRefreshAll();
    };

    /* ======= firstSeenAt để hiển thị timer fallback khi thiếu mốc ======= */
    const [firstSeenAt, setFirstSeenAt] = useState<Record<number, number>>({});

    useEffect(() => {
        // Nếu cả 2 danh sách đều rỗng thì KHÔNG làm gì để tránh setState vô ích
        if (pending.length === 0 && working.length === 0) return;

        // Dùng đồng hồ server thay vì Date.now()
        const now = serverNowMs;
        setFirstSeenAt((prev) => {
            let changed = false;
            const next = { ...prev };

            // chỉ ghi dấu thời điểm cho các vé CHƯA có trong prev
            for (const t of pending) {
                const id = t.orderDetailId;
                if (id != null && next[id] == null) {
                    next[id] = now;
                    changed = true;
                }
            }
            for (const t of working) {
                const id = t.orderDetailId;
                if (id != null && next[id] == null) {
                    next[id] = now;
                    changed = true;
                }
            }

            // ❗ nếu không có gì thay đổi, trả lại prev để KHÔNG kích hoạt re-render
            return changed ? next : prev;
        });
    }, [pending, working, serverNowMs]);

    return (
        <div className="min-h-screen bg-slate-900 p-4 space-y-4">
            {/* Header - Professional Kitchen Style */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-5 shadow-2xl border border-slate-600">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-500 p-3 rounded-xl shadow-lg">
                            <ChefHat className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-white">BẾP CHÍNH</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
                                <span className="text-sm text-slate-300 font-medium">{connected ? "Đang kết nối" : "Mất kết nối"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Tìm món, bàn..."
                                className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 h-11 w-64 focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => void onRefreshAll()}
                            disabled={loading}
                            className="h-11 bg-slate-800 border-slate-600 text-white hover:bg-slate-700 hover:text-white"
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCcw className="mr-2 h-5 w-5" />}
                            Làm mới
                        </Button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" />
                    <p className="mt-3 text-slate-300 font-medium">Đang tải dữ liệu bếp...</p>
                </div>
            )}
            {!loading && error && (
                <div className="bg-red-950 border-2 border-red-600 rounded-xl p-6 text-red-200">
                    <AlertTriangle className="h-6 w-6 inline mr-2" />
                    Lỗi: {error}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                {/* LEFT: Working Area */}
                <div className="md:col-span-2 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4">
                        <div className="flex items-center gap-2 text-white">
                            <Utensils className="h-6 w-6" />
                            <h2 className="text-xl font-bold tracking-wide">KHU CHẾ BIẾN</h2>
                        </div>
                    </div>
                    <div className="p-4">
                        <Tabs value={active} onValueChange={(v) => setActive(v as TabKey)} className="space-y-4">
                            <TabsList className="bg-slate-900 border border-slate-700 p-1 w-full grid grid-cols-3">
                                <TabsTrigger value="priority" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold">
                                    ƯU TIÊN
                                </TabsTrigger>
                                <TabsTrigger value="byDish" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold">
                                    THEO MÓN
                                </TabsTrigger>
                                <TabsTrigger value="byTable" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold">
                                    THEO BÀN
                                </TabsTrigger>
                            </TabsList>

                            {/* Priority Tab */}
                            <TabsContent value="priority" className="space-y-3">
                                {priorityList.length === 0 ? (
                                    <EmptyState title="Không có món nào cần chế biến" />
                                ) : (
                                    <ul className="grid gap-3">
                                        {priorityList.map((t) => {
                                            const highlightNew = newWork[t.orderDetailId];
                                            const highlightRollback = rollbackWork[t.orderDetailId];
                                            const outOfStock = isUnavailable(t.menuItemId);
                                            const showActions = (isPending(t.status) || isInProgress(t.status)) && !outOfStock;
                                            const showCancelBecauseOOS = outOfStock && canCancel(t.status);

                                            // Lấy mốc thời gian an toàn
                                            const timed = t as KitchenTicket & MaybeTimed;
                                            const startIso: string | undefined =
                                                timed.startedAt ??
                                                timed.queuedAt ??
                                                t.orderedAt ??
                                                (firstSeenAt[t.orderDetailId] ? new Date(firstSeenAt[t.orderDetailId]).toISOString() : undefined);
                                            const endIso: string | undefined = timed.doneAt ?? undefined;

                                            return (
                                                <li
                                                    key={`p-${t.orderDetailId}`}
                                                    className={[
                                                        "rounded-xl p-4 shadow-lg transition-all border-2",
                                                        outOfStock
                                                            ? "bg-red-950 border-red-600"
                                                            : highlightRollback
                                                                ? "bg-amber-950 border-amber-500 ring-4 ring-amber-500/50"
                                                                : highlightNew
                                                                    ? "bg-emerald-950 border-emerald-500 ring-4 ring-emerald-500/50"
                                                                    : "bg-slate-900 border-slate-700",
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" ")}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="space-y-2 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <div
                                                                    className={[
                                                                        "text-xl font-black tracking-wide",
                                                                        outOfStock ? "text-red-400" : highlightRollback ? "text-amber-400" : "text-white",
                                                                    ].join(" ")}
                                                                >
                                                                    {t.dishName}
                                                                </div>
                                                                <QtyPill qty={t.quantity} />
                                                                {highlightRollback && (
                                                                    <Badge className="bg-amber-500 hover:bg-amber-500 font-bold px-3 py-1">⚠ ROLLBACK</Badge>
                                                                )}
                                                                {highlightNew && !highlightRollback && (
                                                                    <Badge className="bg-emerald-500 hover:bg-emerald-500 font-bold px-3 py-1 animate-pulse">⭐ MỚI</Badge>
                                                                )}
                                                                {outOfStock && <Badge className="bg-red-600 hover:bg-red-600 font-bold px-3 py-1">❌ HẾT MÓN</Badge>}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-slate-300">
                                <span className="bg-slate-800 px-3 py-1.5 rounded-lg font-bold text-white border border-slate-700">
                                  BÀN {t.tableNumber}
                                </span>
                                                                <span className="text-slate-400">ID: {t.orderDetailId}</span>
                                                                {t.orderedAt && <TimeChip iso={t.orderedAt} />}
                                                            </div>
                                                            {t.notes && (
                                                                <div className="bg-amber-500/20 border-l-4 border-amber-500 px-3 py-2 rounded">
                                                                    <span className="text-amber-400 font-semibold text-sm">📝 {t.notes}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col items-end gap-2">
                                                            <TimerBadge startIso={startIso} endIso={endIso} status={t.status} serverNowMs={serverNowMs} />

                                                            {showCancelBecauseOOS && (
                                                                <Button variant="destructive" size="sm" className="font-bold" onClick={() => void cancelOutOfStock(t)}>
                                                                    Hủy món
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {showActions && (
                                                        <>
                                                            <Separator className="my-4 bg-slate-700" />
                                                            <div className="flex items-center justify-end gap-2">
                                                                {t.quantity >= 2 && (
                                                                    <Button
                                                                        size="lg"
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg px-6"
                                                                        onClick={() => void completeOneUnit(t.orderDetailId)}
                                                                    >
                                                                        XONG 1 ›
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    size="lg"
                                                                    className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg px-6"
                                                                    onClick={() => void completeAllUnits(t.orderDetailId)}
                                                                >
                                                                    XONG TẤT ››
                                                                </Button>
                                                                <Button
                                                                    size="lg"
                                                                    variant="destructive"
                                                                    className="font-bold shadow-lg px-6"
                                                                    onClick={() => confirmCancel(() => updateStatus(t.orderDetailId, "CANCELED"))}
                                                                >
                                                                    HỦY
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

                            {/* By Dish Tab */}
                            <TabsContent value="byDish">
                                {byDish.length === 0 ? (
                                    <EmptyState title="Không có nhóm món" />
                                ) : (
                                    <ul className="grid gap-3">
                                        {byDish.map((g) => (
                                            <li key={g.key} className="rounded-xl bg-slate-900 border-2 border-slate-700 p-4 shadow-lg">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="text-xl font-bold text-white">{g.name}</div>
                                                    <Badge className="bg-orange-500 hover:bg-orange-500 text-lg font-bold px-4 py-2">TỔNG: {g.totalQty}</Badge>
                                                </div>
                                                {g.notes && (
                                                    <div className="bg-amber-500/20 border-l-4 border-amber-500 px-3 py-2 rounded mb-3">
                                                        <span className="text-amber-400 font-semibold text-sm">📝 {g.notes}</span>
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-2">
                                                    {g.items.slice(0, 8).map((t) => (
                                                        <span
                                                            key={t.orderDetailId}
                                                            className="bg-slate-800 border border-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold"
                                                        >
                              Bàn {t.tableNumber} ×{t.quantity}
                            </span>
                                                    ))}
                                                    {g.items.length > 8 && <span className="text-slate-400 font-semibold">+{g.items.length - 8} bàn...</span>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </TabsContent>

                            {/* By Table Tab */}
                            <TabsContent value="byTable">
                                {byTable.length === 0 ? (
                                    <EmptyState title="Không có bàn nào" />
                                ) : (
                                    <ul className="grid gap-3">
                                        {byTable.map((g) => (
                                            <li key={g.key} className="rounded-xl bg-slate-900 border-2 border-slate-700 p-4 shadow-lg">
                                                <div className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                                    <span className="bg-orange-500 px-3 py-1 rounded-lg">BÀN {g.table}</span>
                                                </div>
                                                <ul className="space-y-2">
                                                    {g.items.map((t) => (
                                                        <li
                                                            key={t.orderDetailId}
                                                            className="flex items-center justify-between bg-slate-800 px-4 py-3 rounded-lg border border-slate-700"
                                                        >
                              <span
                                  className={["font-semibold text-base", isUnavailable(t.menuItemId) ? "text-red-400" : "text-white"].join(" ")}
                              >
                                {t.dishName}
                              </span>
                                                            <span className="bg-orange-500 text-white font-bold px-3 py-1 rounded-full">×{t.quantity}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* RIGHT: Ready to Serve */}
                <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-green-500 p-4">
                        <h2 className="text-xl font-bold tracking-wide text-white">✅ ĐÃ XONG</h2>
                    </div>
                    <div className="p-4">
                        {ready.length === 0 ? (
                            <EmptyState title="Chưa có món nào hoàn tất">
                                <Button variant="outline" onClick={() => void onRefreshAll()} className="mt-4 bg-slate-900 border-slate-700 text-white hover:bg-slate-700">
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
                                                    "rounded-xl p-4 shadow-lg border-2",
                                                    outOfStock
                                                        ? "bg-red-950 border-red-600"
                                                        : highlightNew
                                                            ? "bg-green-950 border-green-500 ring-4 ring-green-500/50 animate-pulse"
                                                            : "bg-green-950 border-green-600",
                                                ]
                                                    .filter(Boolean)
                                                    .join(" ")}
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <div className={["text-lg font-bold", outOfStock ? "text-red-400" : "text-green-400"].join(" ")}>{t.dishName}</div>
                                                            <QtyPill qty={t.quantity} accent="green" />
                                                            {highlightNew && <Badge className="bg-green-500 hover:bg-green-500 font-bold px-3 py-1">⭐ MỚI</Badge>}
                                                            {outOfStock && <Badge className="bg-red-600 hover:bg-red-600 font-bold px-3 py-1">❌ HẾT</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-green-800 text-green-200 px-3 py-1.5 rounded-lg font-bold text-sm border border-green-700">BÀN {t.tableNumber}</span>
                                                            <span className="text-green-400 text-xs">ID: {t.orderDetailId}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Separator className="my-3 bg-green-800" />
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="secondary" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold" onClick={() => void onRollback(t)}>
                                                        <Undo2 className="mr-1 h-4 w-4" />
                                                        Rollback
                                                    </Button>
                                                    {t.quantity > 2 && (
                                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold" onClick={() => void serveOneUnit(t.orderDetailId)}>
                                                            Phục vụ 1 ›
                                                        </Button>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ======= Timer Badge (neo theo serverNowMs, không tự setInterval) ======= */
function TimerBadge({
                        startIso,
                        endIso,
                        status,
                        serverNowMs,
                    }: {
    startIso?: string | null;
    endIso?: string | null;
    status?: string;
    serverNowMs: number;
}) {
    const startMs = startIso ? Date.parse(startIso) : NaN;
    const endMs = endIso ? Date.parse(endIso) : NaN;

    const [sec, setSec] = useState<number>(() => {
        if (!startIso) return 0;
        const end = Number.isFinite(endMs) ? endMs : serverNowMs;
        return Math.max(0, Math.floor((end - startMs) / 1000));
    });

    // Cập nhật mỗi khi "giờ server" tick (1s), hoặc khi mốc vào/ra thay đổi
    useEffect(() => {
        if (!startIso) {
            setSec(0);
            return;
        }
        const end = Number.isFinite(endMs) ? endMs : serverNowMs;
        setSec(Math.max(0, Math.floor((end - startMs) / 1000)));
    }, [serverNowMs, startIso, endIso, startMs, endMs]);

    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");

    const n = normStatus(status);
    const warn = (n === "PENDING" && sec >= 5 * 60) || (n === "IN_PROGRESS" && sec >= 10 * 60);

    const cls =
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-base font-bold shadow-lg border-2 " +
        (n === "DONE"
            ? "bg-green-600 text-white border-green-500"
            : warn
                ? "bg-red-600 text-white border-red-500 animate-pulse"
                : "bg-slate-700 text-white border-slate-600");

    return (
        <span className={cls} title="Thời gian ở bếp">
      <Timer className="h-4 w-4" />
            {startIso ? `${mm}:${ss}` : "--:--"}
    </span>
    );
}

/* ======= UI Components ======= */
function EmptyState({ title, children }: { title: string; children?: React.ReactNode }): JSX.Element {
    return (
        <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-900 p-8 text-center">
            <div className="text-lg font-bold text-slate-300">{title}</div>
            <div className="mt-3 text-sm text-slate-400">{children ?? "—"}</div>
        </div>
    );
}

function QtyPill({ qty, accent }: { qty: number; accent?: "green" | "gray" }): JSX.Element {
    const base = "rounded-full px-3 py-1.5 text-sm font-black shadow-lg border-2";
    if (accent === "green") {
        return <span className={`${base} border-green-500 bg-green-600 text-white`}>×{qty}</span>;
    }
    return <span className={`${base} border-orange-500 bg-orange-600 text-white`}>×{qty}</span>;
}

function TimeChip({ iso }: { iso: string }): JSX.Element {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300">
      <Clock className="h-3 w-3" />
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
function normStatus(s?: string): "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELED" | string {
    return (s || "").trim().toUpperCase().replace(/[-\s]+/g, "_");
}
function isPending(s?: string): boolean {
    return normStatus(s) === "PENDING";
}
function isInProgress(s?: string): boolean {
    return normStatus(s) === "IN_PROGRESS";
}
function confirmCancel(run: () => void): void {
    if (window.confirm("Bạn chắc chắn muốn hủy món này?")) run();
}