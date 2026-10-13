import { createFeature } from "@webiny/feature/api";
import { ListCmsEntryReviewsUseCase } from "./ListCmsEntryReviewsUseCase.js";

export const ListCmsEntryReviewsFeature = createFeature({
    name: "CmsWorkflows/ListCmsEntryReviews",
    register(container) {
        container.register(ListCmsEntryReviewsUseCase);
    }
});
