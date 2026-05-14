import { createFeature } from "@webiny/feature/api";
import { ListAvailableWebhookEventsUseCase } from "./ListAvailableWebhookEventsUseCase.js";

export const ListAvailableWebhookEventsFeature = createFeature({
    name: "ListAvailableWebhookEvents",
    register(container) {
        container.register(ListAvailableWebhookEventsUseCase);
    }
});
