import { createFeature } from "@webiny/feature/admin";
import { CreatePagePresenter as PresenterAbstraction } from "./abstractions.js";
import { CreatePagePresenter } from "./CreatePagePresenter.js";
import { PageTypeProvider } from "./PageTypeProvider.js";
import { StaticPageType } from "./StaticPageType.js";
import { AddLanguageWhenEnabledModifier } from "./AddLanguageModifier.js";

export const CreatePageFeature = createFeature({
    name: "CreatePage",
    register(container) {
        container.register(StaticPageType);
        container.register(PageTypeProvider);
        container.register(CreatePagePresenter);

        // Checks the `languages` flag itself, when the form is built. Checking it here would read
        // the flags cached in localStorage, which can predate the ones the API sends.
        container.register(AddLanguageWhenEnabledModifier);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
