import { Result } from "@webiny/feature/api";
import { ListAvailableWebhookEventsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError } from "~/api/domain/errors.js";
import { WebhookProvider } from "@webiny/api-core/features/webhooks/index.js";

class ListAvailableWebhookEventsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly provider: WebhookProvider.Interface,
        private readonly permissions: WebhookPermissions.Interface
    ) {}

    public async execute(): Promise<Result<WebhookProvider.Response, Error>> {
        if (!(await this.permissions.canRead("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        try {
            const events = await this.provider.execute();
            return Result.ok(events);
        } catch (ex) {
            return Result.fail(ex);
        }
    }
}

export const ListAvailableWebhookEventsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAvailableWebhookEventsUseCaseImpl,
    dependencies: [WebhookProvider, WebhookPermissions]
});
