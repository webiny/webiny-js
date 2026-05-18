import { createFeature } from "@webiny/feature/admin";
import { WebhookDeliveriesPresenter as PresenterAbstraction } from "./abstractions.js";
import { WebhookDeliveriesPresenter } from "./WebhookDeliveriesPresenter.js";

export const WebhookDeliveriesPresenterFeature = createFeature({
    name: "Webhooks/WebhookDeliveriesPresenter",
    register(container) {
        container.register(WebhookDeliveriesPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
