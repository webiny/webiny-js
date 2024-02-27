import { WebsocketReadyState } from "./types";
import {
    IGenericData,
    IWebsocketConnection,
    IWebsocketConnectionFactory
} from "./abstractions/IWebsocketConnection";
import { IWebsocketSubscriptionManager } from "./abstractions/IWebsocketSubscriptionManager";

const defaultFactory: IWebsocketConnectionFactory = (url, protocol) => {
    return new WebSocket(url, protocol);
};

export interface IWebsocketConnectionParams {
    url: string;
    subscriptionManager: IWebsocketSubscriptionManager;
    protocol?: string[];
    factory?: IWebsocketConnectionFactory;
}

export class WebsocketConnection implements IWebsocketConnection {
    public readonly subscriptionManager: IWebsocketSubscriptionManager;
    private connection: WebSocket | null = null;
    private url: string;
    private protocol: string[] | undefined = undefined;
    private readonly factory: IWebsocketConnectionFactory;

    public constructor(params: IWebsocketConnectionParams) {
        const { url, protocol, subscriptionManager, factory } = params;
        this.url = url;
        this.protocol = protocol;
        this.subscriptionManager = subscriptionManager;
        this.factory = factory || defaultFactory;
    }

    public init(): void {
        this.connect(this.url, this.protocol);
    }

    public connect(url: string, protocol?: string[]): void {
        if (this.connection && this.connection.readyState !== WebsocketReadyState.CLOSED) {
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
            return this.subscriptionManager.triggerOnError(event);
        });
        this.connection.addEventListener("message", event => {
            return this.subscriptionManager.triggerOnMessage(event);
        });
    }

    public close(code?: number, reason?: string): boolean {
        if (!this.connection) {
            return true;
        } else if (this.connection.readyState !== WebsocketReadyState.OPEN) {
            return false;
        }
        this.connection.close(code, reason);
        this.connection = null;
        return true;
    }

    public reconnect(url?: string, protocol?: string[]): void {
        if (!this.close()) {
            console.log("Failed to close the connection before reconnecting.");
            return;
        }
        this.connect(url || this.url, protocol || this.protocol);
    }

    public send<T extends IGenericData = IGenericData>(data: T): void {
        if (!this.connection || this.connection.readyState !== WebsocketReadyState.OPEN) {
            return;
        }
        this.connection.send(JSON.stringify(data));
    }
}
