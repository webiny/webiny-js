import { Result } from "@webiny/feature/api";
import {
    DeleteWebhookUseCase as UseCaseAbstraction,
    DeleteWebhookRepository
} from "./abstractions.js";
import { DeleteWebhookInputSchema } from "./schema.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError, WebhookValidationError } from "~/api/domain/errors.js";

class DeleteWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly getWebhookRepository: GetWebhookRepository.Interface,
        private readonly deleteRepository: DeleteWebhookRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<boolean, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canDelete("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        const parsed = DeleteWebhookInputSchema.safeParse({ id });
        if (!parsed.success) {
            return Result.fail(new WebhookValidationError(parsed.error));
        }

        const getResult = await this.getWebhookRepository.execute(parsed.data.id);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        return this.deleteRepository.execute(parsed.data.id);
    }
}

export const DeleteWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteWebhookUseCaseImpl,
    dependencies: [WebhookPermissions, GetWebhookRepository, DeleteWebhookRepository]
});
