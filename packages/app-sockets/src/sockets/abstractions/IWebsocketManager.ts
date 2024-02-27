import { IGenericData } from "~/sockets/abstractions/IWebsocketConnection";
import {
    IWebsocketSubscription,
    IWebsocketSubscriptionCallback
} from "~/sockets/abstractions/IWebsocketSubscriptionManager";
import {
    IWebsocketManagerCloseEvent,
    IWebsocketManagerErrorEvent,
    IWebsocketManagerMessageEvent,
    IWebsocketManagerOpenEvent,
    WebsocketCloseCode
} from "~/sockets/types";

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
    messageId: string;
    /**
     * Action being fired on the API side.
     */
    action: string;
    /**
     * Data being sent to the API. Must be an object.
     */
    data: T;
}

export interface IWebsocketManager {
    connect(): void;
    close(code?: WebsocketCloseCode, reason?: string): void;
    send<T extends IWebsocketManagerSendData = IWebsocketManagerSendData>(data: T): void;

    onOpen(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerOpenEvent>
    ): IWebsocketSubscription<IWebsocketManagerOpenEvent>;

    onClose(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerCloseEvent>
    ): IWebsocketSubscription<IWebsocketManagerCloseEvent>;

    onError(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerErrorEvent>
    ): IWebsocketSubscription<IWebsocketManagerErrorEvent>;

    onMessage<T extends IGenericData = IGenericData>(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerMessageEvent<T>>
    ): IWebsocketSubscription<IWebsocketManagerMessageEvent<T>>;
}
