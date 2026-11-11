import { createFeature } from "@webiny/feature/api";
import { CancelCmsEntryReviewUseCase } from "./CancelCmsEntryReviewUseCase.js";

export const CancelCmsEntryReviewFeature = createFeature({
    name: "CmsWorkflows/CancelCmsEntryReview",
    register(container) {
        container.register(CancelCmsEntryReviewUseCase);
    }
});
