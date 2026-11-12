import { EventDispatcher } from "@webiny/event-handler-core";
import { ProcessOwner } from "@webiny/event-handler-standalone";
import { WebsocketsLiveSockets } from "~/liveSockets/abstractions.js";
import {
    WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER,
    type IWebsocketsConnectionRowsEvent,
    type WebsocketsConnectionRowWrite,
    type WebsocketsConnectionRowWriteFailure,
    type WebsocketsConnectionRowsChange
} from "~/rows/abstractions.js";
import { WebsocketsConnectionManager } from "./abstractions.js";

/**
 * How often, at most, a connection's `lastSeen` is written. Every row change runs in a fresh request
 * container, so writing it on every client message would build one per message. The stale cutoff is
 * far longer (15 minutes by default), and `cleanup` shortens this for a shorter cutoff.
 */
export const LAST_SEEN_WRITE_INTERVAL = 60_000;

/** The most row writes one event (one request container) applies. */
export const MAX_ROW_WRITES_PER_EVENT = 100;

interface QueuedRowWrite {
    write: WebsocketsConnectionRowWrite;
    resolve: () => void;
    reject: (error: unknown) => void;
}

export class ServerConnectionManagerImpl implements WebsocketsConnectionManager.Interface<unknown> {
    /** When each live connection's `lastSeen` was last written (epoch ms). */
    private readonly lastSeenWrittenAt = new Map<string, number>();
    private lastSeenWriteInterval = LAST_SEEN_WRITE_INTERVAL;
    /** Row writes waiting for the next event. */
    private readonly queue: QueuedRowWrite[] = [];
    /** Whether a batch of row writes is being sent. */
    private flushing = false;

    public constructor(
        private readonly sockets: WebsocketsLiveSockets.Interface,
        private readonly dispatcher: EventDispatcher.Interface,
        private readonly owner: ProcessOwner.Interface
    ) {}

    public async add(params: WebsocketsConnectionManager.AddParams<unknown>): Promise<void> {
        this.sockets.add({
            connectionId: params.connectionId,
            socket: params.socket,
            metadata: {
                connectionId: params.connectionId,
                endpoint: params.endpoint,
                connectedAt: params.connectedAt,
                host: params.host,
                headers: params.headers
            }
        });

        // Save the connection to the shared registry. This is what lets the server later push a
        // message to a specific user — e.g. when a background task finishes and calls
        // SendToIdentity. That flow looks connections up in the registry by identity id to get their
        // connection ids, then comes back here to fetch each live socket by connection id and send.
        // The live sockets only answer "socket for this connection id?" — they can't be searched by
        // identity, so without this registry row a targeted send finds nobody. The registry stores
        // `connectedOn` as an ISO string (it compares connections against a recency cutoff), so we
        // convert the epoch-ms `connectedAt`.
        await this.write({
            action: "register",
            connection: {
                connectionId: params.connectionId,
                identity: params.identity,
                tenant: params.tenant,
                endpoint: params.endpoint,
                connectedOn: new Date(params.connectedAt).toISOString(),
                owner: this.owner.id
            }
        });
        // Registering writes `lastSeen` too.
        this.lastSeenWrittenAt.set(params.connectionId, Date.now());
    }

    public async remove(connectionId: string): Promise<void> {
        this.forget(connectionId);
        await this.write({ action: "unregister", connectionId });
    }

    public getSocket(connectionId: string): unknown | undefined {
        return this.sockets.getSocket(connectionId);
    }

    public getMetadata(
        connectionId: string
    ): WebsocketsConnectionManager.ConnectionMetadata | undefined {
        return this.sockets.getMetadata(connectionId);
    }

    public async updateLastSeen(connectionId: string): Promise<void> {
        const now = Date.now();
        const writtenAt = this.lastSeenWrittenAt.get(connectionId);
        if (writtenAt !== undefined && now - writtenAt < this.lastSeenWriteInterval) {
            return;
        }
        // Track only live connections, so an unknown id leaves nothing behind.
        if (this.sockets.getMetadata(connectionId)) {
            this.lastSeenWrittenAt.set(connectionId, now);
        }
        try {
            await this.write({ action: "updateLastSeen", connectionId });
        } catch (error) {
            // Not written: let the next message try again.
            if (this.lastSeenWrittenAt.get(connectionId) === now) {
                this.restoreWrittenAt(connectionId, writtenAt);
            }
            throw error;
        }
    }

    public async cleanup(maxAge: number): Promise<string[]> {
        // A `lastSeen` must be written well within the cutoff, or a live connection looks stale.
        this.lastSeenWriteInterval = Math.min(LAST_SEEN_WRITE_INTERVAL, Math.floor(maxAge / 4));
        const olderThan = new Date(Date.now() - maxAge).toISOString();
        // One event removes all the stale rows, so a mass disconnect is one request, not one each.
        const stale = (await this.change<string[]>({ action: "removeStale", olderThan })) ?? [];
        for (const connectionId of stale) {
            this.forget(connectionId);
        }
        return stale;
    }

    public getActiveConnectionIds(): string[] {
        return this.sockets.getActiveConnectionIds();
    }

    private forget(connectionId: string): void {
        this.sockets.remove(connectionId);
        this.lastSeenWrittenAt.delete(connectionId);
    }

    private restoreWrittenAt(connectionId: string, writtenAt: number | undefined): void {
        if (writtenAt === undefined) {
            this.lastSeenWrittenAt.delete(connectionId);
            return;
        }
        this.lastSeenWrittenAt.set(connectionId, writtenAt);
    }

    /**
     * Queues a row write and settles when it is applied. Every event builds a request container,
     * so writes are batched: one batch is sent at a time, and the writes queued meanwhile (a burst
     * of reconnects after a restart, a mass disconnect) go together in the next one. Writes are
     * applied in the order they were queued.
     */
    private write(write: WebsocketsConnectionRowWrite): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.queue.push({ write, resolve, reject });
            if (!this.flushing) {
                this.flushing = true;
                void this.flush();
            }
        });
    }

    private async flush(): Promise<void> {
        try {
            // Let the writes queued in the same turn join the first batch.
            await Promise.resolve();
            while (this.queue.length > 0) {
                const batch = this.queue.splice(0, MAX_ROW_WRITES_PER_EVENT);
                try {
                    const failures = await this.change<
                        (WebsocketsConnectionRowWriteFailure | null)[]
                    >({ action: "write", writes: batch.map(queued => queued.write) });
                    batch.forEach((queued, index) => {
                        const failure = failures?.[index];
                        if (failure) {
                            queued.reject(Object.assign(new Error(failure.message), failure));
                            return;
                        }
                        queued.resolve();
                    });
                } catch (error) {
                    for (const queued of batch) {
                        queued.reject(error);
                    }
                }
            }
        } finally {
            this.flushing = false;
        }
    }

    /* The rows are a storage: the change runs in a fresh request container, on its registry. */
    private change<TResult>(change: WebsocketsConnectionRowsChange): Promise<TResult | null> {
        const event: IWebsocketsConnectionRowsEvent = {
            [WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER]: true,
            ...change
        };
        return this.dispatcher.dispatch<TResult | null>(event);
    }
}

export const ServerConnectionManager = WebsocketsConnectionManager.createImplementation({
    implementation: ServerConnectionManagerImpl,
    dependencies: [WebsocketsLiveSockets, EventDispatcher, ProcessOwner]
});
