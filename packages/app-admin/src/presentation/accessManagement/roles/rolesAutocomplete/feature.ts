import { createFeature } from "@webiny/feature/admin";
import { RolesAutocompletePresenter as Abstraction } from "./abstractions.js";
import { RolesAutocompletePresenter } from "./RolesAutocompletePresenter.js";

export const RolesAutocompletePresenterFeature = createFeature({
    name: "AccessManagement/RolesAutocompletePresenter",
    register(container) {
        container.register(RolesAutocompletePresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
