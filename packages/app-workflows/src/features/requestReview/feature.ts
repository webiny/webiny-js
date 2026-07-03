import { createFeature } from "@webiny/feature/admin";
import { RequestReviewGateway } from "./RequestReviewGateway.js";
import { RequestReviewUseCase } from "./RequestReviewUseCase.js";

export const RequestReviewFeature = createFeature({
    name: "Workflows/RequestReview",
    register(container) {
        container.register(RequestReviewGateway).inSingletonScope();
        container.register(RequestReviewUseCase);
    }
});
