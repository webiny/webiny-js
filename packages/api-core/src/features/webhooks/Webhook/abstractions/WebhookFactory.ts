import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookFactoryDefinition {
    app: string;
    entity: string;
    eventName: string;
    label: string;
}

export interface IWebhookFactory {
    execute(): Promise<IWebhookFactoryDefinition[]>;
}

export const WebhookFactory = createAbstraction<IWebhookFactory>("Webhooks/WebhookFactory");

export namespace WebhookFactory {
    export type Interface = IWebhookFactory;
    export type Definition = IWebhookFactoryDefinition;
}
