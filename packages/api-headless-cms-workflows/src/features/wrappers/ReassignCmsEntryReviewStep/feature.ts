import { createFeature } from "@webiny/feature/api";
import { ReassignCmsEntryReviewStepUseCase } from "./ReassignCmsEntryReviewStepUseCase.js";

export const ReassignCmsEntryReviewStepFeature = createFeature({
    name: "CmsWorkflows/ReassignCmsEntryReviewStep",
    register(container) {
        container.register(ReassignCmsEntryReviewStepUseCase);
    }
});
