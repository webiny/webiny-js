import { Webhook } from "standardwebhooks";
import { WebhookSignPayload as WebhookSignPayloadAbstraction } from "@webiny/api-core/features/webhooks/index.js";

class WebhookSignPayloadImpl implements WebhookSignPayloadAbstraction.Interface {
    async sign(
        msgId: string,
        timestamp: Date,
        rawBody: string | Buffer,
        secret: string
    ): Promise<WebhookSignPayloadAbstraction.Headers> {
        /* The standardwebhooks library expects the secret to be base64-encoded
           (optionally prefixed with "whsec_"). User-provided secrets are plain
           text, so we base64-encode them before passing to the library. */
        const encodedSecret = this.ensureBase64(secret);
        const wh = new Webhook(encodedSecret);
        const signature = wh.sign(msgId, timestamp, rawBody);
        return {
            "webhook-id": msgId,
            "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
            "webhook-signature": signature
        };
    }

    private ensureBase64(secret: string): string {
        if (secret.startsWith("whsec_")) {
            return secret;
        }

        const encoded = Buffer.from(secret).toString("base64");
        return `whsec_${encoded}`;
    }
}

export const WebhookSignPayload = WebhookSignPayloadAbstraction.createImplementation({
    implementation: WebhookSignPayloadImpl,
    dependencies: []
});
