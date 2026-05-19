import { createFeature } from "@webiny/feature/admin";
import { WebhookSettingsPresenter as PresenterAbstraction } from "./abstractions.js";
import { WebhookSettingsPresenter } from "./WebhookSettingsPresenter.js";

export const WebhookSettingsPresenterFeature = createFeature({
    name: "Webhooks/WebhookSettingsPresenter",
    register(container) {
        container.register(WebhookSettingsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
