import { createFeature } from "@webiny/feature/admin";
import { ActiveReviewWarningPresenter as PresenterAbstraction } from "./ActiveReviewWarningPresenter.js";
import { ActiveReviewBlockCollector } from "./ActiveReviewBlockCollectorImpl.js";
import { ActiveReviewGuard } from "./ActiveReviewGuardImpl.js";
import { ActiveReviewWarningPresenter } from "./ActiveReviewWarningPresenterImpl.js";

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
