import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookSignPayloadHeaders {
    "webhook-id": string;
    "webhook-timestamp": string;
    "webhook-signature": string;
}

export interface IWebhookSignPayload {
    sign(
        msgId: string,
        timestamp: Date,
        rawBody: string | Buffer,
        secret: string
    ): Promise<IWebhookSignPayloadHeaders>;
}

/** Signs webhook payloads using the Standard Webhooks spec (https://www.standardwebhooks.com). */
export const WebhookSignPayload = createAbstraction<IWebhookSignPayload>(
    "Webhooks/WebhookSignPayload"
);

export namespace WebhookSignPayload {
    export type Interface = IWebhookSignPayload;
    export type Headers = IWebhookSignPayloadHeaders;
}
