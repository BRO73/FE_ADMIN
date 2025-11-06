import type { KitchenSourceEvent } from "@/realtime/type";

export interface IKitchenSource {
    start(): void;
    stop(): void;
    onEvent(cb: (e: KitchenSourceEvent) => void): () => void;
    isConnected(): boolean;
}
