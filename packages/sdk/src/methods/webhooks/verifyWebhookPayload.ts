/*
 * This is a node only file, as it uses the "standardwebhooks" package which is not compatible with browsers.
 * NEVER import into UI or export alongside ui-facing code.
 */
if (typeof process === "undefined" || typeof process.versions?.node === "undefined") {
    throw new Error("@webiny/sdk/webhooks is only available in Node.js environments.");
}

import { Webhook } from "standardwebhooks";
import { Result } from "~/Result.js";

export interface WebhookSignPayloadHeaders {
    "webhook-id": string;
    "webhook-timestamp": string;
    "webhook-signature": string;
}

export const createWebhookVerifyPayload = (secret: string | undefined) => {
    if (!secret) {
        return async () => {
            throw new Error("Signing secret is not defined.");
        };
    }

    return async <T>(rawBody: string | Buffer, headers: WebhookSignPayloadHeaders) => {
        try {
            const wh = new Webhook(secret);
            const payload = wh.verify(rawBody, headers) as T;
            return Result.ok<T>(payload);
        } catch (error) {
            return Result.fail(error);
        }
    };
};
