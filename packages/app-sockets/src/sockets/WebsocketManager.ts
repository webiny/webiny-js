import { IWebsocketManager, IWebsocketManagerSendData } from "./abstractions/IWebsocketManager";
import { IWebsocketConnection } from "./abstractions/IWebsocketConnection";
import {
    IWebsocketSubscription,
    IWebsocketSubscriptionCallback
} from "./abstractions/IWebsocketSubscriptionManager";
import {
    IWebsocketManagerCloseEvent,
    IWebsocketManagerErrorEvent,
    IWebsocketManagerMessageEvent,
    IWebsocketManagerOpenEvent
} from "~/sockets/types";

export class WebsocketManager implements IWebsocketManager {
    public readonly connection: IWebsocketConnection;

    public constructor(connection: IWebsocketConnection) {
        this.connection = connection;
    }

    public onOpen(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerOpenEvent>
    ): IWebsocketSubscription<IWebsocketManagerOpenEvent> {
        return this.connection.subscriptionManager.onOpen(cb);
    }

    public onClose(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerCloseEvent>
    ): IWebsocketSubscription<IWebsocketManagerCloseEvent> {
        return this.connection.subscriptionManager.onClose(cb);
    }

    public onMessage(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerMessageEvent>
    ): IWebsocketSubscription<IWebsocketManagerMessageEvent> {
        return this.connection.subscriptionManager.onMessage(cb);
    }

    public onError(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerErrorEvent>
    ): IWebsocketSubscription<IWebsocketManagerErrorEvent> {
        return this.connection.subscriptionManager.onError(cb);
    }

    public connect(): void {
        this.connection.reconnect();
    }

    public close(code?: number, reason?: string): void {
        this.connection.close(code, reason);
    }

    public send<T extends IWebsocketManagerSendData = IWebsocketManagerSendData>(data: T): void {
        return this.connection.send<T>(data);
    }
}
