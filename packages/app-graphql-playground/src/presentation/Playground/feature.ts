import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { PlaygroundPresenter } from "./abstractions.js";
import { DefaultPlaygroundPresenter } from "./PlaygroundPresenter.js";

export const PlaygroundPresenterFeature = createFeature({
    name: "PlaygroundPresenter",
    register(container) {
        // One per container: the presenter reads the per-tenant playground repositories.
        container.register(DefaultPlaygroundPresenter).inContainerScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PlaygroundPresenter)
        };
    }
});
