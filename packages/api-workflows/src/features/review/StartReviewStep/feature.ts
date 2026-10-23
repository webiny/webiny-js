import { createFeature } from "@webiny/feature/api";
import { StartReviewStepUseCase } from "./StartReviewStepUseCase.js";

export const StartReviewStepFeature = createFeature({
    name: "Workflows/StartReviewStep",
    register(container) {
        container.register(StartReviewStepUseCase);
    }
});
