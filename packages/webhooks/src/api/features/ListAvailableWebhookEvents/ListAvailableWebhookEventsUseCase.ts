import { Result } from "@webiny/feature/api";
import { ListAvailableWebhookEventsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError } from "~/api/domain/errors.js";
import type { WebhookEventProvider } from "@webiny/api-core/features/webhooks/index.js";
import type { IWebhookEventDefinition } from "~/api/domain/types.js";

export class ListAvailableWebhookEventsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getProviders: () => WebhookEventProvider.Interface[],
        private permissions: WebhookPermissions.Interface
    ) {}

    async execute(): Promise<Result<IWebhookEventDefinition[], Error>> {
        if (!(await this.permissions.canRead("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        try {
            const providers = this.getProviders();
            const allEvents: IWebhookEventDefinition[] = [];
            for (const provider of providers) {
                const events = await provider.getAvailableEvents();
                allEvents.push(...events);
            }
            return Result.ok(allEvents);
        } catch (error) {
            return Result.fail(error as Error);
        }
    }
}
