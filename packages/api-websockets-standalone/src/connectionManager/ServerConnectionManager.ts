import { EventDispatcher } from "@webiny/event-handler-core";
import { ProcessOwner } from "@webiny/event-handler-standalone";
import { WebsocketsLiveSockets } from "~/liveSockets/abstractions.js";
import {
    WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER,
    type IWebsocketsConnectionRowsEvent,
    type WebsocketsConnectionRowsChange
} from "~/rows/WebsocketsConnectionRowsEvent.js";
import { WebsocketsConnectionManager } from "./abstractions.js";

/**
 * How often, at most, a connection's `lastSeen` is written. Every row change runs in a fresh request
 * container, so writing it on every client message would build one per message. The stale cutoff is
 * far longer (15 minutes by default), and `cleanup` shortens this for a shorter cutoff.
 */
export const LAST_SEEN_WRITE_INTERVAL = 60_000;

export class ServerConnectionManagerImpl implements WebsocketsConnectionManager.Interface<unknown> {
    /** When each live connection's `lastSeen` was last written (epoch ms). */
    private readonly lastSeenWrittenAt = new Map<string, number>();
    private lastSeenWriteInterval = LAST_SEEN_WRITE_INTERVAL;

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
        await this.change({
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
        await this.change({ action: "unregister", connectionId });
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
            await this.change({ action: "updateLastSeen", connectionId });
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
        const stale = (await this.change({ action: "removeStale", olderThan })) ?? [];
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

    /* The rows are a storage: the change runs in a fresh request container, on its registry. */
    private change(change: WebsocketsConnectionRowsChange): Promise<string[] | null> {
        const event: IWebsocketsConnectionRowsEvent = {
            [WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER]: true,
            ...change
        };
        return this.dispatcher.dispatch<string[] | null>(event);
    }
}

export const ServerConnectionManager = WebsocketsConnectionManager.createImplementation({
    implementation: ServerConnectionManagerImpl,
    dependencies: [WebsocketsLiveSockets, EventDispatcher, ProcessOwner]
});
