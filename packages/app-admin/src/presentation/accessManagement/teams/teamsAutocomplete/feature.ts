import { createFeature } from "@webiny/feature/admin";
import { TeamsAutocompletePresenter as Abstraction } from "./abstractions.js";
import { TeamsAutocompletePresenter } from "./TeamsAutocompletePresenter.js";

export const TeamsAutocompletePresenterFeature = createFeature({
    name: "AccessManagement/TeamsAutocompletePresenter",
    register(container) {
        container.register(TeamsAutocompletePresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
