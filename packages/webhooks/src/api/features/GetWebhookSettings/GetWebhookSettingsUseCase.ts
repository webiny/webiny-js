import { Result } from "@webiny/feature/api";
import { GetWebhookSettingsUseCase as UseCaseAbstraction } from "./abstractions/GetWebhookSettingsUseCase.js";
import { GetWebhookSettingsRepository } from "./abstractions/GetWebhookSettingsRepository.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError } from "~/api/domain/errors.js";
import type { IWebhookSettings } from "~/api/domain/WebhookSettings.js";

class GetWebhookSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly repository: GetWebhookSettingsRepository.Interface
    ) {}

    async execute(): Promise<Result<IWebhookSettings, UseCaseAbstraction.Error>> {
        /* The check runs before the repository, which creates the settings entry when it is missing. */
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
