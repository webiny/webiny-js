import { Result } from "@webiny/feature/api";
import {
    UpdateWebhookUseCase as UseCaseAbstraction,
    UpdateWebhookRepository
} from "./abstractions.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookValidationError, WebhookNotAuthorizedError } from "~/api/domain/errors.js";
import type { Webhook } from "~/api/domain/Webhook.js";

const isValidEndpointUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        if (parsed.protocol === "https:") {
            return true;
        }
        if (
            parsed.protocol === "http:" &&
            (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
        ) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
};

class UpdateWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WebhookPermissions.Interface,
        private getWebhookRepository: GetWebhookRepository.Interface,
        private updateRepository: UpdateWebhookRepository.Interface
    ) {}

    async execute(
        id: string,
        input: UseCaseAbstraction.Input
    ): Promise<Result<Webhook, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canEdit("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        const getResult = await this.getWebhookRepository.execute(id);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const existing = getResult.value;

        if (input.endpointUrl && !isValidEndpointUrl(input.endpointUrl)) {
            return Result.fail(
                new WebhookValidationError(
                    "Endpoint URL must use HTTPS. HTTP is only allowed for localhost."
                )
            );
        }

        if (input.events !== undefined && input.events.length === 0) {
            return Result.fail(new WebhookValidationError("At least one event must be selected."));
        }

        const updated: Webhook = {
            ...existing,
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.slug !== undefined ? { slug: input.slug } : {}),
            ...(input.endpointUrl !== undefined ? { endpointUrl: input.endpointUrl } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
            ...(input.events !== undefined ? { events: input.events } : {}),
            ...(input.signingSecret !== undefined ? { signingSecret: input.signingSecret } : {})
        };

        return this.updateRepository.execute(updated);
    }
}

export const UpdateWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateWebhookUseCaseImpl,
    dependencies: [WebhookPermissions, GetWebhookRepository, UpdateWebhookRepository]
});
