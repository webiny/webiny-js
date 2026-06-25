import { createFeature } from "@webiny/feature/admin";
import { RefSingleAutocompletePresenter as Abstraction } from "./abstractions.js";
import { RefSingleAutocompletePresenter } from "./RefSingleAutocompletePresenter.js";

export const RefSingleAutocompletePresenterFeature = createFeature({
    name: "CmsRefField/SingleAutocompletePresenter",
    register(container) {
        container.register(RefSingleAutocompletePresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
