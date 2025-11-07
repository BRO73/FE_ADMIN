import type { KitchenTicketDto } from "../api/kitchenApi";

export type KitchenTicket = KitchenTicketDto;
export type TabKey = "priority" | "byDish" | "byTable";

export type GroupDish = {
    key: string;
    name: string;
    notes?: string | null;
    items: KitchenTicket[];
    earliest: number;
    totalQty: number;
};

export type GroupTable = { key: string; table: string; items: KitchenTicket[] };

export type TicketsShape = {
    pending?: KitchenTicket[];
    inProgress?: KitchenTicket[];
    readyToServe?: KitchenTicket[];
    ready?: KitchenTicket[];
} | null | undefined;

export type MaybeTimed = Partial<{
    queuedAt: string | null;
    startedAt: string | null;
    doneAt: string | null;
}>;

export interface UseKitchenReturn {
    loading: boolean;
    error: string | null;
    tickets: TicketsShape;
    connected: boolean;
    updateStatus: (orderDetailId: number, status: string) => Promise<void>;
    refresh: () => Promise<void>;
    completeOneUnit: (orderDetailId: number) => void;
    completeAllUnits: (orderDetailId: number) => void;
    serveOneUnit: (orderDetailId: number) => void;
    serverNowMs: number;
}