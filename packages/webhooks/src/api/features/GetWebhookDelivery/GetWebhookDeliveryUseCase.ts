import { Result, type Result as ResultType } from "@webiny/feature/api";
import {
    GetWebhookDeliveryUseCase as UseCaseAbstraction,
    GetWebhookDeliveryRepository
} from "./abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError } from "~/api/domain/errors.js";
import type { WebhookDelivery } from "~/api/domain/WebhookDelivery.js";

class GetWebhookDeliveryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WebhookPermissions.Interface,
        private repository: GetWebhookDeliveryRepository.Interface
    ) {}

    async execute(id: string): Promise<ResultType<WebhookDelivery, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canRead("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }
        return this.repository.execute(id);
    }
}

export const GetWebhookDeliveryUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetWebhookDeliveryUseCaseImpl,
    dependencies: [WebhookPermissions, GetWebhookDeliveryRepository]
});
