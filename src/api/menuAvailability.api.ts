// src/api/menuAvailability.api.ts
import api from "@/api/axiosInstance";

export interface MenuItemLite {
    id: number;
    name: string;
    price: number;
    available: boolean;
}

export async function fetchAllMenuItemsLite(): Promise<MenuItemLite[]> {
    const { data } = await api.get("/menu-items");
    return (data as Array<Record<string, unknown>>).map((x) => ({
        id: x.id as number,
        name: String(x.name),
        price: Number(x.price),
        available: String(x.status).toLowerCase() === "available",
    }));
}

export async function setMenuAvailability(id: number, available: boolean): Promise<void> {
    await api.patch(`/menu/items/${id}/availability`, { available });
}
