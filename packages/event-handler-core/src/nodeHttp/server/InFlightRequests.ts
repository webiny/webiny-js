import type http from "node:http";

/**
 * Counts the HTTP requests the server is still answering, so shutdown can wait for them. Upgraded
 * (WebSocket) connections are not requests and are not counted.
 */
export class InFlightRequests {
    private readonly responses = new Set<http.ServerResponse>();
    private draining = false;
    private waiters: Array<() => void> = [];

    /** Counts the request until its response closes, whether it finished or the client went away. */
    public track(res: http.ServerResponse): void {
        this.responses.add(res);
        if (this.draining) {
            this.closeConnectionAfter(res);
        }
        res.once("close", () => {
            this.responses.delete(res);
            if (this.responses.size === 0) {
                this.release();
            }
        });
    }

    /**
     * Resolves once no request is in flight; at once if none is. From the first call on, every
     * response, the ones in flight included, closes its connection once sent: a keep-alive client
     * would otherwise send its next request on it, and the exit would cut that request off.
     */
    public drain(): Promise<void> {
        if (!this.draining) {
            this.draining = true;
            for (const res of this.responses) {
                this.closeConnectionAfter(res);
            }
        }
        if (this.responses.size === 0) {
            return Promise.resolve();
        }
        return new Promise<void>(resolve => {
            this.waiters.push(resolve);
        });
    }

    private closeConnectionAfter(res: http.ServerResponse): void {
        if (!res.headersSent) {
            // The client learns not to reuse the connection, and Node closes it after the response.
            res.setHeader("connection", "close");
        }
        /*
         * A streamed response may have its headers out already, and an SSE response sets
         * `connection: keep-alive` itself, so the header above can be missing. The connection is
         * closed anyway; a request the client sends on it before it sees the close is reset unread.
         */
        res.once("finish", () => {
            res.req.socket.end();
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
