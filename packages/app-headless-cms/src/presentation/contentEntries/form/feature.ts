import { createFeature } from "@webiny/feature/admin";
import { ContentEntryFormPresenter as Abstraction } from "./abstractions.js";
import { ContentEntryFormPresenter } from "./ContentEntryFormPresenter.js";

export const ContentEntryFormPresenterFeature = createFeature({
    name: "CmsContentEntries/FormPresenter",
    register(container) {
        container.register(ContentEntryFormPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
