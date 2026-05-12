import { Webhook } from "standardwebhooks";
import { Result } from "@webiny/feature/api";
import { WebhookVerifyPayload } from "@webiny/api-core/features/webhooks/index.js";
import type { IWebhookSignPayloadHeaders } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookVerificationFailedError } from "~/api/domain/errors.js";

class WebhookVerifyPayloadImpl implements WebhookVerifyPayload.Interface {
    async verify(rawBody: string | Buffer, headers: IWebhookSignPayloadHeaders, secret: string) {
        try {
            const wh = new Webhook(secret);
            const payload = wh.verify(
                typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"),
                headers
            );
            return Result.ok(payload);
        } catch (error) {
            return Result.fail(new WebhookVerificationFailedError((error as Error).message));
        }
    }
}

export default WebhookVerifyPayload.createImplementation({
    implementation: WebhookVerifyPayloadImpl,
    dependencies: []
});
