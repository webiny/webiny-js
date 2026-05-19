import { createFeature } from "@webiny/feature/admin";
import { WebhookListPresenter as PresenterAbstraction } from "./abstractions.js";
import { WebhookListPresenter } from "./WebhookListPresenter.js";

export const WebhookListPresenterFeature = createFeature({
    name: "Webhooks/WebhookListPresenter",
    register(container) {
        container.register(WebhookListPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
