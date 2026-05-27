import { Result } from "@webiny/feature/api";
import {
    ListWebhookDeliveriesUseCase as UseCaseAbstraction,
    ListWebhookDeliveriesRepository
} from "./abstractions.js";
import { ListWebhookDeliveriesInputSchema } from "./schema.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError, WebhookValidationError } from "~/api/domain/errors.js";
import type { IListWebhookDeliveriesInput } from "./abstractions.js";

class ListWebhookDeliveriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly repository: ListWebhookDeliveriesRepository.Interface
    ) {}

    async execute(
        input: IListWebhookDeliveriesInput
    ): Promise<Result<UseCaseAbstraction.Output, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canRead("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        const parsed = ListWebhookDeliveriesInputSchema.safeParse(input);
        if (!parsed.success) {
            return Result.fail(new WebhookValidationError(parsed.error));
        }

        return this.repository.execute(input);
    }
}

export const ListWebhookDeliveriesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWebhookDeliveriesUseCaseImpl,
    dependencies: [WebhookPermissions, ListWebhookDeliveriesRepository]
});
