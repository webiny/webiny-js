import { createFeature } from "@webiny/feature/api";
import { GetCmsEntryTargetReviewUseCase } from "./GetCmsEntryTargetReviewUseCase.js";

export const GetCmsEntryTargetReviewFeature = createFeature({
    name: "CmsWorkflows/GetCmsEntryTargetReview",
    register(container) {
        container.register(GetCmsEntryTargetReviewUseCase);
    }
});
