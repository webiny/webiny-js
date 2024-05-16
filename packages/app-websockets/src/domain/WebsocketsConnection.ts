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
    private connection: WebSocket | null = null;
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

    public init(): void {
        this.connect();
    }

    public async connect(): Promise<void> {
        if (this.connection && this.connection.readyState !== WebsocketsReadyState.CLOSED) {
            return;
        }

        const result = await this.createUrl();
        if (!result) {
            return;
        }
        const { url } = result;

        this.connection = this.factory(url, this.protocol);

        const start = new Date().getTime();

        console.log(`Websockets connecting to ${this.url}...`);

        this.connection.addEventListener("open", event => {
            const end = new Date().getTime();
            console.log(`...connected in ${end - start}ms.`);
            return this.subscriptionManager.triggerOnOpen(event);
        });
        this.connection.addEventListener("close", event => {
            return this.subscriptionManager.triggerOnClose(event);
        });
        this.connection.addEventListener("error", event => {
            console.info(`Error in the Websocket connection.`, event);
            return this.subscriptionManager.triggerOnError(event);
        });
        this.connection.addEventListener(
            "message",
            (event: IWebsocketsManagerMessageEvent<string>) => {
                return this.subscriptionManager.triggerOnMessage(event);
            }
        );
    }

    public async close(code: WebsocketsCloseCode, reason: string): Promise<boolean> {
        if (!this.connection || this.connection.readyState === WebsocketsReadyState.CLOSED) {
            this.connection = null;
            return true;
        } else if (this.connection.readyState !== WebsocketsReadyState.OPEN) {
            return false;
        }
        this.connection.close(code, reason);
        this.connection = null;
        return true;
    }

    public send<T extends IGenericData = IGenericData>(data: T): void {
        if (!this.connection || this.connection.readyState !== WebsocketsReadyState.OPEN) {
            console.info("Websocket connection is not open, cannot send any data.", data);
            return;
        }
        this.connection.send(JSON.stringify(data));
    }

    public isConnected(): boolean {
        return this.connection?.readyState === WebsocketsReadyState.OPEN;
    }

    public isClosed(): boolean {
        return this.connection?.readyState === WebsocketsReadyState.CLOSED;
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
}

export const createWebsocketsConnection = (
    params: IWebsocketsConnectionParams
): IWebsocketsConnection => {
    return new WebsocketsConnection(params);
};
