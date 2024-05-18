import {
    IGenericData,
    IWebsocketsConnection,
    IWebsocketsConnectionFactory,
    IWebsocketsConnectProtocol,
    IWebsocketsManagerMessageEvent,
    IWebsocketsSubscriptionManager,
    WebsocketsCloseCode,
    WebsocketsReadyState
} from "./types";

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

export interface IWebsocketsConnectionParams {
    url: string;
    tenant: string;
    locale: string;
    getToken(): Promise<string | null>;
    subscriptionManager: IWebsocketsSubscriptionManager;
    protocol?: IWebsocketsConnectProtocol;
    factory?: IWebsocketsConnectionFactory;
}

export class WebsocketsConnection implements IWebsocketsConnection {
    private readonly url: string;
    private readonly getToken: () => Promise<string | null>;
    private tenant: string;
    private locale: string;
    private readonly protocol: IWebsocketsConnectProtocol;
    public readonly subscriptionManager: IWebsocketsSubscriptionManager;
    private readonly factory: IWebsocketsConnectionFactory;

    public constructor(params: IWebsocketsConnectionParams) {
        this.url = params.url;
        this.tenant = params.tenant;
        this.locale = params.locale;
        this.getToken = params.getToken;
        this.protocol = params.protocol;
        this.subscriptionManager = params.subscriptionManager;
        this.factory = params.factory || defaultFactory;
    }

    public setTenant(tenant: string): void {
        this.tenant = tenant;
    }

    public setLocale(locale: string): void {
        this.locale = locale;
    }

    public async connect(): Promise<void> {
        await this.getConnection();
    }

    public async close(code: WebsocketsCloseCode, reason: string): Promise<boolean> {
        if (
            !connectionCache.ws ||
            connectionCache.ws.readyState === WebsocketsReadyState.CLOSED ||
            connectionCache.ws.readyState === WebsocketsReadyState.CLOSING
        ) {
            connectionCache.ws = undefined as unknown as null;

            return true;
        }
        connectionCache.ws.close(code, reason);

        connectionCache.ws = undefined as unknown as null;
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
            url: `${this.url}?token=${token}&tenant=${this.tenant}&locale=${this.locale}`
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

        connectionCache.ws = this.factory(url, this.protocol);

        const start = new Date().getTime();

        console.log(`Websockets connecting to ${this.url}...`);

        connectionCache.ws.addEventListener("open", event => {
            const end = new Date().getTime();
            console.log(`...connected in ${end - start}ms.`);
            return this.subscriptionManager.triggerOnOpen(event);
        });
        connectionCache.ws.addEventListener("close", event => {
            return this.subscriptionManager.triggerOnClose(event);
        });
        connectionCache.ws.addEventListener("error", event => {
            console.info(`Error in the Websocket connection.`, event);
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
}

export const createWebsocketsConnection = (
    params: IWebsocketsConnectionParams
): IWebsocketsConnection => {
    return new WebsocketsConnection(params);
};
