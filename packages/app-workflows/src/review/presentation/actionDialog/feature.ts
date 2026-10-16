import { createFeature } from "@webiny/feature/admin";
import { ReviewActionDialogPresenter as Abstraction } from "./abstractions.js";
import { ReviewActionDialogPresenter } from "./ReviewActionDialogPresenter.js";

export const ReviewActionDialogPresenterFeature = createFeature({
    name: "Workflows/ReviewActionDialogPresenter",
    register(container) {
        // Transient (R212): one instance per mounted dialog.
        container.register(ReviewActionDialogPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
