import { createFeature } from "@webiny/feature/admin";
import { RefSimplePresenter } from "./abstractions.js";
import { RefSimplePresenterImplementation } from "./RefSimplePresenter.js";

export const RefSimplePresenterFeature = createFeature({
    name: "CmsRefField/SimplePresenter",
    register(container) {
        container.register(RefSimplePresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(RefSimplePresenter)
        };
    }
});
