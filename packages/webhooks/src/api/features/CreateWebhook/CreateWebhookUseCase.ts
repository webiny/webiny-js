import { Result } from "@webiny/feature/api";
import {
    CreateWebhookRepository,
    CreateWebhookUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { ListWebhooksRepository } from "~/api/features/ListWebhooks/abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError, WebhookValidationError } from "~/api/domain/errors.js";
import type { Webhook, WebhookCmsEntryValues } from "~/api/domain/Webhook.js";

const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 64);
};

const isValidEndpointUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        if (parsed.protocol === "https:") {
            return true;
        } else if (
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

class CreateWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WebhookPermissions.Interface,
        private repository: CreateWebhookRepository.Interface,
        private listWebhooksRepository: ListWebhooksRepository.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<Webhook, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canCreate("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        if (!isValidEndpointUrl(input.endpointUrl)) {
            return Result.fail(
                new WebhookValidationError(
                    "Endpoint URL must use HTTPS. HTTP is only allowed for localhost."
                )
            );
        }

        if (!input.events || input.events.length === 0) {
            return Result.fail(new WebhookValidationError("At least one event must be selected."));
        }

        const slug = (input.slug || "").trim() || generateSlug(input.name);

        const listResult = await this.listWebhooksRepository.execute({
            where: {
                slug
            },
            limit: 1
        });
        if (listResult.isOk() && listResult.value.items.length > 0) {
            return Result.fail(new WebhookValidationError(`Slug "${slug}" is already taken.`));
        }

        const webhook: WebhookCmsEntryValues = {
            name: input.name,
            slug,
            endpointUrl: input.endpointUrl,
            description: input.description,
            enabled: input.enabled ?? false,
            events: input.events,
            signingSecret: input.signingSecret
        };

        return this.repository.execute(webhook);
    }
}

export const CreateWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateWebhookUseCaseImpl,
    dependencies: [WebhookPermissions, CreateWebhookRepository, ListWebhooksRepository]
});
