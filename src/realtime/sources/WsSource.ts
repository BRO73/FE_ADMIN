// src/realtime/sources/WsSource.ts
import SockJS from "sockjs-client";
import { Client, IMessage, IFrame, IStompSocket } from "@stomp/stompjs";
import type { KitchenRealtimeEvent } from "./IKitchenSource";
import api from "@/api/axiosInstance";

type Props = {
    baseUrl: string;                  // ví dụ: http://localhost:8082
    topics: string[];                 // ví dụ: ["/topic/kitchen/board"]
    onEvent: (e: KitchenRealtimeEvent) => void;
};

type ConnListener = (connected: boolean) => void;

function getAuthHeader(): string | undefined {
    // Lấy token sẵn có của axios (nếu bạn set ở interceptor)
    const token = (api.defaults.headers.common?.Authorization as string | undefined) ??
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
        for (const l of this.connListeners) l(connected);
    }

    public start(): void {
        if (this.client && this.client.active) {
            return;
        }

        const wsUrl = `${this.props.baseUrl}/ws`;
        const auth = getAuthHeader();

        const stomp = new Client({
            webSocketFactory: () => new SockJS(wsUrl) as unknown as IStompSocket,
            reconnectDelay: 1000,                // ms, bước đầu
            // Tăng dần reconnectDelay (exponential-ish)
            onStompError: (frame: IFrame) => {
                // Lỗi cấp broker (ví dụ không được SUBSCRIBE)
                console.error("[WS] STOMP error:", frame.headers["message"], frame.body);
            },
            onWebSocketClose: (evt: CloseEvent) => {
                console.warn("[WS] socket closed:", evt.code, evt.reason);
                this.notifyConn(false);
            },
            debug: (msg: string) => {
                // comment nếu quá ồn
                // console.log("[WS][debug]", msg);
            },
            // Heartbeats (ms)
            heartbeatIncoming: 10000,            // server -> client
            heartbeatOutgoing: 10000,            // client -> server
            connectHeaders: auth ? { Authorization: auth } : {},
        });

        // Tuning backoff: tăng dần reconnectDelay mỗi lần disconnect
        let nextDelay = 1000;
        const maxDelay = 15000;
        const baseDelay = 1000;

        stomp.onDisconnect = () => {
            this.notifyConn(false);
            // tăng delay (có trần)
            nextDelay = Math.min(maxDelay, nextDelay + baseDelay * 2);
            stomp.reconnectDelay = nextDelay;
        };

        stomp.onConnect = () => {
            // reset delay khi thành công
            nextDelay = baseDelay;
            stomp.reconnectDelay = baseDelay;

            // Đăng ký các topic
            this.props.topics.forEach((topic) => {
                const sub = stomp.subscribe(topic, (msg: IMessage) => {
                    // parse JSON an toàn
                    try {
                        const body = msg.body ? JSON.parse(msg.body) as unknown : null;

                        // Chuẩn hóa event: FE đang expect BOARD_SNAPSHOT
                        this.props.onEvent({ type: "BOARD_SNAPSHOT", payload: body });
                    } catch (e) {
                        console.error("[WS] invalid JSON payload:", e);
                    }
                });

                // Lưu hàm hủy
                this.unsubscribers.push(() => {
                    try { sub.unsubscribe(); } catch { /**/ }
                });
            });

            this.notifyConn(true);
        };

        stomp.activate();
        this.client = stomp;
    }

    public async stop(): Promise<void> {
        try {
            this.unsubscribers.forEach((u) => u());
            this.unsubscribers = [];
            if (this.client) {
                await this.client.deactivate();
            }
        } finally {
            this.client = null;
            this.notifyConn(false);
        }
    }
}
