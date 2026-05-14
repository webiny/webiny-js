import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookEventDefinition {
    app: string;
    modelId: string;
    eventName: string;
    label: string;
}

export interface IWebhookEventProvider {
    getAvailableEvents(): Promise<IWebhookEventDefinition[]>;
}

/** Implemented by bridge features; contributes subscribable events to the UI event picker. */
export const WebhookEventProvider = createAbstraction<IWebhookEventProvider>(
    "Webhooks/WebhookEventProvider"
);

export namespace WebhookEventProvider {
    export type Interface = IWebhookEventProvider;
    export type Definition = IWebhookEventDefinition;
}
