import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    fetchKitchenBoard,
    updateOrderDetailStatus,
    completeOne,
    serveOne,
    KitchenBoardCanonical,
    OrderItemStatus,
    KitchenTicketDto,
} from "../api/kitchenApi";

export interface UseKitchenArgs {
    storeName?: string;
    intervalMs?: number;
}

export interface UseKitchenResult {
    loading: boolean;
    error: string | null;
    connected: boolean;
    tickets: {
        pending: KitchenBoardCanonical["pending"];
        inProgress: KitchenBoardCanonical["inProgress"];
        ready: KitchenBoardCanonical["ready"];
    };
    refresh: () => Promise<void>;
    updateStatus: (orderDetailId: number, status: OrderItemStatus) => Promise<void>;
    completeOneUnit: (orderDetailId: number) => Promise<void>;
    completeAllUnits: (orderDetailId: number) => Promise<void>;
    serveOneUnit: (orderDetailId: number) => Promise<void>;
}

export function useKitchen(args: UseKitchenArgs = {}): UseKitchenResult {
    const { storeName, intervalMs = 3000 } = args;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<KitchenBoardCanonical | null>(null);
    const timerRef = useRef<number | null>(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const canonical = await fetchKitchenBoard(200, storeName);
            setData(canonical);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Unknown error");
        }
    }, [storeName]);

    useEffect(() => {
        setLoading(true);
        void load().finally(() => setLoading(false));
        if (intervalMs > 0) {
            timerRef.current = window.setInterval(() => void load(), intervalMs);
            return () => {
                if (timerRef.current) window.clearInterval(timerRef.current);
            };
        }
        return;
    }, [load, intervalMs]);

    const refresh = useCallback(async () => {
        setLoading(true);
        await load();
        setLoading(false);
    }, [load]);

    const clone = (src: KitchenBoardCanonical): KitchenBoardCanonical => JSON.parse(JSON.stringify(src));

    const ripFromAll = (src: KitchenBoardCanonical, id: number) => {
        const next = clone(src);
        let item: KitchenTicketDto | null = null;
        const rip = (arr: KitchenTicketDto[]) => {
            const i = arr.findIndex((x) => x.orderDetailId === id);
            if (i >= 0) {
                item = { ...arr[i] };
                arr.splice(i, 1);
            }
        };
        rip(next.pending);
        rip(next.inProgress);
        rip(next.ready);
        return { item, next };
    };

    const updateStatus = useCallback(
        async (orderDetailId: number, status: OrderItemStatus) => {
            const prev = data;
            try {
                if (prev) {
                    const { item, next } = ripFromAll(prev, orderDetailId);
                    if (item) {
                        const moved = { ...item, status };
                        if (status === "PENDING") next.pending.unshift(moved);
                        else if (status === "IN_PROGRESS") next.inProgress.unshift(moved);
                        else if (status === "DONE") next.ready.unshift(moved);
                        setData(next);
                    }
                }
                await updateOrderDetailStatus(orderDetailId, status);
                await load();
            } catch (e) {
                if (prev) setData(prev);
                throw e;
            }
        },
        [data, load]
    );

    const completeOneUnit = useCallback(
        async (orderDetailId: number) => {
            const prev = data;
            try {
                if (prev) {
                    const { item, next } = ripFromAll(prev, orderDetailId);
                    if (item) {
                        if (item.quantity > 1) {
                            // giảm 1 ở cột hiện tại
                            const remain = { ...item, quantity: item.quantity - 1 };
                            const st = (item.status || "").toUpperCase().replace(/[-\s]+/g, "_");
                            if (st === "PENDING") next.pending.unshift(remain);
                            else next.inProgress.unshift(remain);

                            // đưa 1 đơn vị sang ready
                            next.ready.unshift({ ...item, quantity: 1, status: "DONE" });
                        } else {
                            // chỉ còn 1 → coi như DONE
                            next.ready.unshift({ ...item, status: "DONE" });
                        }
                        setData(next);
                    }
                }
                await completeOne(orderDetailId);
                await load();
            } catch (e) {
                if (prev) setData(prev);
                throw e;
            }
        },
        [data, load]
    );

    const completeAllUnits = useCallback(
        async (orderDetailId: number) => {
            await updateStatus(orderDetailId, "DONE");
        },
        [updateStatus]
    );

    const serveOneUnit = useCallback(
        async (orderDetailId: number) => {
            const prev = data;
            try {
                if (prev) {
                    const { item, next } = ripFromAll(prev, orderDetailId);
                    if (item) {
                        if (item.quantity > 1) {
                            next.ready.unshift({ ...item, quantity: item.quantity - 1 }); // giảm 1
                        } // qty==1 → xoá khỏi board
                        setData(next);
                    }
                }
                await serveOne(orderDetailId);
                await load();
            } catch (e) {
                if (prev) setData(prev);
                throw e;
            }
        },
        [data, load]
    );

    const tickets = useMemo(
        () => ({
            pending: Array.isArray(data?.pending) ? data!.pending : [],
            inProgress: Array.isArray(data?.inProgress) ? data!.inProgress : [],
            ready: Array.isArray(data?.ready) ? data!.ready : [],
        }),
        [data]
    );

    return { loading, error, connected: true, tickets, refresh, updateStatus, completeOneUnit, completeAllUnits, serveOneUnit };
}
