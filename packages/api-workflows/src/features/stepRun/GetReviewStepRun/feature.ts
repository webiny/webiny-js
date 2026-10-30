import { createFeature } from "@webiny/feature/api";
import { GetReviewStepRunUseCase } from "./GetReviewStepRunUseCase.js";

export const GetReviewStepRunFeature = createFeature({
    name: "Workflows/GetReviewStepRun",
    register(container) {
        container.register(GetReviewStepRunUseCase);
    }
});
