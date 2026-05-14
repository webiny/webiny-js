import { Result } from "@webiny/feature/api";
import {
    CreateWebhookUseCase as UseCaseAbstraction,
    CreateWebhookRepository
} from "./abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookValidationError, WebhookNotAuthorizedError } from "~/api/domain/errors.js";
import type { Webhook, WebhookCmsEntry } from "~/api/domain/Webhook.js";

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
        private repository: CreateWebhookRepository.Interface
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

        let slug = (input.slug || "").trim();
        if (!slug) {
            slug = generateSlug(input.name);
        }

        let candidate = slug;
        let attempt = 0;
        while (await this.repository.slugExists(candidate)) {
            attempt++;
            candidate = `${slug}-${attempt}`;
        }

        const webhook: WebhookCmsEntry["values"] = {
            name: input.name,
            slug: candidate,
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
    dependencies: [WebhookPermissions, CreateWebhookRepository]
});
