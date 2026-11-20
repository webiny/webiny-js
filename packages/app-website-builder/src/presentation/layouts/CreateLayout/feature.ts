import { createFeature } from "@webiny/feature/admin";
import { CreateLayoutPresenter as PresenterAbstraction } from "./abstractions.js";
import { CreateLayoutPresenterRegistration } from "./CreateLayoutPresenter.js";
import { AddLayoutLanguageWhenEnabledModifier } from "./AddLayoutLanguageWhenEnabledModifier.js";

export const CreateLayoutDialogFeature = createFeature({
    name: "WebsiteBuilder/CreateLayoutDialog",
    register(container) {
        container.register(CreateLayoutPresenterRegistration);

        // Checks the `languages` flag itself, when the form is built. Checking it here would read
        // the flags cached in localStorage, which can predate the ones the API sends.
        container.register(AddLayoutLanguageWhenEnabledModifier);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
