import { createFeature } from "@webiny/feature/admin";
import { WebhookFormPresenter as PresenterAbstraction } from "./abstractions.js";
import { WebhookFormPresenter } from "./WebhookFormPresenter.js";

export const WebhookFormPresenterFeature = createFeature({
    name: "Webhooks/WebhookFormPresenter",
    register(container) {
        container.register(WebhookFormPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
