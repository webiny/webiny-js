import { generateId } from "@webiny/utils/generateId";
import {
    IGenericData,
    IWebsocketsManagerCloseEvent,
    IWebsocketsManagerErrorEvent,
    IWebsocketManagerEvent,
    IWebsocketsManagerMessageEvent,
    IWebsocketsManagerOpenEvent
} from "./types";
import {
    IWebsocketsSubscriptionManagerSubscriptions,
    IWebsocketsSubscription,
    IWebsocketsSubscriptionCallback,
    IWebsocketsSubscriptionManager
} from "./abstractions/IWebsocketsSubscriptionManager";

export class WebsocketsSubscriptionManager implements IWebsocketsSubscriptionManager {
    private subscriptions: IWebsocketsSubscriptionManagerSubscriptions = {
        open: {},
        close: {},
        error: {},
        message: {}
    };

    public onOpen(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerOpenEvent>
    ): IWebsocketsSubscription<IWebsocketsManagerOpenEvent> {
        const value = this.createSubscription<IWebsocketsManagerOpenEvent>("open", cb);
        this.subscriptions.close[value.id] = value;
        return value;
    }

    public onClose(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerCloseEvent>
    ): IWebsocketsSubscription<IWebsocketsManagerCloseEvent> {
        const value = this.createSubscription<IWebsocketsManagerCloseEvent>("close", cb);
        this.subscriptions.close[value.id] = value;
        return value;
    }

    public onError(
        cb: IWebsocketsSubscriptionCallback<IWebsocketsManagerErrorEvent>
    ): IWebsocketsSubscription<IWebsocketsManagerErrorEvent> {
        const value = this.createSubscription<IWebsocketsManagerErrorEvent>("error", cb);
        this.subscriptions.error[value.id] = value;
        return value;
    }

    public onMessage<T extends IGenericData = IGenericData>(
        cb: IWebsocketsSubscriptionCallback<T>
    ): IWebsocketsSubscription<T> {
        const value = this.createSubscription<T>("message", cb);
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

    public async triggerOnMessage(event: IWebsocketsManagerMessageEvent<string>): Promise<void> {
        let data: IGenericData = {};
        try {
            data = JSON.parse(event.data);
        } catch (ex) {
            console.error("Failed to parse the incoming message.", ex);
        }
        for (const id in this.subscriptions.message) {
            await this.subscriptions.message[id].cb({
                ...event,
                data: data || {}
            });
        }
    }

    private createSubscription<T>(
        type: IWebsocketManagerEvent,
        cb: IWebsocketsSubscriptionCallback<T>
    ): IWebsocketsSubscription<T> {
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

export const createWebsocketsSubscriptionManager = (): IWebsocketsSubscriptionManager => {
    return new WebsocketsSubscriptionManager();
};
