import { WsSource } from "./sources/WsSource";
import type {
  IKitchenSource,
  KitchenRealtimeEvent,
  Unsubscribe,
} from "./sources/IKitchenSource";
import api from "@/api/axiosInstance";

/** Lấy origin BE từ axios.baseURL ("http://localhost:8082/api" -> "http://localhost:8082") */
function resolveApiBase(): string {
  const raw = (api.defaults.baseURL ?? "").trim();
  if (!raw) return "http://localhost:8082";
  const noTrail = raw.replace(/\/+$/, "");
  return noTrail.endsWith("/api") ? noTrail.slice(0, -4) : noTrail;
}

export function createKitchenSource(
  onEvent: (e: KitchenRealtimeEvent) => void
): IKitchenSource {
  const baseUrl = resolveApiBase();
  const topics = ["/topic/kitchen/board"];

  // --- SỬA Ở ĐÂY ---
  // 1. Chỉ tạo WsSource
  const ws = new WsSource({ baseUrl, topics, onEvent });

  // 2. Xóa hoàn toàn logic của RestPollSource (poll) và fallback
  // let poll: RestPollSource | null = ... (ĐÃ XÓA)
  // const unsub: Unsubscribe = ... (ĐÃ XÓA)

  return {
    start() {
      // if (poll) poll.start(); // (ĐÃ XÓA)
      ws.start(); // Chỉ khởi động WebSocket
    },
    stop() {
      // unsub(); // (ĐÃ XÓA)
      ws.stop();
      // if (poll) poll.stop(); // (ĐÃ XÓA)
    },
    onConnectionChange: ws.onConnectionChange.bind(ws),
    isConnected: () => ws.isConnected(),
  };
}
