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

const defaultFactory: IWebsocketsConnectionFactory = (url, protocol) => {
    return new WebSocket(url, protocol);
};

export interface IWebsocketsConnectionParams {
    url: string;
    subscriptionManager: IWebsocketsSubscriptionManager;
    protocol?: IWebsocketsConnectProtocol;
    factory?: IWebsocketsConnectionFactory;
}

export class WebsocketsConnection implements IWebsocketsConnection {
    private connection: WebSocket | null = null;
    private url: string;
    private protocol: IWebsocketsConnectProtocol;
    public readonly subscriptionManager: IWebsocketsSubscriptionManager;
    private readonly factory: IWebsocketsConnectionFactory;

    public constructor(params: IWebsocketsConnectionParams) {
        this.url = params.url;
        this.protocol = params.protocol;
        this.subscriptionManager = params.subscriptionManager;
        this.factory = params.factory || defaultFactory;
    }

    public init(): void {
        this.connect(this.url, this.protocol);
    }

    public connect(url: string, protocol?: IWebsocketsConnectProtocol): void {
        if (this.connection && this.connection.readyState !== WebsocketsReadyState.CLOSED) {
            return;
        }
        this.url = url;
        this.protocol = protocol || this.protocol;
        this.connection = this.factory(this.url, this.protocol);

        this.connection.addEventListener("open", event => {
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

    public close(code?: WebsocketsCloseCode, reason?: string): boolean {
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

    public reconnect(url?: string, protocol?: IWebsocketsConnectProtocol): void {
        if (!this.close(WebsocketsCloseCode.RECONNECT, "Trying to reconnect.")) {
            console.error("Failed to close the connection before reconnecting.");
            return;
        }

        this.connect(url || this.url, protocol || this.protocol);
    }

    public send<T extends IGenericData = IGenericData>(data: T): void {
        if (!this.connection || this.connection.readyState !== WebsocketsReadyState.OPEN) {
            console.info("Websocket connection is not open, cannot send any data.", data);
            return;
        }
        this.connection.send(JSON.stringify(data));
    }
}

export const createWebsocketsConnection = (
    params: IWebsocketsConnectionParams
): IWebsocketsConnection => {
    return new WebsocketsConnection(params);
};
