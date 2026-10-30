import { createFeature } from "@webiny/feature/api";
import { GetCmsEntryReviewStepRunUseCase } from "./GetCmsEntryReviewStepRunUseCase.js";

export const GetCmsEntryReviewStepRunFeature = createFeature({
    name: "CmsWorkflows/GetCmsEntryReviewStepRun",
    register(container) {
        container.register(GetCmsEntryReviewStepRunUseCase);
    }
});
