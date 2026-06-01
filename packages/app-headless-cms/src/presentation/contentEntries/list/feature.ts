import { createFeature } from "@webiny/feature/admin";
import { ContentEntriesPresenter } from "./abstractions.js";
import { ContentEntriesPresenterImplementation } from "./ContentEntriesPresenter.js";

export const ContentEntriesPresenterFeature = createFeature({
    name: "CmsContentEntries/ListPresenter",
    register(container) {
        container.register(ContentEntriesPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(ContentEntriesPresenter)
        };
    }
});
