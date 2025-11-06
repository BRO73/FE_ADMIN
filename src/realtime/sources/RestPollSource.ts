import axios from "@/api/axiosInstance";
import type { KitchenRealtimeEvent } from "./IKitchenSource";

type Props = {
    intervalMs?: number;
    onEvent: (e: KitchenRealtimeEvent) => void;
};

export class RestPollSource {
    private timer: number | null = null;
    private inFlight = false;
    private readonly intervalMs: number;
    private readonly onEvent: (e: KitchenRealtimeEvent) => void;

    constructor(props: Props) {
        this.intervalMs = props.intervalMs ?? 5000;
        this.onEvent = props.onEvent;
    }

    public start(): void {
        if (this.timer) return;

        const tick = async () => {
            if (this.inFlight) {
                this.timer = window.setTimeout(tick, this.intervalMs);
                return;
            }
            this.inFlight = true;
            try {
                const res = await axios.get("/kitchen/board", { params: { limit: 200 } });
                this.onEvent({ type: "BOARD_SNAPSHOT", payload: res.data });
            } catch {
                // im lặng
            } finally {
                this.inFlight = false;
                this.timer = window.setTimeout(tick, this.intervalMs);
            }
        };

        this.timer = window.setTimeout(tick, 0);
    }

    public stop(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.inFlight = false;
    }
}
