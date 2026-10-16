import { createFeature } from "@webiny/feature/api";
import { ResolveReviewUserNameUseCase } from "./ResolveReviewUserNameUseCase.js";

export const ResolveReviewUserNameFeature = createFeature({
    name: "Workflows/ResolveReviewUserName",
    register(container) {
        container.register(ResolveReviewUserNameUseCase);
    }
});
