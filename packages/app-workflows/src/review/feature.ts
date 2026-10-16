import { createFeature } from "@webiny/feature/admin";
import { ReviewActivity as ReviewActivityAbstraction } from "./activity/abstractions.js";
import { ReviewActivity } from "./activity/ReviewActivity.js";
import { ReviewToasts as ReviewToastsAbstraction } from "./toasts/abstractions.js";
import { ReviewToasts } from "./toasts/ReviewToasts.js";
import { ReviewNotificationService as ReviewNotificationServiceAbstraction } from "./notifications/abstractions.js";
import { ReviewNotificationService } from "./notifications/ReviewNotificationService.js";

/*
 * The app-neutral review services, registered once by `WorkflowsAdminApp` inside the feature flag
 * gate (R211). All three are singletons (R212).
 */
export const ReviewServicesFeature = createFeature({
    name: "Workflows/ReviewServices",
    register(container) {
        container.register(ReviewActivity).inSingletonScope();
        container.register(ReviewToasts).inSingletonScope();
        container.register(ReviewNotificationService).inSingletonScope();
    },
    resolve(container) {
        return {
            activity: container.resolve(ReviewActivityAbstraction),
            toasts: container.resolve(ReviewToastsAbstraction),
            notifications: container.resolve(ReviewNotificationServiceAbstraction)
        };
    }
});
