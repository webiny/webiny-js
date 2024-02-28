import { IWebsocketsManager, IWebsocketManagerSendData } from "./abstractions/IWebsocketsManager";
import { IWebsocketsSubscription } from "./abstractions/IWebsocketsSubscriptionManager";
import {
    IWebsocketsManagerCloseEvent,
    IWebsocketsManagerErrorEvent,
    IWebsocketsManagerMessageEvent,
    IWebsocketsManagerOpenEvent
} from "./types";
import { WebsocketsSubscriptionManager } from "./WebsocketsSubscriptionManager";

export class BlackHoleWebsocketsManager implements IWebsocketsManager {
    private readonly subscriptions = new WebsocketsSubscriptionManager();

    public connect(): void {
        return;
    }

    public close(): void {
        return;
    }

    public send<T extends IWebsocketManagerSendData = IWebsocketManagerSendData>(data: T): void {
        console.log("BlackHoleWebsocketManager.send", data);
    }

    public onOpen(): IWebsocketsSubscription<IWebsocketsManagerOpenEvent> {
        return this.subscriptions.onOpen(async () => {
            return;
        });
    }

    public onClose(): IWebsocketsSubscription<IWebsocketsManagerCloseEvent> {
        return this.subscriptions.onClose(async () => {
            return;
        });
    }

    public onError(): IWebsocketsSubscription<IWebsocketsManagerErrorEvent> {
        return this.subscriptions.onError(async () => {
            return;
        });
    }

    public onMessage(): IWebsocketsSubscription<IWebsocketsManagerMessageEvent> {
        return this.subscriptions.onMessage(async () => {
            return;
        });
    }
}

export const createWebsocketsBlackHoleManager = (): IWebsocketsManager => {
    return new BlackHoleWebsocketsManager();
};
