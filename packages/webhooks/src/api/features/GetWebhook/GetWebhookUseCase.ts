import { Result } from "@webiny/feature/api";
import { GetWebhookUseCase as UseCaseAbstraction, GetWebhookRepository } from "./abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError } from "~/api/domain/errors.js";
import type { IWebhook } from "~/api/domain/types.js";

class GetWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WebhookPermissions.Interface,
        private repository: GetWebhookRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<IWebhook, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canRead("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }
        return this.repository.execute(id);
    }
}

export const GetWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetWebhookUseCaseImpl,
    dependencies: [WebhookPermissions, GetWebhookRepository]
});
