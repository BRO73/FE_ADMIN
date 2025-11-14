// src/realtime/sources/WsSource.ts
import SockJS from "sockjs-client";
import { Client, IMessage, IFrame, IStompSocket } from "@stomp/stompjs";
import type { KitchenRealtimeEvent } from "./IKitchenSource";
import api from "@/api/axiosInstance";

type Props = {
  baseUrl: string;
  topics: string[];
  onEvent: (e: KitchenRealtimeEvent) => void;
};

type ConnListener = (connected: boolean) => void;

function getAuthHeader(): string | undefined {
  const token =
    (api.defaults.headers.common?.Authorization as string | undefined) ??
    (api.defaults.headers.common?.authorization as string | undefined);
  if (token && token.startsWith("Bearer ")) return token;
  return undefined;
}

export class WsSource {
  private readonly props: Props;
  private client: Client | null = null;
  private connected = false;
  private unsubscribers: Array<() => void> = [];
  private connListeners: Set<ConnListener> = new Set();

  constructor(props: Props) {
    this.props = props;
    console.log("🔧 [WS] Initializing with baseUrl:", props.baseUrl);
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public onConnectionChange(listener: ConnListener): () => void {
    this.connListeners.add(listener);
    return () => this.connListeners.delete(listener);
  }

  private notifyConn(connected: boolean): void {
    if (this.connected === connected) return;
    this.connected = connected;
    console.log(connected ? "🟢 [WS] Connected" : "🔴 [WS] Disconnected");
    for (const l of this.connListeners) l(connected);
  }

  public start(): void {
    if (this.client && this.client.active) {
      console.log("⚠️ [WS] Already started");
      return;
    }

    const wsUrl = `${this.props.baseUrl}/ws`;
    const auth = getAuthHeader();

    console.log("🚀 [WS] Starting connection to:", wsUrl);
    if (auth) {
      console.log("🔐 [WS] Using auth token:", auth.substring(0, 20) + "...");
    }

    const stomp = new Client({
      webSocketFactory: () => {
        console.log("🔌 [WS] Creating SockJS connection...");
        return new SockJS(wsUrl) as unknown as IStompSocket;
      },
      reconnectDelay: 1000,
      onStompError: (frame: IFrame) => {
        console.error(
          "❌ [WS] STOMP error:",
          frame.headers["message"],
          frame.body
        );
      },
      onWebSocketClose: (evt: CloseEvent) => {
        console.warn("🔌 [WS] Socket closed:", evt.code, evt.reason);
        this.notifyConn(false);
      },
      onWebSocketError: (evt: Event) => {
        console.error("❌ [WS] Socket error:", evt);
      },
      debug: (msg: string) => {
        // Bật debug để thấy tất cả traffic
        console.log("🐛 [WS][debug]", msg);
      },
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: auth ? { Authorization: auth } : {},
    });

    let nextDelay = 1000;
    const maxDelay = 15000;
    const baseDelay = 1000;

    stomp.onDisconnect = () => {
      console.log("↩️ [WS] Disconnected, will reconnect...");
      this.notifyConn(false);
      nextDelay = Math.min(maxDelay, nextDelay + baseDelay * 2);
      stomp.reconnectDelay = nextDelay;
    };

    stomp.onConnect = () => {
      console.log("🎉 [WS] CONNECTED SUCCESSFULLY!");
      nextDelay = baseDelay;
      stomp.reconnectDelay = baseDelay;

      this.props.topics.forEach((topic) => {
        console.log("📡 [WS] Subscribing to topic:", topic);

        const sub = stomp.subscribe(topic, (msg: IMessage) => {
          console.log("📨 [WS] ===== MESSAGE RECEIVED =====");
          console.log("📨 [WS] Raw body:", msg.body);

          try {
            const body = msg.body ? (JSON.parse(msg.body) as unknown) : null;
            console.log("📦 [WS] Parsed payload:", body);

            // Log số lượng items nếu có
            if (body && typeof body === "object" && "items" in body) {
              const items = (body as any).items;
              if (Array.isArray(items)) {
                console.log("📊 [WS] Items count:", items.length);
              }
            }

            this.props.onEvent({ type: "BOARD_SNAPSHOT", payload: body });
            console.log("✅ [WS] Event dispatched to handler");
          } catch (e) {
            console.error("❌ [WS] Failed to parse JSON:", e);
            console.error("❌ [WS] Raw body was:", msg.body);
          }
        });

        console.log("✅ [WS] Subscribed to:", topic);

        this.unsubscribers.push(() => {
          try {
            sub.unsubscribe();
            console.log("🔕 [WS] Unsubscribed from:", topic);
          } catch (err) {
            console.error("⚠️ [WS] Error unsubscribing:", err);
          }
        });
      });

      this.notifyConn(true);
    };

    stomp.activate();
    this.client = stomp;
    console.log("⏳ [WS] Activation initiated...");
  }

  public async stop(): Promise<void> {
    console.log("🛑 [WS] Stopping...");
    try {
      this.unsubscribers.forEach((u) => u());
      this.unsubscribers = [];
      if (this.client) {
        await this.client.deactivate();
      }
    } finally {
      this.client = null;
      this.notifyConn(false);
      console.log("✅ [WS] Stopped");
    }
  }
}
