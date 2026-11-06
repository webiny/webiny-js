import { Result } from "@webiny/feature/api";
import {
    ListWebhooksUseCase as UseCaseAbstraction,
    ListWebhooksRepository
} from "./abstractions.js";
import { ListWebhooksInputSchema } from "./schema.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError, WebhookValidationError } from "~/api/domain/errors.js";
import type { IListWebhooksInput } from "./abstractions.js";

class ListWebhooksUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly repository: ListWebhooksRepository.Interface
    ) {}

    async execute(
        input?: IListWebhooksInput
    ): Promise<Result<UseCaseAbstraction.Output, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canRead("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        const parsed = ListWebhooksInputSchema.safeParse(input ?? {});
        if (!parsed.success) {
            return Result.fail(new WebhookValidationError(parsed.error));
        }

        const result = await this.repository.execute(input);
        if (result.isFail()) {
            return result;
        }

        /* The signing secret is a credential: only users who can edit webhooks may see it. */
        if (!(await this.permissions.canEdit("webhook"))) {
            return Result.ok({
                ...result.value,
                items: result.value.items.map(webhook => ({ ...webhook, signingSecret: "" }))
            });
        }

        return result;
    }
}

export const ListWebhooksUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWebhooksUseCaseImpl,
    dependencies: [WebhookPermissions, ListWebhooksRepository]
});
