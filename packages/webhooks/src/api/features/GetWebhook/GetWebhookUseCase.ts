import { Result } from "@webiny/feature/api";
import { GetWebhookUseCase as UseCaseAbstraction, GetWebhookRepository } from "./abstractions.js";
import { GetWebhookInputSchema } from "./schema.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError, WebhookValidationError } from "~/api/domain/errors.js";
import type { Webhook } from "~/api/domain/Webhook.js";

class GetWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly repository: GetWebhookRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<Webhook, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canRead("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        const parsed = GetWebhookInputSchema.safeParse({ id });
        if (!parsed.success) {
            return Result.fail(new WebhookValidationError(parsed.error));
        }

        const result = await this.repository.execute(parsed.data.id);
        if (result.isFail()) {
            return result;
        }

        /* The signing secret is a credential: only users who can edit webhooks may see it. */
        if (!(await this.permissions.canEdit("webhook"))) {
            return Result.ok({ ...result.value, signingSecret: "" });
        }

        return result;
    }
}

export const GetWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetWebhookUseCaseImpl,
    dependencies: [WebhookPermissions, GetWebhookRepository]
});
