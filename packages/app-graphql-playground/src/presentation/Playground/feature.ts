import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { PlaygroundPresenter } from "./abstractions.js";
import { DefaultPlaygroundPresenter } from "./PlaygroundPresenter.js";

export const PlaygroundPresenterFeature = createFeature({
    name: "PlaygroundPresenter",
    register(container) {
        container.register(DefaultPlaygroundPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PlaygroundPresenter)
        };
    }
});
