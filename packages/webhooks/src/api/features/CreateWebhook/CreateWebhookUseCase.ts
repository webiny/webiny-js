import { Result } from "@webiny/feature/api";
import {
    CreateWebhookRepository,
    CreateWebhookUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { CreateWebhookInputSchema } from "./schema.js";
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

class CreateWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly repository: CreateWebhookRepository.Interface,
        private readonly listWebhooksRepository: ListWebhooksRepository.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<Webhook, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canCreate("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        const parsed = CreateWebhookInputSchema.safeParse(input);
        if (!parsed.success) {
            return Result.fail(new WebhookValidationError(parsed.error));
        }

        const slug = (parsed.data.slug || "").trim() || generateSlug(parsed.data.name);

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
            name: parsed.data.name,
            slug,
            endpointUrl: parsed.data.endpointUrl,
            description: parsed.data.description,
            enabled: parsed.data.enabled ?? false,
            events: parsed.data.events,
            signingSecret: parsed.data.signingSecret ?? ""
        };

        return this.repository.execute(webhook);
    }
}

export const CreateWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateWebhookUseCaseImpl,
    dependencies: [WebhookPermissions, CreateWebhookRepository, ListWebhooksRepository]
});
