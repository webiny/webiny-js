import { createFeature } from "@webiny/feature/api";
import { WebhookEventProvider } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { ListAvailableWebhookEventsUseCase } from "./abstractions.js";
import { ListAvailableWebhookEventsUseCaseImpl } from "./ListAvailableWebhookEventsUseCase.js";

export const ListAvailableWebhookEventsFeature = createFeature({
    name: "ListAvailableWebhookEvents",
    register(container) {
        container.registerFactory(ListAvailableWebhookEventsUseCase, () => {
            return new ListAvailableWebhookEventsUseCaseImpl(
                () => container.resolveAll<WebhookEventProvider.Interface>(WebhookEventProvider),
                container.resolve(WebhookPermissions)
            );
        });
    }
});
