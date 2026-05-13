import { Result } from "@webiny/feature/api";
import {
    ListWebhookDeliveriesUseCase as UseCaseAbstraction,
    ListWebhookDeliveriesRepository
} from "./abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError } from "~/api/domain/errors.js";
import type { IListWebhookDeliveriesInput } from "~/api/domain/types.js";

class ListWebhookDeliveriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WebhookPermissions.Interface,
        private repository: ListWebhookDeliveriesRepository.Interface
    ) {}

    async execute(
        input: IListWebhookDeliveriesInput
    ): Promise<Result<UseCaseAbstraction.Output, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canRead("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }
        return this.repository.execute(input);
    }
}

export const ListWebhookDeliveriesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWebhookDeliveriesUseCaseImpl,
    dependencies: [WebhookPermissions, ListWebhookDeliveriesRepository]
});
