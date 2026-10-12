import { createFeature } from "@webiny/feature/api";
import { CancelCmsEntryReviewsForDeleteUseCase } from "./CancelCmsEntryReviewsForDeleteUseCase.js";

export const CancelCmsEntryReviewsForDeleteFeature = createFeature({
    name: "CmsWorkflows/CancelCmsEntryReviewsForDelete",
    register(container) {
        container.register(CancelCmsEntryReviewsForDeleteUseCase);
    }
});
