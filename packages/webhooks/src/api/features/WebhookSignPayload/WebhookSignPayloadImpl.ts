import { Webhook } from "standardwebhooks";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/index.js";

class WebhookSignPayloadImpl implements WebhookSignPayload.Interface {
    async sign(
        msgId: string,
        timestamp: Date,
        rawBody: string | Buffer,
        secret: string
    ): Promise<WebhookSignPayload.Headers> {
        const wh = new Webhook(secret);
        const signature = wh.sign(msgId, timestamp, rawBody);
        return {
            "webhook-id": msgId,
            "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
            "webhook-signature": signature
        };
    }
}

export default WebhookSignPayload.createImplementation({
    implementation: WebhookSignPayloadImpl,
    dependencies: []
});
