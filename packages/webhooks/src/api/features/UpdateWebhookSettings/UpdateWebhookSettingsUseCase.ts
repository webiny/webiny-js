import { Result } from "@webiny/feature/api";
import {
    UpdateWebhookSettingsRepository,
    UpdateWebhookSettingsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError } from "~/api/domain/errors.js";
import type { IWebhookSettings } from "~/api/domain/WebhookSettings.js";

class UpdateWebhookSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly repository: UpdateWebhookSettingsRepository.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<IWebhookSettings, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canEdit("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        return this.repository.execute(input);
    }
}

export const UpdateWebhookSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateWebhookSettingsUseCaseImpl,
    dependencies: [WebhookPermissions, UpdateWebhookSettingsRepository]
});
