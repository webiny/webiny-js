import { Result } from "@webiny/feature/api";
import {
    UpdateWebhookSettingsRepository,
    UpdateWebhookSettingsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { UpdateWebhookSettingsInputSchema } from "./schema.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError, WebhookValidationError } from "~/api/domain/errors.js";
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

        const parsed = UpdateWebhookSettingsInputSchema.safeParse(input);
        if (!parsed.success) {
            return Result.fail(new WebhookValidationError(parsed.error));
        }

        return this.repository.execute(parsed.data);
    }
}

export const UpdateWebhookSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateWebhookSettingsUseCaseImpl,
    dependencies: [WebhookPermissions, UpdateWebhookSettingsRepository]
});
