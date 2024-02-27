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

    public onOpen(): IWebsocketSubscription<IWebsocketManagerOpenEvent> {
        console.log("BlackHoleWebsocketManager.onOpen");
        return this.subscriptions.onOpen(async () => {
            return;
        });
    }

    public onClose(): IWebsocketSubscription<IWebsocketManagerCloseEvent> {
        console.log("BlackHoleWebsocketManager.onClose");
        return this.subscriptions.onClose(async () => {
            return;
        });
    }

    public onError(): IWebsocketSubscription<IWebsocketManagerErrorEvent> {
        console.log("BlackHoleWebsocketManager.onError");
        return this.subscriptions.onError(async () => {
            return;
        });
    }

    public onMessage(): IWebsocketSubscription<IWebsocketManagerMessageEvent> {
        console.log("BlackHoleWebsocketManager.onMessage");
        return this.subscriptions.onMessage(async () => {
            return;
        });
    }

    public close(): void {
        console.log("BlackHoleWebsocketManager.close");
    }

    public send<T extends IWebsocketManagerSendData = IWebsocketManagerSendData>(data: T): void {
        console.log("BlackHoleWebsocketManager.send", data);
    }
}
