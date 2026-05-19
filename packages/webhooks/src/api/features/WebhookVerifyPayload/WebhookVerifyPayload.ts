import { Webhook } from "standardwebhooks";
import { Result } from "@webiny/feature/api";
import { WebhookVerifyPayload as WebhookVerifyPayloadAbstraction } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookVerificationFailedError } from "~/api/domain/errors.js";

class WebhookVerifyPayloadImpl implements WebhookVerifyPayloadAbstraction.Interface {
    public async verify<T>(
        rawBody: string | Buffer,
        headers: WebhookVerifyPayloadAbstraction.Headers,
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

export const WebhookVerifyPayload = WebhookVerifyPayloadAbstraction.createImplementation({
    implementation: WebhookVerifyPayloadImpl,
    dependencies: []
});
