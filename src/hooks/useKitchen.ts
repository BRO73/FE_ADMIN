import { useEffect, useRef, useState, useCallback } from "react";
import { createKitchenSource } from "@/realtime/KitchenSourceFactory";
import type { IKitchenSource, KitchenRealtimeEvent } from "@/realtime/sources/IKitchenSource";
import {
    type KitchenTicketDto,
    type OrderItemStatus,
    fetchKitchenBoard,
    apiUpdateStatus,
    apiCompleteOneUnit,
    apiCompleteAllUnits,
    apiServeOneUnit,
    type KitchenBoardPayload,
} from "@/api/kitchenApi";

type TicketsShape = {
    pending: KitchenTicketDto[];
    inProgress: KitchenTicketDto[];
    ready: KitchenTicketDto[];       // alias readyToServe
    readyToServe: KitchenTicketDto[];
};

type UseKitchenOpts = { intervalMs?: number };

function normStatus(s?: string): "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELED" | "SERVED" | string {
    return (s ?? "").trim().toUpperCase().replace(/[-\s]+/g, "_");
}
function isBoard(v: unknown): v is KitchenBoardPayload {
    return !!v && typeof v === "object" && Array.isArray((v as { items?: unknown }).items);
}
function groupItems(items: KitchenTicketDto[]): TicketsShape {
    const pending: KitchenTicketDto[] = [];
    const inProgress: KitchenTicketDto[] = [];
    const ready: KitchenTicketDto[] = [];
    for (const it of items) {
        const s = normStatus(it.status);
        if (s === "PENDING") pending.push(it);
        else if (s === "IN_PROGRESS") inProgress.push(it);
        else if (s === "DONE") ready.push(it);
    }
    return { pending, inProgress, ready, readyToServe: ready };
}

export function useKitchen({ intervalMs = 5000 }: UseKitchenOpts = {}) {
    const [board, setBoard] = useState<KitchenBoardPayload | null>(null);
    const [tickets, setTickets] = useState<TicketsShape>({ pending: [], inProgress: [], ready: [], readyToServe: [] });
    const [connected, setConnected] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // clock từ server
    const [serverNowMs, setServerNowMs] = useState<number>(Date.now());
    const serverOffsetRef = useRef<number>(0);
    const tickIdRef = useRef<number | null>(null);

    const sourceRef = useRef<IKitchenSource | null>(null);
    const lastServerTimeRef = useRef<string | null>(null);
    const firstSnapshotArrivedRef = useRef<boolean>(false);

    const startTicker = useCallback(() => {
        if (tickIdRef.current != null) return;
        const tick = () => {
            setServerNowMs(Date.now() + serverOffsetRef.current);
            tickIdRef.current = window.setTimeout(tick, 1000);
        };
        tick();
    }, []);

    const stopTicker = useCallback(() => {
        if (tickIdRef.current != null) {
            window.clearTimeout(tickIdRef.current);
            tickIdRef.current = null;
        }
    }, []);

    const updateServerOffset = useCallback((serverIso: string) => {
        const serverMs = Date.parse(serverIso);
        const clientMs = Date.now();
        serverOffsetRef.current = serverMs - clientMs;
        setServerNowMs(clientMs + serverOffsetRef.current);
        startTicker();
    }, [startTicker]);

    const applySnapshot = useCallback((payload: KitchenBoardPayload) => {
        setBoard(payload);
        setTickets(groupItems(payload.items ?? []));
        lastServerTimeRef.current = payload.serverTime ?? null;
        setError(null);
        if (payload.serverTime) updateServerOffset(payload.serverTime);
        if (!firstSnapshotArrivedRef.current) {
            firstSnapshotArrivedRef.current = true;
            setLoading(false);
        }
    }, [updateServerOffset]);

    const handleEvent = useCallback((evt: KitchenRealtimeEvent) => {
        if (evt.type !== "BOARD_SNAPSHOT") return;
        if (!isBoard(evt.payload)) {
            setError("Invalid board payload");
            return;
        }
        if (evt.payload.serverTime && evt.payload.serverTime === lastServerTimeRef.current) return;
        applySnapshot(evt.payload);
    }, [applySnapshot]);

    useEffect(() => {
        setLoading(true);
        const src = createKitchenSource(handleEvent);
        sourceRef.current = src;
        src.onConnectionChange(setConnected);
        src.start();

        (async () => {
            try {
                const snap = await fetchKitchenBoard(200);
                if (isBoard(snap)) applySnapshot(snap);
            } catch {
                // im lặng, WS/poll chạy tiếp
            } finally {
                if (firstSnapshotArrivedRef.current) setLoading(false);
            }
        })();

        return () => {
            src.stop();
            sourceRef.current = null;
            stopTicker();
        };
    }, [handleEvent, applySnapshot, stopTicker]);

    /* ===== Actions ===== */
    const refresh = useCallback(async (): Promise<void> => {
        setLoading(true);
        try {
            const snap = await fetchKitchenBoard(200);
            if (isBoard(snap)) applySnapshot(snap);
        } finally {
            setLoading(false);
        }
    }, [applySnapshot]);

    const updateStatus = useCallback(async (orderDetailId: number, status: OrderItemStatus): Promise<void> => {
        await apiUpdateStatus(orderDetailId, status);
        await refresh();
    }, [refresh]);

    const completeOneUnit = useCallback(async (orderDetailId: number): Promise<void> => {
        await apiCompleteOneUnit(orderDetailId);
        await refresh();
    }, [refresh]);

    const completeAllUnits = useCallback(async (orderDetailId: number): Promise<void> => {
        await apiCompleteAllUnits(orderDetailId);
        await refresh();
    }, [refresh]);

    const serveOneUnit = useCallback(async (orderDetailId: number): Promise<void> => {
        await apiServeOneUnit(orderDetailId);
        await refresh();
    }, [refresh]);

    return {
        board,
        tickets,
        connected,
        error: error ?? "",
        loading,
        serverNowMs, // cho TimerBadge
        refresh,
        updateStatus,
        completeOneUnit,
        completeAllUnits,
        serveOneUnit,
    };
}