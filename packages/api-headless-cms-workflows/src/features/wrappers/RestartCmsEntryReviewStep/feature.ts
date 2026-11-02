import { createFeature } from "@webiny/feature/api";
import { RestartCmsEntryReviewStepUseCase } from "./RestartCmsEntryReviewStepUseCase.js";

export const RestartCmsEntryReviewStepFeature = createFeature({
    name: "CmsWorkflows/RestartCmsEntryReviewStep",
    register(container) {
        container.register(RestartCmsEntryReviewStepUseCase);
    }
});
