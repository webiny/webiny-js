import { createFeature } from "@webiny/feature/api";
import { ReviewChangeNotifierService } from "./ReviewChangeNotifierService.js";

export const ReviewChangeNotifierServiceFeature = createFeature({
    name: "WorkflowNotifications/ReviewChangeNotifierService",
    register(container) {
        container.register(ReviewChangeNotifierService);
    }
});
