import { createFeature } from "@webiny/feature/admin";
import { ContentEntriesPresenter as Abstraction } from "./abstractions.js";
import { ContentEntriesPresenter } from "./ContentEntriesPresenter.js";

export const ContentEntriesPresenterFeature = createFeature({
    name: "CmsContentEntries/ListPresenter",
    register(container) {
        container.register(ContentEntriesPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
