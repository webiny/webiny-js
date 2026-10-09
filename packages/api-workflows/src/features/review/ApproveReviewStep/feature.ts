import { createFeature } from "@webiny/feature/api";
import { ApproveReviewStepUseCase } from "./ApproveReviewStepUseCase.js";

export const ApproveReviewStepFeature = createFeature({
    name: "Workflows/ApproveReviewStep",
    register(container) {
        container.register(ApproveReviewStepUseCase);
    }
});
