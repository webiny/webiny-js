import { createFeature } from "@webiny/feature/api";
import { TakeOverReviewStepUseCase } from "./TakeOverReviewStepUseCase.js";

export const TakeOverReviewStepFeature = createFeature({
    name: "Workflows/TakeOverReviewStep",
    register(container) {
        container.register(TakeOverReviewStepUseCase);
    }
});
