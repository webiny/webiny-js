import { createFeature } from "@webiny/feature/admin";
import { StarterKitConfigPresenter as PresenterAbstraction } from "./abstractions.js";
import { StarterKitConfigPresenter } from "./StarterKitConfigPresenter.js";

export const StarterKitConfigFeature = createFeature({
    name: "FrontendSettings/StarterKitConfig",
    register(container) {
        container.register(StarterKitConfigPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
