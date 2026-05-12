import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookSignPayloadResponse {
    hash: string;
}

export interface IWebhookSignPayload {
    sign(rawBody: string, timestamp: number, secret: string): Promise<IWebhookSignPayloadResponse>;
}

/** Signs webhook payloads using HMAC-SHA256 with the webhook's own signing secret. */
export const WebhookSignPayload = createAbstraction<IWebhookSignPayload>(
    "Webhooks/WebhookSignPayload"
);

export namespace WebhookSignPayload {
    export type Interface = IWebhookSignPayload;
    export type Response = IWebhookSignPayloadResponse;
}
