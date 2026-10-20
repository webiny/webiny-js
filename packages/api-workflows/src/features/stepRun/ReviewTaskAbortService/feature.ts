import { createFeature } from "@webiny/feature/api";
import { ReviewTaskAbortService } from "./ReviewTaskAbortService.js";

export const ReviewTaskAbortServiceFeature = createFeature({
    name: "Workflows/ReviewTaskAbortService",
    register(container) {
        container.register(ReviewTaskAbortService);
    }
});
