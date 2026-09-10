import { createFeature } from "@webiny/feature/admin";
import { CmsCompareEntryRevisionsPresenter as Abstraction } from "./abstractions.js";
import { CmsCompareEntryRevisionsPresenterImplementation } from "./CmsCompareEntryRevisionsPresenter.js";

export const CmsCompareEntryRevisionsPresentationFeature = createFeature({
    name: "AiPowerUps/CmsCompareEntryRevisionsPresenter",
    register(container) {
        container.register(CmsCompareEntryRevisionsPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
