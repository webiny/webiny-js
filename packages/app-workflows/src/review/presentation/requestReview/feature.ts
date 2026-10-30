import { createFeature } from "@webiny/feature/admin";
import { RequestReviewPresenter as Abstraction } from "./abstractions.js";
import { RequestReviewPresenter } from "./RequestReviewPresenter.js";

export const RequestReviewPresenterFeature = createFeature({
    name: "Workflows/RequestReviewPresenter",
    register(container) {
        // Transient (R212): one instance, and its pickers, per mounted dialog.
        container.register(RequestReviewPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
