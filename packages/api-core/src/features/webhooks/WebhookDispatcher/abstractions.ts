import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookDispatcher {
    dispatch(eventName: string, data: object): Promise<void>;
}

/** Routes a domain event to all matching enabled webhooks via background tasks. */
export const WebhookDispatcher = createAbstraction<IWebhookDispatcher>(
    "Webhooks/WebhookDispatcher"
);

export namespace WebhookDispatcher {
    export type Interface = IWebhookDispatcher;
}
