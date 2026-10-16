import { createFeature } from "@webiny/feature/admin";
import { ReviewWidgetPresenter as Abstraction } from "./abstractions.js";
import { ReviewWidgetPresenter } from "./ReviewWidgetPresenter.js";

// Transient (R212, D71): each widget instance resolves its own presenter.
export const ReviewWidgetPresenterFeature = createFeature({
    name: "Workflows/ReviewWidgetPresenter",
    register(container) {
        container.register(ReviewWidgetPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
