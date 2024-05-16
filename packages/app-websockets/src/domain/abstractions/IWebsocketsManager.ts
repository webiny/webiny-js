import {
    IWebsocketsSubscription,
    IWebsocketsSubscriptionCallback
} from "./IWebsocketsSubscriptionManager";
import {
    IGenericData,
    IWebsocketsManagerCloseEvent,
    IWebsocketsManagerErrorEvent,
    IWebsocketsManagerMessageEvent,
    IWebsocketsManagerOpenEvent,
    WebsocketsCloseCode
} from "./types";

export interface IWebsocketManagerSendData<T extends IGenericData = IGenericData>
    extends IGenericData {
    /**
     * A user token, which will identify the user sending the message.
     */
    token: string;
    /**
     * Current tenant.
     */
    tenant: string;
    /**
     * Current locale.
     */
    locale: string;
    /**
     * A unique message ID - generated on the UI side.
     * TODO implement waiting for the message response.
     */
    messageId?: string;
    /**
     * Action being fired on the API side.
     */
    action: string;
    /**
     * Data being sent to the API. Must be an object.
     */
    data: T;
}

export interface IWebsocketsManager {
    isConnected(): boolean;
    isClosed(): boolean;

    connect(): Promise<void>;
    close(code?: WebsocketsCloseCode, reason?: string): void;
    send<T extends IWebsocketManagerSendData = IWebsocketManagerSendData>(data: T): void;

    onOpen(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerOpenEvent>
    ): IWebsocketsSubscription<IWebsocketsManagerOpenEvent>;

    onClose(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerCloseEvent>
    ): IWebsocketsSubscription<IWebsocketsManagerCloseEvent>;

    onError(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerErrorEvent>
    ): IWebsocketsSubscription<IWebsocketsManagerErrorEvent>;

    onMessage<T extends IGenericData = IGenericData>(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerMessageEvent<T>>
    ): IWebsocketsSubscription<IWebsocketsManagerMessageEvent<T>>;
}
