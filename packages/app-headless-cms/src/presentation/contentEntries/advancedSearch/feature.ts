import { createFeature } from "@webiny/feature/admin";
import { CmsAdvancedSearchPresenter as Abstraction } from "./abstractions.js";
import { CmsAdvancedSearchPresenter } from "./CmsAdvancedSearchPresenter.js";

export const CmsAdvancedSearchFeature = createFeature({
    name: "CmsContentEntries/AdvancedSearch",
    register(container) {
        container.register(CmsAdvancedSearchPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
