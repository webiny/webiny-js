import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookSignPayload {
    /** Returns Stripe-format header value: `t={timestamp},v1={hmac-sha256}`. */
    sign(rawBody: string, timestamp: number, secret: string): Promise<string>;
}

/** Signs webhook payloads using HMAC-SHA256 with the webhook's own signing secret. */
export const WebhookSignPayload = createAbstraction<IWebhookSignPayload>(
    "Webhooks/WebhookSignPayload"
);

export namespace WebhookSignPayload {
    export type Interface = IWebhookSignPayload;
}
