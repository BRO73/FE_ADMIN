import { RestPollSource } from "./sources/RestPollSource";
import { WsSource } from "./sources/WsSource";
import type { IKitchenSource, KitchenRealtimeEvent, Unsubscribe } from "./sources/IKitchenSource";
import api from "@/api/axiosInstance";

/** Lấy origin BE từ axios.baseURL ("http://localhost:8082/api" -> "http://localhost:8082") */
function resolveApiBase(): string {
    const raw = (api.defaults.baseURL ?? "").trim();
    if (!raw) return "http://localhost:8082";
    const noTrail = raw.replace(/\/+$/, "");
    return noTrail.endsWith("/api") ? noTrail.slice(0, -4) : noTrail;
}

export function createKitchenSource(onEvent: (e: KitchenRealtimeEvent) => void): IKitchenSource {
    const baseUrl = resolveApiBase();
    const topics = ["/topic/kitchen/board"];

    const ws = new WsSource({ baseUrl, topics, onEvent });
    let poll: RestPollSource | null = new RestPollSource({
        intervalMs: 5000,
        onEvent,
    });

    const unsub: Unsubscribe = ws.onConnectionChange((connected) => {
        if (connected) {
            if (poll) {
                poll.stop();
                poll = null;
            }
        } else if (!poll) {
            poll = new RestPollSource({ intervalMs: 5000, onEvent });
            poll.start();
        }
    });

    return {
        start() {
            if (poll) poll.start(); // chạy trước khi WS sẵn sàng
            ws.start();
        },
        stop() {
            unsub();
            ws.stop();
            if (poll) poll.stop();
        },
        onConnectionChange: ws.onConnectionChange.bind(ws),
        isConnected: () => ws.isConnected(),
    };
}