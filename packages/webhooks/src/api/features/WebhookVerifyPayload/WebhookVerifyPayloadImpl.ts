import { Webhook } from "standardwebhooks";
import { Result } from "@webiny/feature/api";
import { WebhookVerifyPayload } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookVerificationFailedError } from "~/api/domain/errors.js";

class WebhookVerifyPayloadImpl implements WebhookVerifyPayload.Interface {
    public async verify<T>(
        rawBody: string | Buffer,
        headers: WebhookVerifyPayload.Headers,
        secret: string
    ): Promise<Result<T, WebhookVerificationFailedError>> {
        try {
            const wh = new Webhook(secret);
            const payload = wh.verify(rawBody, headers) as T;
            return Result.ok<T>(payload);
        } catch (error) {
            return Result.fail(new WebhookVerificationFailedError((error as Error).message));
        }
    }
}

export default WebhookVerifyPayload.createImplementation({
    implementation: WebhookVerifyPayloadImpl,
    dependencies: []
});
