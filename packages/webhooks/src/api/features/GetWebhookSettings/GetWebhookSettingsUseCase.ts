import { Result } from "@webiny/feature/api";
import {
    GetWebhookSettingsRepository,
    GetWebhookSettingsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError } from "~/api/domain/errors.js";
import type { IWebhookSettings } from "~/api/domain/WebhookSettings.js";

class GetWebhookSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly repository: GetWebhookSettingsRepository.Interface
    ) {}

    async execute(): Promise<Result<IWebhookSettings, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canEdit("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        return this.repository.execute();
    }
}

export const GetWebhookSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetWebhookSettingsUseCaseImpl,
    dependencies: [WebhookPermissions, GetWebhookSettingsRepository]
});
