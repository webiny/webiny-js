import { createFeature } from "@webiny/feature/admin";
import { BannersPresenter as Abstraction } from "./abstractions.js";
import { BannersPresenter } from "./BannersPresenter.js";

export const BannersPresenterFeature = createFeature({
    name: "BannersPresenter",
    register(container) {
        // Singleton so every mount of the bar reads the same state.
        container.register(BannersPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
