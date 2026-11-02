import { createFeature } from "@webiny/feature/admin";
import { ReviewListPresenter as Abstraction } from "./abstractions.js";
import { ReviewListPresenter } from "./ReviewListPresenter.js";

// Transient (R212, D71): every `useFeature` resolve is a new presenter, so views never share state.
export const ReviewListPresenterFeature = createFeature({
    name: "Workflows/ReviewListPresenter",
    register(container) {
        container.register(ReviewListPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
