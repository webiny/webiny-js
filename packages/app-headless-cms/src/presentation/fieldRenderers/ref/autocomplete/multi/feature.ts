import { createFeature } from "@webiny/feature/admin";
import { RefMultiAutocompletePresenter as Abstraction } from "./abstractions.js";
import { RefMultiAutocompletePresenter } from "./RefMultiAutocompletePresenter.js";

export const RefMultiAutocompletePresenterFeature = createFeature({
    name: "CmsRefField/MultiAutocompletePresenter",
    register(container) {
        container.register(RefMultiAutocompletePresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
