import type {
    IGenericData,
    IWebsocketsConnection,
    IWebsocketsConnectionFactory,
    IWebsocketsConnectProtocol,
    IWebsocketsManagerMessageEvent,
    IWebsocketsSubscriptionManager,
    WebsocketsCloseCode
} from "./types.js";
import { WebsocketsReadyState } from "./types.js";

interface ICreateUrlResult {
    token: string;
    url: string;
}

const defaultFactory: IWebsocketsConnectionFactory = (url, protocol) => {
    return new WebSocket(url, protocol);
};

interface IConnection {
    ws: WebSocket | null;
}

/**
 * We need to attach the websockets cache to window object, or it will be reset on every hot reload.
 */
declare global {
    interface Window {
        WebinyWebsocketsConnectionCache: IConnection;
    }
}

if (!window.WebinyWebsocketsConnectionCache) {
    window.WebinyWebsocketsConnectionCache = {
        ws: null
    };
}

const connectionCache = window.WebinyWebsocketsConnectionCache;

/**
 * API Gateway closes a WebSocket after 10 minutes without traffic (and after 2 hours regardless), so
 * we ping well inside that window. The ping has no route of its own and lands on `$default`.
 */
export const WEBSOCKETS_HEARTBEAT_INTERVAL = 5 * 60 * 1000;
export const WEBSOCKETS_HEARTBEAT_ACTION = "ping";

const MAX_RECONNECT_DELAY = 30 * 1000;

const defaultReconnectDelay = (attempt: number): number => {
    return Math.min(1000 * 2 ** attempt, MAX_RECONNECT_DELAY);
};

export interface IWebsocketsConnectionParams {
    url: string;
    tenant: string;
    getToken(): Promise<string | undefined>;
    subscriptionManager: IWebsocketsSubscriptionManager;
    protocol?: IWebsocketsConnectProtocol;
    factory?: IWebsocketsConnectionFactory;
    heartbeatInterval?: number;
    reconnectDelay?: (attempt: number) => number;
}

export class WebsocketsConnection implements IWebsocketsConnection {
    private readonly url: string;
    private readonly getToken: () => Promise<string | undefined>;
    private tenant: string;
    private readonly protocol: IWebsocketsConnectProtocol;
    public readonly subscriptionManager: IWebsocketsSubscriptionManager;
    private readonly factory: IWebsocketsConnectionFactory;
    private readonly heartbeatInterval: number;
    private readonly reconnectDelay: (attempt: number) => number;
    private reconnectAttempt = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    public constructor(params: IWebsocketsConnectionParams) {
        this.url = params.url;
        this.tenant = params.tenant;
        this.getToken = params.getToken;
        this.protocol = params.protocol;
        this.subscriptionManager = params.subscriptionManager;
        this.factory = params.factory || defaultFactory;
        this.heartbeatInterval = params.heartbeatInterval ?? WEBSOCKETS_HEARTBEAT_INTERVAL;
        this.reconnectDelay = params.reconnectDelay ?? defaultReconnectDelay;
    }

    public setTenant(tenant: string): void {
        this.tenant = tenant;
    }

    public async connect(): Promise<void> {
        await this.getConnection();
    }

    public async close(code: WebsocketsCloseCode, reason: string): Promise<boolean> {
        this.stopHeartbeat();
        this.cancelReconnect();
        if (
            !connectionCache.ws ||
            connectionCache.ws.readyState === WebsocketsReadyState.CLOSED ||
            connectionCache.ws.readyState === WebsocketsReadyState.CLOSING
        ) {
            connectionCache.ws = undefined as unknown as null;

            return true;
        }
        // Detach first: the close handler reconnects only while the closing socket is still the
        // cached one, and this close is intentional.
        const ws = connectionCache.ws;
        connectionCache.ws = undefined as unknown as null;
        ws.close(code, reason);

        return true;
    }

    public async send<T extends IGenericData = IGenericData>(data: T): Promise<void> {
        const connection = await this.getConnection();
        if (connection.readyState !== WebsocketsReadyState.OPEN) {
            console.info("Websocket connection is not open, cannot send any data.", data);
            return;
        }
        connection.send(JSON.stringify(data));
    }

    public isConnected(): boolean {
        return connectionCache.ws?.readyState === WebsocketsReadyState.OPEN;
    }

    public isClosed(): boolean {
        return connectionCache.ws?.readyState === WebsocketsReadyState.CLOSED;
    }

    private async createUrl(): Promise<ICreateUrlResult | null> {
        const token = await this.getToken();
        if (!token) {
            console.error(`Missing token to connect to websockets.`);
            return null;
        }
        return {
            token,
            url: `${this.url}?token=${token}&tenant=${this.tenant}`
        };
    }

    private async getConnection(): Promise<WebSocket> {
        if (connectionCache.ws?.readyState === WebsocketsReadyState.OPEN) {
            return connectionCache.ws;
        } else if (connectionCache.ws?.readyState === WebsocketsReadyState.CONNECTING) {
            return connectionCache.ws;
        }

        const result = await this.createUrl();
        if (!result) {
            throw new Error(`Missing URL for WebSocket to connect to.`);
        }
        const { url } = result;

        const ws = this.factory(url, this.protocol);
        connectionCache.ws = ws;

        const start = new Date().getTime();

        console.log(`Websockets connecting to ${this.url}...`);

        ws.addEventListener("open", event => {
            const end = new Date().getTime();
            console.log(`...connected in ${end - start}ms.`);
            this.reconnectAttempt = 0;
            this.startHeartbeat();
            return this.subscriptionManager.triggerOnOpen(event);
        });
        ws.addEventListener("close", event => {
            console.warn("Websocket connection closed.", {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean,
                at: new Date().toISOString()
            });
            /**
             * `close()` detaches the socket from the cache before closing it, so a socket that is no
             * longer the cached one was either closed on purpose or already replaced. Only the
             * current socket closing on its own warrants a reconnect: while it is down, the server
             * has no registered connection for this identity and every push to it is dropped.
             */
            if (connectionCache.ws === ws) {
                this.stopHeartbeat();
                this.scheduleReconnect();
            }
            return this.subscriptionManager.triggerOnClose(event);
        });
        connectionCache.ws.addEventListener("error", event => {
            console.info(`Error in the Websocket connection.`, event);
            /**
             * Let's close it if possible.
             * It will reopen automatically.
             */
            if (connectionCache.ws?.close) {
                try {
                    connectionCache.ws.close();
                } catch (ex) {
                    console.error(ex);
                }
            }
            return this.subscriptionManager.triggerOnError(event);
        });

        connectionCache.ws.addEventListener(
            "message",
            (event: IWebsocketsManagerMessageEvent<string>) => {
                return this.subscriptionManager.triggerOnMessage(event);
            }
        );

        return connectionCache.ws;
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            return;
        }
        const delay = this.reconnectDelay(this.reconnectAttempt);
        this.reconnectAttempt++;
        console.log(`Websockets reconnecting in ${delay}ms (attempt ${this.reconnectAttempt}).`);

        this.reconnectTimer = setTimeout(async () => {
            this.reconnectTimer = null;
            try {
                await this.connect();
            } catch (ex) {
                // No token yet (e.g. mid-refresh) or the socket could not be created: try again.
                console.error("Websockets reconnect failed.", ex);
                this.scheduleReconnect();
            }
        }, delay);
    }

    private cancelReconnect(): void {
        if (!this.reconnectTimer) {
            return;
        }
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
    }

    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            this.sendHeartbeat().catch(ex => {
                console.error("Websockets heartbeat failed.", ex);
            });
        }, this.heartbeatInterval);
    }

    private stopHeartbeat(): void {
        if (!this.heartbeatTimer) {
            return;
        }
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
    }

    private async sendHeartbeat(): Promise<void> {
        if (!this.isConnected()) {
            return;
        }
        const token = await this.getToken();
        if (!token || !this.isConnected()) {
            return;
        }
        // Same envelope as WebsocketsActions: the `$default` route authenticates every message.
        connectionCache.ws!.send(
            JSON.stringify({ action: WEBSOCKETS_HEARTBEAT_ACTION, token, tenant: this.tenant })
        );
    }
}

export const createWebsocketsConnection = (
    params: IWebsocketsConnectionParams
): IWebsocketsConnection => {
    return new WebsocketsConnection(params);
};
