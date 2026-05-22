import { createFeature } from "@webiny/feature/admin";
import { WebhookDeliveriesPagePresenter as PresenterAbstraction } from "./abstractions.js";
import { WebhookDeliveriesPagePresenter } from "./WebhookDeliveriesPagePresenter.js";

export const WebhookDeliveriesPagePresenterFeature = createFeature({
    name: "Webhooks/WebhookDeliveriesPagePresenter",
    register(container) {
        container.register(WebhookDeliveriesPagePresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
