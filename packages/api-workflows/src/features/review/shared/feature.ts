import { createFeature } from "@webiny/feature/api";
import { ReviewModelProvider } from "./ReviewModelProvider.js";
import { ReviewRepository } from "./ReviewRepository.js";

export const ReviewSharedFeature = createFeature({
    name: "Workflows/ReviewShared",
    register(container) {
        container.register(ReviewModelProvider);
        container.register(ReviewRepository).inSingletonScope();
    }
});
