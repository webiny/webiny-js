import { createFeature } from "@webiny/feature/admin";
import { RevisionsListPresenter as Abstraction } from "./abstractions.js";
import { RevisionsListPresenter } from "./RevisionsListPresenter.js";

export const RevisionsListFeature = createFeature({
    name: "CmsContentEntries/RevisionsList",
    register(container) {
        container.register(RevisionsListPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
