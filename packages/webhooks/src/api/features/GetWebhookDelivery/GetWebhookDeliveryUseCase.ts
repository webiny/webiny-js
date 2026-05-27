import { Result, type Result as ResultType } from "@webiny/feature/api";
import {
    GetWebhookDeliveryUseCase as UseCaseAbstraction,
    GetWebhookDeliveryRepository
} from "./abstractions.js";
import { GetWebhookDeliveryInputSchema } from "./schema.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError, WebhookValidationError } from "~/api/domain/errors.js";
import type { WebhookDelivery } from "~/api/domain/WebhookDelivery.js";

class GetWebhookDeliveryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly repository: GetWebhookDeliveryRepository.Interface
    ) {}

    async execute(id: string): Promise<ResultType<WebhookDelivery, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canRead("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        const parsed = GetWebhookDeliveryInputSchema.safeParse({ id });
        if (!parsed.success) {
            return Result.fail(new WebhookValidationError(parsed.error));
        }

        return this.repository.execute(parsed.data.id);
    }
}

export const GetWebhookDeliveryUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetWebhookDeliveryUseCaseImpl,
    dependencies: [WebhookPermissions, GetWebhookDeliveryRepository]
});
