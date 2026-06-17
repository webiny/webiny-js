import { createFeature } from "@webiny/feature/admin";
import { RefDetailedPresenter } from "./abstractions.js";
import { RefDetailedPresenterImplementation } from "./RefDetailedPresenter.js";

export const RefDetailedPresenterFeature = createFeature({
    name: "CmsRefField/DetailedPresenter",
    register(container) {
        container.register(RefDetailedPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(RefDetailedPresenter)
        };
    }
});
