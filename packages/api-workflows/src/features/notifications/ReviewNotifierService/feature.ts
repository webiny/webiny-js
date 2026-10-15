import { createFeature } from "@webiny/feature/api";
import { ReviewNotifierService } from "./ReviewNotifierService.js";

export const ReviewNotifierServiceFeature = createFeature({
    name: "WorkflowNotifications/ReviewNotifierService",
    register(container) {
        container.register(ReviewNotifierService);
    }
});
