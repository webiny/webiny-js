import { createFeature } from "@webiny/feature/api";
import { RejectCmsEntryReviewStepUseCase } from "./RejectCmsEntryReviewStepUseCase.js";

export const RejectCmsEntryReviewStepFeature = createFeature({
    name: "CmsWorkflows/RejectCmsEntryReviewStep",
    register(container) {
        container.register(RejectCmsEntryReviewStepUseCase);
    }
});
