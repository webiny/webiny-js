import { type Result, type BaseError, createAbstraction } from "@webiny/feature/api";
import type { IWebhookSignPayloadHeaders } from "../WebhookSignPayload/abstractions.js";

export interface IWebhookVerifyPayload {
    verify(
        rawBody: string | Buffer,
        headers: IWebhookSignPayloadHeaders,
        secret: string
    ): Promise<Result<unknown, BaseError>>;
}

/** Verifies incoming webhook payloads using the Standard Webhooks spec (https://www.standardwebhooks.com). */
export const WebhookVerifyPayload = createAbstraction<IWebhookVerifyPayload>(
    "Webhooks/WebhookVerifyPayload"
);

export namespace WebhookVerifyPayload {
    export type Interface = IWebhookVerifyPayload;
    export type Headers = IWebhookSignPayloadHeaders;
}
