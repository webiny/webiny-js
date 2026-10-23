import { createFeature } from "@webiny/feature/api";
import { TakeOverCmsEntryReviewStepUseCase } from "./TakeOverCmsEntryReviewStepUseCase.js";

export const TakeOverCmsEntryReviewStepFeature = createFeature({
    name: "CmsWorkflows/TakeOverCmsEntryReviewStep",
    register(container) {
        container.register(TakeOverCmsEntryReviewStepUseCase);
    }
});
