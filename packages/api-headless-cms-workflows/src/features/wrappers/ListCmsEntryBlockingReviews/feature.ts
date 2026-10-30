import { createFeature } from "@webiny/feature/api";
import { ListCmsEntryBlockingReviewsUseCase } from "./ListCmsEntryBlockingReviewsUseCase.js";

export const ListCmsEntryBlockingReviewsFeature = createFeature({
    name: "CmsWorkflows/ListCmsEntryBlockingReviews",
    register(container) {
        container.register(ListCmsEntryBlockingReviewsUseCase);
    }
});
