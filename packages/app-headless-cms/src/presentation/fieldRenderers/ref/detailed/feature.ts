import { createFeature } from "@webiny/feature/admin";
import { RefDetailedPresenter as Abstraction } from "./abstractions.js";
import { RefDetailedPresenter } from "./RefDetailedPresenter.js";

export const RefDetailedPresenterFeature = createFeature({
    name: "CmsRefField/DetailedPresenter",
    register(container) {
        container.register(RefDetailedPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
