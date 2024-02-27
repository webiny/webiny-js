import { generateId } from "@webiny/utils/generateId";
import {
    IWebsocketManagerCloseEvent,
    IWebsocketManagerErrorEvent,
    IWebsocketManagerEvent,
    IWebsocketManagerMessageEvent,
    IWebsocketManagerOpenEvent
} from "~/sockets/types";
import {
    IWebsocketsSubscriptionManagerSubscriptions,
    IWebsocketSubscription,
    IWebsocketSubscriptionCallback,
    IWebsocketSubscriptionManager
} from "~/sockets/abstractions/IWebsocketSubscriptionManager";

export class WebsocketSubscriptionManager implements IWebsocketSubscriptionManager {
    private subscriptions: IWebsocketsSubscriptionManagerSubscriptions = {
        open: {},
        close: {},
        error: {},
        message: {}
    };

    public onOpen(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerOpenEvent>
    ): IWebsocketSubscription<IWebsocketManagerOpenEvent> {
        const value = this.createSubscription<IWebsocketManagerOpenEvent>("open", cb);
        this.subscriptions.close[value.id] = value;
        return value;
    }

    public onClose(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerCloseEvent>
    ): IWebsocketSubscription<IWebsocketManagerCloseEvent> {
        const value = this.createSubscription<IWebsocketManagerCloseEvent>("close", cb);
        this.subscriptions.close[value.id] = value;
        return value;
    }

    public onError(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerErrorEvent>
    ): IWebsocketSubscription<IWebsocketManagerErrorEvent> {
        const value = this.createSubscription<IWebsocketManagerErrorEvent>("error", cb);
        this.subscriptions.error[value.id] = value;
        return value;
    }

    public onMessage(
        cb: IWebsocketSubscriptionCallback<IWebsocketManagerMessageEvent>
    ): IWebsocketSubscription<IWebsocketManagerMessageEvent> {
        const value = this.createSubscription<IWebsocketManagerMessageEvent>("message", cb);
        this.subscriptions.message[value.id] = value;
        return value;
    }

    public async triggerOnOpen(event: Event): Promise<void> {
        for (const id in this.subscriptions.open) {
            await this.subscriptions.open[id].cb(event);
        }
    }

    public async triggerOnClose(event: CloseEvent): Promise<void> {
        for (const id in this.subscriptions.close) {
            await this.subscriptions.close[id].cb(event);
        }
    }

    public async triggerOnError(event: Event): Promise<void> {
        for (const id in this.subscriptions.error) {
            await this.subscriptions.error[id].cb(event);
        }
    }

    public async triggerOnMessage(event: MessageEvent): Promise<void> {
        for (const id in this.subscriptions.message) {
            await this.subscriptions.message[id].cb(event);
        }
    }
    // TODO fix types
    private attach(
        type: IWebsocketManagerEvent,
        cb: IWebsocketSubscriptionCallback<any>
    ): IWebsocketSubscription<any> {
        const id = generateId();
        this.subscriptions[type][id] = {
            cb,
            id,
            off: () => {
                delete this.subscriptions[type][id];
            }
        };
        return this.subscriptions[type][id];
    }

    private createSubscription<T>(
        type: IWebsocketManagerEvent,
        cb: IWebsocketSubscriptionCallback<T>
    ): IWebsocketSubscription<T> {
        const id = generateId();
        return {
            cb,
            id,
            off: () => {
                delete this.subscriptions[type][id];
            }
        };
    }
}
