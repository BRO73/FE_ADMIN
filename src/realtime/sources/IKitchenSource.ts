// src/realtime/sources/IKitchenSource.ts

export type KitchenRealtimeEvent =
    | { type: "BOARD_SNAPSHOT"; payload: unknown }
    | { type: "PING"; payload?: unknown };

export type Unsubscribe = () => void;

export interface IKitchenSource {
    /** Bắt đầu (mở WS / bật polling khi cần) */
    start(): void;

    /** Dừng toàn bộ (đóng WS / clear interval) */
    stop(): void;

    /** Theo dõi trạng thái kết nối WS (true/false) */
    onConnectionChange(listener: (connected: boolean) => void): Unsubscribe;

    /** Đã kết nối WS hay chưa */
    isConnected(): boolean;
}