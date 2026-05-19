import { Webhook } from "standardwebhooks";
import { WebhookSignPayload as WebhookSignPayloadAbstraction } from "@webiny/api-core/features/webhooks/index.js";

class WebhookSignPayloadImpl implements WebhookSignPayloadAbstraction.Interface {
    async sign(
        msgId: string,
        timestamp: Date,
        rawBody: string | Buffer,
        secret: string
    ): Promise<WebhookSignPayloadAbstraction.Headers> {
        const wh = new Webhook(secret);
        const signature = wh.sign(msgId, timestamp, rawBody);
        return {
            "webhook-id": msgId,
            "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
            "webhook-signature": signature
        };
    }
}

export const WebhookSignPayload = WebhookSignPayloadAbstraction.createImplementation({
    implementation: WebhookSignPayloadImpl,
    dependencies: []
});
