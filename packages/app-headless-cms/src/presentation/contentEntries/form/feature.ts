import { createFeature } from "@webiny/feature/admin";
import { ContentEntryFormPresenter } from "./abstractions.js";
import { ContentEntryFormPresenterImplementation } from "./ContentEntryFormPresenter.js";

export const ContentEntryFormPresenterFeature = createFeature({
    name: "CmsContentEntries/FormPresenter",
    register(container) {
        container.register(ContentEntryFormPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(ContentEntryFormPresenter)
        };
    }
});
