import { createFeature } from "@webiny/feature/admin";
import { TargetReviewPresenter as Abstraction } from "./abstractions.js";
import { TargetReviewPresenter } from "./TargetReviewPresenter.js";

export const TargetReviewPresenterFeature = createFeature({
    name: "Workflows/TargetReviewPresenter",
    register(container) {
        // Transient (R212): every `useFeature` resolve is a new instance, one per view.
        container.register(TargetReviewPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
