import {
    IWebsocketManager,
    IWebsocketManagerSendData
} from "~/sockets/abstractions/IWebsocketManager";
import { IWebsocketSubscription } from "~/sockets/abstractions/IWebsocketSubscriptionManager";
import {
    IWebsocketManagerCloseEvent,
    IWebsocketManagerErrorEvent,
    IWebsocketManagerMessageEvent,
    IWebsocketManagerOpenEvent
} from "~/sockets/types";
import { WebsocketSubscriptionManager } from "~/sockets/WebsocketSubscriptionManager";

export class BlackHoleWebsocketManager implements IWebsocketManager {
    private readonly subscriptions = new WebsocketSubscriptionManager();

    public connect(): void {
        return;
    }

    public close(): void {
        return;
    }

    public send<T extends IWebsocketManagerSendData = IWebsocketManagerSendData>(data: T): void {
        console.log("BlackHoleWebsocketManager.send", data);
    }

    public onOpen(): IWebsocketSubscription<IWebsocketManagerOpenEvent> {
        return this.subscriptions.onOpen(async () => {
            return;
        });
    }

    public onClose(): IWebsocketSubscription<IWebsocketManagerCloseEvent> {
        return this.subscriptions.onClose(async () => {
            return;
        });
    }

    public onError(): IWebsocketSubscription<IWebsocketManagerErrorEvent> {
        return this.subscriptions.onError(async () => {
            return;
        });
    }

    public onMessage(): IWebsocketSubscription<IWebsocketManagerMessageEvent> {
        return this.subscriptions.onMessage(async () => {
            return;
        });
    }
}

export const createBlackHoleWebsocketManager = (): IWebsocketManager => {
    return new BlackHoleWebsocketManager();
};
