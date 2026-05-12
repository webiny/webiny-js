import { createHmac } from "node:crypto";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/index.js";

class WebhookSignPayloadImpl implements WebhookSignPayload.Interface {
    async sign(
        rawBody: string,
        timestamp: number,
        secret: string
    ): Promise<WebhookSignPayload.Response> {
        const signedPayload = `${timestamp}.${rawBody}`;
        const hmac = createHmac("sha256", secret).update(signedPayload).digest("hex");
        return { hash: `t=${timestamp},v1=${hmac}` };
    }
}

export default WebhookSignPayload.createImplementation({
    implementation: WebhookSignPayloadImpl,
    dependencies: []
});
