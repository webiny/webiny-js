import { createFeature } from "@webiny/feature/api";
import { RestartReviewStepUseCase } from "./RestartReviewStepUseCase.js";

export const RestartReviewStepFeature = createFeature({
    name: "Workflows/RestartReviewStep",
    register(container) {
        container.register(RestartReviewStepUseCase);
    }
});
