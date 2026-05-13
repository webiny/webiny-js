import { Result } from "@webiny/feature/api";
import {
    DeleteWebhookUseCase as UseCaseAbstraction,
    DeleteWebhookRepository
} from "./abstractions.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError } from "~/api/domain/errors.js";

class DeleteWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WebhookPermissions.Interface,
        private getWebhookRepository: GetWebhookRepository.Interface,
        private deleteRepository: DeleteWebhookRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<boolean, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canDelete("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }
        const getResult = await this.getWebhookRepository.execute(id);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }
        return this.deleteRepository.execute(id);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: DeleteWebhookUseCaseImpl,
    dependencies: [WebhookPermissions, GetWebhookRepository, DeleteWebhookRepository]
});
