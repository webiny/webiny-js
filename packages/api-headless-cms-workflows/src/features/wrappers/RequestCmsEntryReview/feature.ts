import { createFeature } from "@webiny/feature/api";
import { RequestCmsEntryReviewUseCase } from "./RequestCmsEntryReviewUseCase.js";

export const RequestCmsEntryReviewFeature = createFeature({
    name: "CmsWorkflows/RequestCmsEntryReview",
    register(container) {
        container.register(RequestCmsEntryReviewUseCase);
    }
});
