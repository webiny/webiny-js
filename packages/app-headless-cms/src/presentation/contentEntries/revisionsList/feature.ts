import { createFeature } from "@webiny/feature/admin";
import { RevisionsListPresenter } from "./abstractions.js";
import { RevisionsListPresenterImplementation } from "./RevisionsListPresenter.js";

export const RevisionsListFeature = createFeature({
    name: "CmsContentEntries/RevisionsList",
    register(container) {
        container.register(RevisionsListPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(RevisionsListPresenter)
        };
    }
});
