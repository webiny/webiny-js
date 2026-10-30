import { createFeature } from "@webiny/feature/admin";
import { ReviewActivity as ReviewActivityAbstraction } from "./activity/abstractions.js";
import { ReviewActivity } from "./activity/ReviewActivity.js";
import { ReviewToasts as ReviewToastsAbstraction } from "./toasts/abstractions.js";
import { ReviewToasts } from "./toasts/ReviewToasts.js";
import { ReviewNotificationService as ReviewNotificationServiceAbstraction } from "./notifications/abstractions.js";
import { ReviewNotificationService } from "./notifications/ReviewNotificationService.js";
import { ReviewRepositoryFeature } from "./repository/feature.js";
import { GetBoundWorkflowFeature } from "./useCases/getBoundWorkflow/feature.js";
import { GetReviewFeature } from "./useCases/getReview/feature.js";
import { GetStepRunFeature } from "./useCases/getStepRun/feature.js";
import { GetTargetReviewFeature } from "./useCases/getTargetReview/feature.js";
import { ListReviewStepCandidatesFeature } from "./useCases/listReviewStepCandidates/feature.js";
import { ListReviewsFeature } from "./useCases/listReviews/feature.js";
import { ListStepCandidatesFeature } from "./useCases/listStepCandidates/feature.js";
import { ApproveReviewStepFeature } from "./useCases/approveReviewStep/feature.js";
import { CancelReviewFeature } from "./useCases/cancelReview/feature.js";
import { CancelReviewsForDeleteFeature } from "./useCases/cancelReviewsForDelete/feature.js";
import { ListBlockingReviewsFeature } from "./useCases/listBlockingReviews/feature.js";
import { ReassignReviewStepFeature } from "./useCases/reassignReviewStep/feature.js";
import { RejectReviewStepFeature } from "./useCases/rejectReviewStep/feature.js";
import { RequestReviewFeature } from "./useCases/requestReview/feature.js";
import { RestartReviewStepFeature } from "./useCases/restartReviewStep/feature.js";
import { StartReviewStepFeature } from "./useCases/startReviewStep/feature.js";
import { TakeOverReviewStepFeature } from "./useCases/takeOverReviewStep/feature.js";

/*
 * The app-neutral review services, registered once by `WorkflowsAdminApp` inside the feature flag
 * gate (R211): activity, toasts and notifications (singletons, R212), and the review data layer,
 * the routing gateway and the repository (singletons) and one transient use case per operation
 * (R354).
 */
export const ReviewServicesFeature = createFeature({
    name: "Workflows/ReviewServices",
    register(container) {
        container.register(ReviewActivity).inSingletonScope();
        container.register(ReviewToasts).inSingletonScope();
        container.register(ReviewNotificationService).inSingletonScope();
        ReviewRepositoryFeature.register(container);
        GetBoundWorkflowFeature.register(container);
        GetTargetReviewFeature.register(container);
        GetReviewFeature.register(container);
        ListStepCandidatesFeature.register(container);
        ListReviewStepCandidatesFeature.register(container);
        GetStepRunFeature.register(container);
        ListReviewsFeature.register(container);
        RequestReviewFeature.register(container);
        StartReviewStepFeature.register(container);
        TakeOverReviewStepFeature.register(container);
        ReassignReviewStepFeature.register(container);
        ApproveReviewStepFeature.register(container);
        RejectReviewStepFeature.register(container);
        CancelReviewFeature.register(container);
        RestartReviewStepFeature.register(container);
        CancelReviewsForDeleteFeature.register(container);
        ListBlockingReviewsFeature.register(container);
    },
    resolve(container) {
        return {
            activity: container.resolve(ReviewActivityAbstraction),
            toasts: container.resolve(ReviewToastsAbstraction),
            notifications: container.resolve(ReviewNotificationServiceAbstraction)
        };
    }
});
