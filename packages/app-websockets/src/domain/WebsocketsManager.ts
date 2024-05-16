import {
    IGenericData,
    IWebsocketsConnection,
    IWebsocketsManager,
    IWebsocketsManagerCloseEvent,
    IWebsocketsManagerErrorEvent,
    IWebsocketsManagerMessageEvent,
    IWebsocketsManagerOpenEvent,
    IWebsocketManagerSendData,
    IWebsocketsSubscription,
    IWebsocketsSubscriptionCallback,
    WebsocketsCloseCode
} from "./types";

export class WebsocketsManager implements IWebsocketsManager {
    public readonly connection: IWebsocketsConnection;

    public constructor(connection: IWebsocketsConnection) {
        this.connection = connection;
    }

    public onOpen(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerOpenEvent>
    ): IWebsocketsSubscription<IWebsocketsManagerOpenEvent> {
        return this.connection.subscriptionManager.onOpen(cb);
    }

    public onClose(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerCloseEvent>
    ): IWebsocketsSubscription<IWebsocketsManagerCloseEvent> {
        return this.connection.subscriptionManager.onClose(cb);
    }

    public onMessage<T extends IGenericData = IGenericData>(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerMessageEvent<T>>
    ): IWebsocketsSubscription<IWebsocketsManagerMessageEvent<T>> {
        return this.connection.subscriptionManager.onMessage<T>(cb);
    }

    public onError(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerErrorEvent>
    ): IWebsocketsSubscription<IWebsocketsManagerErrorEvent> {
        return this.connection.subscriptionManager.onError(cb);
    }

    public async connect(): Promise<void> {
        return this.connection.connect();
    }

    public async close(code: WebsocketsCloseCode, reason: string): Promise<boolean> {
        return await this.connection.close(code, reason);
    }

    public send<T extends IWebsocketManagerSendData = IWebsocketManagerSendData>(data: T): void {
        return this.connection.send<T>(data);
    }

    public isConnected(): boolean {
        return this.connection.isConnected();
    }

    public isClosed(): boolean {
        return this.connection.isClosed();
    }
}

export const createWebsocketsManager = (connection: IWebsocketsConnection): IWebsocketsManager => {
    return new WebsocketsManager(connection);
};
