import { createFeature } from "@webiny/feature/api";
import { GetCmsEntryReviewUseCase } from "./GetCmsEntryReviewUseCase.js";

export const GetCmsEntryReviewFeature = createFeature({
    name: "CmsWorkflows/GetCmsEntryReview",
    register(container) {
        container.register(GetCmsEntryReviewUseCase);
    }
});
