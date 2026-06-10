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

        return this.repository.execute(input);
    }
}

export const ListWebhooksUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWebhooksUseCaseImpl,
    dependencies: [WebhookPermissions, ListWebhooksRepository]
});
