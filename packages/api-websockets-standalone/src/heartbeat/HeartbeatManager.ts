import type { WebsocketsConnectionManager } from "~/connectionManager/abstractions.js";

export class HeartbeatManager {
    private readonly connectionManager: WebsocketsConnectionManager.Interface<unknown>;
    private readonly interval: number;
    private timer: ReturnType<typeof setInterval> | undefined;

    public constructor(
        connectionManager: WebsocketsConnectionManager.Interface<unknown>,
        interval: number
    ) {
        this.connectionManager = connectionManager;
        this.interval = interval;
    }

    public start(): void {
        this.timer = setInterval(() => {
            this.connectionManager.cleanup(5 * this.interval);
        }, this.interval);
    }

    public stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }
}
