import { createFeature } from "@webiny/feature/api";
import { ReassignReviewStepUseCase } from "./ReassignReviewStepUseCase.js";

export const ReassignReviewStepFeature = createFeature({
    name: "Workflows/ReassignReviewStep",
    register(container) {
        container.register(ReassignReviewStepUseCase);
    }
});
