import { Result } from "@webiny/feature/api";
import {
    UpdateWebhookRepository,
    UpdateWebhookUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { UpdateWebhookInputSchema } from "./schema.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError, WebhookValidationError } from "~/api/domain/errors.js";
import type { Webhook } from "~/api/domain/Webhook.js";

class UpdateWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly getWebhookRepository: GetWebhookRepository.Interface,
        private readonly updateRepository: UpdateWebhookRepository.Interface
    ) {}

    async execute(
        id: string,
        input: UseCaseAbstraction.Input
    ): Promise<Result<Webhook, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canEdit("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        const parsed = UpdateWebhookInputSchema.safeParse(input);
        if (!parsed.success) {
            return Result.fail(new WebhookValidationError(parsed.error));
        }

        const getResult = await this.getWebhookRepository.execute(id);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const existing = getResult.value;

        const updated: Webhook = {
            ...existing,
            name: parsed.data.name ?? existing.name,
            endpointUrl: parsed.data.endpointUrl ?? existing.endpointUrl,
            description: parsed.data.description ?? existing.description,
            enabled: parsed.data.enabled ?? existing.enabled,
            events: parsed.data.events ?? existing.events,
            signingSecret: parsed.data.signingSecret ?? existing.signingSecret
        };

        return this.updateRepository.execute(updated);
    }
}

export const UpdateWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateWebhookUseCaseImpl,
    dependencies: [WebhookPermissions, GetWebhookRepository, UpdateWebhookRepository]
});
