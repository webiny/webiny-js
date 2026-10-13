import { createFeature } from "@webiny/feature/admin";
import { CmsCompareEntryRevisionsPresenter as Abstraction } from "./abstractions.js";
import { CmsCompareEntryRevisionsPresenterImplementation } from "./CmsCompareEntryRevisionsPresenter.js";

export const CmsCompareEntryRevisionsPresentationFeature = createFeature({
    name: "AiPowerUps/CmsCompareEntryRevisionsPresenter",
    register(container) {
        // One per container, not a singleton. The presenter reads the revisions list, which only the
        // content entries view's child container registers. A container-scoped instance is built from
        // that child, and the header menu item and the overlays still share it.
        container.register(CmsCompareEntryRevisionsPresenterImplementation).inContainerScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
