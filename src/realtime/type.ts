// src/realtime/types.ts
import type { KitchenTicketDto } from "@/api/kitchenApi";
import {KitchenTicket} from "@/realtime/sources/RestPollSource.ts";

export type TicketEvent =
    | { type: "BOARD_SNAPSHOT"; payload: { items: KitchenTicket[]; serverTime: string } }
    | { type: "TICKET_UPSERT"; payload: KitchenTicket }
    | { type: "TICKET_REMOVE"; payload: { id: number } };

export type AvailabilityEvent = {
    type: "MENU_AVAILABILITY";
    payload: { menuItemId: number; available: boolean };
};

export type KitchenSourceEvent = TicketEvent | AvailabilityEvent;
