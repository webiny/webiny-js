import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookDispatcherData {
    [key: string]: unknown;
}

export interface IWebhookDispatcher {
    dispatch<T extends IWebhookDispatcherData = IWebhookDispatcherData>(
        eventName: string,
        data: T
    ): Promise<void>;
}

/** Routes a domain event to all matching enabled webhooks via background tasks. */
export const WebhookDispatcher = createAbstraction<IWebhookDispatcher>(
    "Webhooks/WebhookDispatcher"
);

export namespace WebhookDispatcher {
    export type Interface = IWebhookDispatcher;
    export type Data = IWebhookDispatcherData;
}
