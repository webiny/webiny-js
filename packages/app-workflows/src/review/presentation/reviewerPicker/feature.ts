import { createFeature } from "@webiny/feature/admin";
import { ReviewerPickerPresenter as Abstraction } from "./abstractions.js";
import { ReviewerPickerFactory } from "./ReviewerPickerFactory.js";
import { ReviewerPickerPresenter } from "./ReviewerPickerPresenter.js";

export const ReviewerPickerPresenterFeature = createFeature({
    name: "Workflows/ReviewerPickerPresenter",
    register(container) {
        // Transient (R212): each picker instance has its own candidates and search.
        container.register(ReviewerPickerPresenter);
        // The factory hands out transient instances; the closure is the DI wiring, no class
        // holds the container.
        container.registerFactory(ReviewerPickerFactory, () => {
            return { create: () => container.resolve(Abstraction) };
        });
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
