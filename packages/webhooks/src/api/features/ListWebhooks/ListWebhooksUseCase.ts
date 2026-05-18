import { Result } from "@webiny/feature/api";
import {
    ListWebhooksUseCase as UseCaseAbstraction,
    ListWebhooksRepository
} from "./abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError } from "~/api/domain/errors.js";
import type { IListWebhooksInput } from "./abstractions.js";

class ListWebhooksUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WebhookPermissions.Interface,
        private repository: ListWebhooksRepository.Interface
    ) {}

    async execute(
        input?: IListWebhooksInput
    ): Promise<Result<UseCaseAbstraction.Output, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canRead("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }
        return this.repository.execute(input);
    }
}

export const ListWebhooksUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWebhooksUseCaseImpl,
    dependencies: [WebhookPermissions, ListWebhooksRepository]
});
