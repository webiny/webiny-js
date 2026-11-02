import { createFeature } from "@webiny/feature/api";
import { StartCmsEntryReviewStepUseCase } from "./StartCmsEntryReviewStepUseCase.js";

export const StartCmsEntryReviewStepFeature = createFeature({
    name: "CmsWorkflows/StartCmsEntryReviewStep",
    register(container) {
        container.register(StartCmsEntryReviewStepUseCase);
    }
});
