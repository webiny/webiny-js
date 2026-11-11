import { createFeature } from "@webiny/feature/admin";
import { CmsContentReviewsPresenter as Abstraction } from "./abstractions.js";
import { CmsContentReviewsPresenter } from "./CmsContentReviewsPresenter.js";

export const CmsContentReviewsPresenterFeature = createFeature({
    name: "Cms/Workflows/ContentReviewsPresenter",
    register(container) {
        // Transient (R212): `useFeature` memoizes the one instance the root component holds.
        container.register(CmsContentReviewsPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
