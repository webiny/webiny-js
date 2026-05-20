import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookDeliverInput {
    url: string;
    headers: Record<string, string>;
    body: string;
    timeout: number;
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
}

export interface IWebhookDeliverResult {
    status: number;
    body: string;
    responseTime: number;
    attempts: number;
}

export interface IWebhookDeliver {
    execute(input: IWebhookDeliverInput): Promise<IWebhookDeliverResult>;
}

export const WebhookDeliver = createAbstraction<IWebhookDeliver>("Webhooks/WebhookDeliver");

export namespace WebhookDeliver {
    export type Interface = IWebhookDeliver;
    export type Input = IWebhookDeliverInput;
    export type Result = IWebhookDeliverResult;
}
