import { createFeature } from "@webiny/feature/admin";
import { ActiveReviewWarningPresenter as PresenterAbstraction } from "./ActiveReviewWarningPresenter/abstractions.js";
import { ActiveReviewBlockCollector } from "./ActiveReviewBlockCollector/ActiveReviewBlockCollector.js";
import { ActiveReviewGuard } from "./ActiveReviewGuard/ActiveReviewGuard.js";
import { ActiveReviewWarningPresenter } from "./ActiveReviewWarningPresenter/ActiveReviewWarningPresenter.js";

export const ActiveReviewTrashFeature = createFeature({
    name: "Workflows/ActiveReviewTrash",
    register(container) {
        container.register(ActiveReviewBlockCollector).inSingletonScope();
        container.register(ActiveReviewGuard).inSingletonScope();
        // Transient (R212): every dialog gets its own presenter.
        container.register(ActiveReviewWarningPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
