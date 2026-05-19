import { WebhookFactory } from "./WebhookFactory.js";
import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookProvider {
    execute(): Promise<WebhookFactory.Definition[]>;
}

export const WebhookProvider = createAbstraction<IWebhookProvider>("Webhooks/WebhookProvider");

export namespace WebhookProvider {
    export type Interface = IWebhookProvider;
    export type Response = WebhookFactory.Definition[];
}
