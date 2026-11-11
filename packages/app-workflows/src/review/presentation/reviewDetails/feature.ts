import { createFeature } from "@webiny/feature/admin";
import { ReviewDetailsPresenter as Abstraction } from "./abstractions.js";
import { ReviewDetailsPresenter } from "./ReviewDetailsPresenter.js";

export const ReviewDetailsPresenterFeature = createFeature({
    name: "Workflows/ReviewDetailsPresenter",
    register(container) {
        // Transient (R212): the editor drawer and the list drawer are independent instances.
        container.register(ReviewDetailsPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
