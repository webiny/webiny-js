import { createFeature } from "@webiny/feature/api";
import { ReviewTargetLinkService } from "./ReviewTargetLinkService.js";

export const ReviewTargetLinkServiceFeature = createFeature({
    name: "WorkflowNotifications/ReviewTargetLinkService",
    register(container) {
        container.register(ReviewTargetLinkService);
    }
});
