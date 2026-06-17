import { createFeature } from "@webiny/feature/admin";
import { RefAutocompletePresenter } from "./abstractions.js";
import { RefAutocompletePresenterImplementation } from "./RefAutocompletePresenter.js";

export const RefAutocompletePresenterFeature = createFeature({
    name: "CmsRefField/AutocompletePresenter",
    register(container) {
        container.register(RefAutocompletePresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(RefAutocompletePresenter)
        };
    }
});
