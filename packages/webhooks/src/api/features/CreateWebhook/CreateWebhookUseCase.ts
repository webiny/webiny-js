import { Result } from "@webiny/feature/api";
import {
    CreateWebhookUseCase as UseCaseAbstraction,
    CreateWebhookRepository
} from "./abstractions.js";
import { WebhookValidationError } from "~/api/domain/errors.js";
import type { IWebhook } from "~/api/domain/types.js";
import { randomBytes } from "node:crypto";

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

class CreateWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreateWebhookRepository.Interface) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<IWebhook, UseCaseAbstraction.Error>> {
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

        const webhook: IWebhook = {
            id: randomBytes(8).toString("hex"),
            values: {
                name: input.name,
                slug: candidate,
                endpointUrl: input.endpointUrl,
                description: input.description,
                enabled: input.enabled ?? false,
                events: input.events,
                signingSecret: input.signingSecret
            }
        };

        return this.repository.execute(webhook);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: CreateWebhookUseCaseImpl,
    dependencies: [CreateWebhookRepository]
});
