import axios from "./axiosInstance";

export type OrderItemStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELED" | "SERVED";

export interface KitchenTicketDto {
    orderDetailId: number;
    orderId: number | null;
    tableNumber: string | null;
    menuItemId: number | null;
    dishName: string | null;
    quantity: number;
    status: string;
    notes?: string | null;
    orderedAt: string; // ISO-UTC, có 'Z'
    elapsedSeconds?: number;
    overtime?: boolean;
}

export interface KitchenBoardPayload {
    serverTime: string; // ISO-UTC, có 'Z'
    items: KitchenTicketDto[];
}

export async function fetchKitchenBoard(limit = 200): Promise<KitchenBoardPayload> {
    const { data } = await axios.get("/kitchen/board", { params: { limit } });
    return data as KitchenBoardPayload;
}

export async function apiUpdateStatus(orderDetailId: number, status: OrderItemStatus): Promise<void> {
    await axios.patch(`/kitchen/order-details/${orderDetailId}/status`, { status });
}

export async function apiCompleteOneUnit(orderDetailId: number): Promise<void> {
    await axios.patch(`/kitchen/order-details/${orderDetailId}/complete-one`);
}

export async function apiCompleteAllUnits(orderDetailId: number): Promise<void> {
    await axios.patch(`/kitchen/order-details/${orderDetailId}/complete-all`);
}

export async function apiServeOneUnit(orderDetailId: number): Promise<void> {
    await axios.patch(`/kitchen/order-details/${orderDetailId}/serve-one`);
}