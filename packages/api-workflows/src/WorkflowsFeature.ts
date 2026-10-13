import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowModel } from "~/domain/workflow/workflow.model.js";
import { ReviewModel } from "~/domain/review/review.model.js";
import { AssignmentModel } from "~/domain/assignment/assignment.model.js";
import { WorkflowSettingsModel } from "~/domain/settings/settings.model.js";
import { ListNotificationTypesFeature } from "~/features/notifications/ListNotificationTypes/index.js";
import { NotificationTransportFeature } from "~/features/notifications/NotificationTransport/index.js";
import { WorkflowSharedFeature } from "~/features/workflow/shared/feature.js";
import { GetWorkflowFeature } from "~/features/workflow/GetWorkflow/feature.js";
import { ListWorkflowsFeature } from "~/features/workflow/ListWorkflows/feature.js";
import { StoreWorkflowFeature } from "~/features/workflow/StoreWorkflow/feature.js";
import { DeleteWorkflowFeature } from "~/features/workflow/DeleteWorkflow/feature.js";
import { ReviewSharedFeature } from "~/features/review/shared/feature.js";
import { ReviewLifecycleFeature } from "~/features/review/ReviewLifecycleFeature.js";
import { RequestReviewFeature } from "~/features/review/RequestReview/feature.js";
import { GetReviewFeature } from "~/features/review/GetReview/feature.js";
import { StartReviewStepFeature } from "~/features/review/StartReviewStep/feature.js";
import { TakeOverReviewStepFeature } from "~/features/review/TakeOverReviewStep/feature.js";
import { ApproveReviewStepFeature } from "~/features/review/ApproveReviewStep/feature.js";
import { RejectReviewStepFeature } from "~/features/review/RejectReviewStep/feature.js";
import { CancelReviewFeature } from "~/features/review/CancelReview/feature.js";
import { GetTargetReviewFeature } from "~/features/review/GetTargetReview/feature.js";
import { ListTargetReviewsFeature } from "~/features/review/ListTargetReviews/feature.js";
import { ListReviewsFeature } from "~/features/review/ListReviews/feature.js";
import { CancelTargetReviewsFeature } from "~/features/review/CancelTargetReviews/feature.js";
import { DeleteTargetReviewsFeature } from "~/features/review/DeleteTargetReviews/feature.js";
import { GetBoundWorkflowFeature } from "~/features/workflow/GetBoundWorkflow/feature.js";
import { ReadableBlockingReviewsFeature } from "~/features/workflow/ReadableBlockingReviews/feature.js";
import { AssignmentSharedFeature } from "~/features/assignment/shared/feature.js";
import { WorkflowSettingsSharedFeature } from "~/features/settings/shared/feature.js";
import { GetWorkflowSettingsFeature } from "~/features/settings/GetWorkflowSettings/feature.js";
import { SaveWorkflowSettingsFeature } from "~/features/settings/SaveWorkflowSettings/feature.js";
import { CurrentUserTeamsFeature } from "~/features/identity/CurrentUserTeams/feature.js";
import { CurrentReviewViewerFeature } from "~/features/identity/CurrentReviewViewer/feature.js";
import { CandidateReadAccessFeature } from "~/features/identity/CandidateReadAccess/feature.js";
import { WorkflowsPermissionsFeature } from "~/features/permissions/WorkflowsPermissions/feature.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated. Check the effective flag at register time
        // (the license is refreshed pre-register) so nothing is wired up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Private CMS models, registered early so HeadlessCmsInitializerImpl picks them up when
        // it builds the model list during the enhance phase.
        container.register(WorkflowModel);
        container.register(ReviewModel);
        container.register(AssignmentModel);
        container.register(WorkflowSettingsModel);

        // Notifications (internal, no permission check, D133; recipient rules arrive in phase 7)
        ListNotificationTypesFeature.register(container);
        NotificationTransportFeature.register(container);

        // Workflows
        WorkflowSharedFeature.register(container);
        GetWorkflowFeature.register(container);
        ListWorkflowsFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);

        // Reviews
        ReviewSharedFeature.register(container);
        ReviewLifecycleFeature.register(container);
        RequestReviewFeature.register(container);
        GetReviewFeature.register(container);
        StartReviewStepFeature.register(container);
        TakeOverReviewStepFeature.register(container);
        ApproveReviewStepFeature.register(container);
        RejectReviewStepFeature.register(container);
        CancelReviewFeature.register(container);

        // Target queries for the app target adapters and wrappers
        GetTargetReviewFeature.register(container);
        ListTargetReviewsFeature.register(container);
        // Review lists for the app wrappers (spec 11)
        ListReviewsFeature.register(container);
        DeleteTargetReviewsFeature.register(container);
        CancelTargetReviewsFeature.register(container);
        GetBoundWorkflowFeature.register(container);
        ReadableBlockingReviewsFeature.register(container);

        // Assignment log (written from phase 4)
        AssignmentSharedFeature.register(container);

        // Settings
        WorkflowSettingsSharedFeature.register(container);
        GetWorkflowSettingsFeature.register(container);
        SaveWorkflowSettingsFeature.register(container);

        // Building blocks for the app wrappers (D132)
        WorkflowsPermissionsFeature.register(container);
        CurrentUserTeamsFeature.register(container);
        CurrentReviewViewerFeature.register(container);
        CandidateReadAccessFeature.register(container);
    }
});
