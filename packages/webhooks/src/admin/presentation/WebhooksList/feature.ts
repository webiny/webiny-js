import { createFeature } from "@webiny/feature/admin";
import { WebhooksListPresenter as Abstraction } from "./abstractions.js";
import { WebhooksListPresenter } from "./WebhooksListPresenter.js";

export const WebhooksListFeature = createFeature({
    name: "Webhooks/WebhooksList",
    register(container) {
        container.register(WebhooksListPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
