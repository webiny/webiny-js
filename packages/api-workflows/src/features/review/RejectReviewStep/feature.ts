import { createFeature } from "@webiny/feature/api";
import { RejectReviewStepUseCase } from "./RejectReviewStepUseCase.js";

export const RejectReviewStepFeature = createFeature({
    name: "Workflows/RejectReviewStep",
    register(container) {
        container.register(RejectReviewStepUseCase);
    }
});
