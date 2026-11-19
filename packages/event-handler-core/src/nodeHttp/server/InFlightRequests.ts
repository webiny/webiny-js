import type http from "node:http";

/**
 * Counts the HTTP requests the server is still answering, so shutdown can wait for them. Upgraded
 * (WebSocket) connections are not requests and are not counted.
 */
export class InFlightRequests {
    private readonly responses = new Set<http.ServerResponse>();
    private connectionReuseStopped = false;
    // Created by the first `whenAllFinished()` call; resolved when the last response closes.
    private allFinished: PromiseWithResolvers<void> | undefined;

    /** Counts the request until its response closes, whether it finished or the client went away. */
    public track(res: http.ServerResponse): void {
        this.responses.add(res);
        if (this.connectionReuseStopped) {
            this.closeConnectionAfterResponse(res);
        }
        res.once("close", () => {
            this.responses.delete(res);
            /*
             * Only a shutdown waits here. Until something calls `whenAllFinished()` there is no
             * promise, so requests that finish while the server runs normally skip this.
             */
            const shutdownWaiting = this.allFinished;
            if (shutdownWaiting !== undefined && this.responses.size === 0) {
                this.allFinished = undefined;
                shutdownWaiting.resolve();
            }
        });
    }

    /**
     * From now on every response, the ones in flight included, closes its connection once sent. A
     * keep-alive client would otherwise send its next request on that connection, and the exit
     * would cut that request off.
     */
    public stopConnectionReuse(): void {
        if (this.connectionReuseStopped) {
            return;
        }
        this.connectionReuseStopped = true;
        for (const res of this.responses) {
            this.closeConnectionAfterResponse(res);
        }
    }

    /** Resolves once no request is in flight; at once if none is. */
    public whenAllFinished(): Promise<void> {
        if (this.responses.size === 0) {
            return Promise.resolve();
        }
        if (!this.allFinished) {
            this.allFinished = Promise.withResolvers<void>();
        }
        return this.allFinished.promise;
    }

    private closeConnectionAfterResponse(res: http.ServerResponse): void {
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
}
