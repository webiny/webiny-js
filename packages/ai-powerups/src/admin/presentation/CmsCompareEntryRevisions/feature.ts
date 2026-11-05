import { createFeature } from "@webiny/feature/admin";
import { CmsCompareEntryRevisionsPresenter as Abstraction } from "./abstractions.js";
import CmsCompareEntryRevisionsPresenter from "./CmsCompareEntryRevisionsPresenter.js";

export const CmsCompareEntryRevisionsPresentationFeature = createFeature({
    name: "AiPowerUps/CmsCompareEntryRevisionsPresenter",
    register(container) {
        container.register(CmsCompareEntryRevisionsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
