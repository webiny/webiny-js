import type http from "node:http";

/**
 * Counts the HTTP requests the server is still answering, so shutdown can wait for them. Upgraded
 * (WebSocket) connections are not requests and are not counted.
 */
export class InFlightRequests {
    private count = 0;
    private waiters: Array<() => void> = [];

    /** Counts the request until its response closes, whether it finished or the client went away. */
    public track(res: http.ServerResponse): void {
        this.count++;
        res.once("close", () => {
            this.count--;
            if (this.count === 0) {
                this.release();
            }
        });
    }

    /** Resolves once no request is in flight; at once if none is. */
    public drained(): Promise<void> {
        if (this.count === 0) {
            return Promise.resolve();
        }
        return new Promise<void>(resolve => {
            this.waiters.push(resolve);
        });
    }

    private release(): void {
        const waiters = this.waiters;
        this.waiters = [];
        for (const resolve of waiters) {
            resolve();
        }
    }
}
