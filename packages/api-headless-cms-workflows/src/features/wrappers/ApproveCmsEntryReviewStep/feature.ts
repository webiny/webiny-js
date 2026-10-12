import { createFeature } from "@webiny/feature/api";
import { ApproveCmsEntryReviewStepUseCase } from "./ApproveCmsEntryReviewStepUseCase.js";

export const ApproveCmsEntryReviewStepFeature = createFeature({
    name: "CmsWorkflows/ApproveCmsEntryReviewStep",
    register(container) {
        container.register(ApproveCmsEntryReviewStepUseCase);
    }
});
