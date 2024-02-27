import { IWebsocketManagerMessageEvent, WebsocketCloseCode, WebsocketReadyState } from "./types";
import {
    IGenericData,
    IWebsocketConnection,
    IWebsocketConnectionFactory,
    IWebsocketConnectProtocol
} from "./abstractions/IWebsocketConnection";
import { IWebsocketSubscriptionManager } from "./abstractions/IWebsocketSubscriptionManager";

const defaultFactory: IWebsocketConnectionFactory = (url, protocol) => {
    return new WebSocket(url, protocol);
};

export interface IWebsocketConnectionParams {
    url: string;
    subscriptionManager: IWebsocketSubscriptionManager;
    protocol?: IWebsocketConnectProtocol;
    factory?: IWebsocketConnectionFactory;
}

export class WebsocketConnection implements IWebsocketConnection {
    private connection: WebSocket | null = null;
    private url: string;
    private protocol: IWebsocketConnectProtocol;
    public readonly subscriptionManager: IWebsocketSubscriptionManager;
    private readonly factory: IWebsocketConnectionFactory;

    public constructor(params: IWebsocketConnectionParams) {
        this.url = params.url;
        this.protocol = params.protocol;
        this.subscriptionManager = params.subscriptionManager;
        this.factory = params.factory || defaultFactory;
    }

    public init(): void {
        this.connect(this.url, this.protocol);
    }

    public connect(url: string, protocol?: IWebsocketConnectProtocol): void {
        if (this.connection && this.connection.readyState !== WebsocketReadyState.CLOSED) {
            return;
        }
        this.url = url;
        this.protocol = protocol || this.protocol;
        this.connection = this.factory(this.url, this.protocol);

        this.connection.addEventListener("open", event => {
            console.info(`Opened the Websocket connection.`);
            return this.subscriptionManager.triggerOnOpen(event);
        });
        this.connection.addEventListener("close", event => {
            console.info(`Closed the Websocket connection.`);
            return this.subscriptionManager.triggerOnClose(event);
        });
        this.connection.addEventListener("error", event => {
            console.info(`Error in the Websocket connection.`);
            return this.subscriptionManager.triggerOnError(event);
        });
        this.connection.addEventListener(
            "message",
            (event: IWebsocketManagerMessageEvent<string>) => {
                return this.subscriptionManager.triggerOnMessage(event);
            }
        );
    }

    public close(code?: WebsocketCloseCode, reason?: string): boolean {
        if (!this.connection || this.connection.readyState === WebsocketReadyState.CLOSED) {
            this.connection = null;
            return true;
        } else if (this.connection.readyState !== WebsocketReadyState.OPEN) {
            return false;
        }
        this.connection.close(code, reason);
        this.connection = null;
        return true;
    }

    public reconnect(url?: string, protocol?: IWebsocketConnectProtocol): void {
        if (!this.close(WebsocketCloseCode.RECONNECT, "Trying to reconnect.")) {
            console.error("Failed to close the connection before reconnecting.");
            return;
        }

        this.connect(url || this.url, protocol || this.protocol);
    }

    public send<T extends IGenericData = IGenericData>(data: T): void {
        if (!this.connection || this.connection.readyState !== WebsocketReadyState.OPEN) {
            console.info("Websocket connection is not open, cannot send any data.", data);
            return;
        }
        this.connection.send(JSON.stringify(data));
    }
}
