import type { WebsocketsConnectionManager } from "~/connectionManager/abstractions.js";
import type { WebsocketsServerAdapter } from "~/adapter/abstractions.js";

const STALE_CLOSE_CODE = 1001;
const STALE_CLOSE_REASON = "Connection went stale.";

/*
 * Evicts connections that have not been seen for `staleAfter` milliseconds: forgets them and closes
 * their sockets.
 *
 * `staleAfter` must sit well above the client's ping interval. The admin pings every 5 minutes and
 * browsers delay timers in hidden tabs by up to a minute, so a threshold equal to the ping interval
 * evicted healthy background tabs. Closing the socket is what lets the client notice and reconnect:
 * an evicted socket left open looks connected to the client but no longer receives anything.
 */
export class HeartbeatManager {
    private timer: ReturnType<typeof setInterval> | undefined;

    public constructor(
        private readonly connectionManager: WebsocketsConnectionManager.Interface<unknown>,
        private readonly adapter: WebsocketsServerAdapter.Interface<unknown>,
        private readonly interval: number,
        private readonly staleAfter: number
    ) {}

    public start(): void {
        this.timer = setInterval(() => {
            void this.evictStale();
        }, this.interval);
    }

    public stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    public async evictStale(): Promise<void> {
        // Cleanup forgets the sockets it evicts, so take them before it runs.
        const sockets = new Map<string, unknown>();
        for (const connectionId of this.connectionManager.getActiveConnectionIds()) {
            sockets.set(connectionId, this.connectionManager.getSocket(connectionId));
        }

        let evicted: string[];
        try {
            evicted = await this.connectionManager.cleanup(this.staleAfter);
        } catch (error) {
            console.error("Failed to evict stale WebSocket connections:", error);
            return;
        }

        for (const connectionId of evicted) {
            const socket = sockets.get(connectionId);
            if (socket === undefined) {
                continue;
            }
            try {
                this.adapter.close(socket, STALE_CLOSE_CODE, STALE_CLOSE_REASON);
            } catch (error) {
                console.error(`Failed to close stale WebSocket "${connectionId}":`, error);
            }
        }
    }
}
