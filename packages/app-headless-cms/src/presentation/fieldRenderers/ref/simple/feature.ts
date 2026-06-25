import { createFeature } from "@webiny/feature/admin";
import { RefSimplePresenter as Abstraction } from "./abstractions.js";
import { RefSimplePresenter } from "./RefSimplePresenter.js";

export const RefSimplePresenterFeature = createFeature({
    name: "CmsRefField/SimplePresenter",
    register(container) {
        container.register(RefSimplePresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
