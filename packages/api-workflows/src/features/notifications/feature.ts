import { createFeature } from "@webiny/feature/api";
import { NotificationRecipientServiceFeature } from "./NotificationRecipientService/feature.js";
import { WorkflowsAdminUrlServiceFeature } from "./WorkflowsAdminUrlService/feature.js";
import { ReviewTargetLinkServiceFeature } from "./ReviewTargetLinkService/feature.js";
import { ReviewNotifierServiceFeature } from "./ReviewNotifierService/feature.js";
import { ReviewWebsocketSenderFeature } from "./ReviewWebsocketSender/feature.js";
import { ReviewChangeNotifierServiceFeature } from "./ReviewChangeNotifierService/feature.js";
import { ReviewStepReachedNotifications } from "./handlers/ReviewStepReachedNotifications.js";
import { ReviewStepReassignedNotifications } from "./handlers/ReviewStepReassignedNotifications.js";
import { ReviewStepTakenOverNotifications } from "./handlers/ReviewStepTakenOverNotifications.js";
import { ReviewStepRejectedNotifications } from "./handlers/ReviewStepRejectedNotifications.js";
import { ReviewStepFailedNotifications } from "./handlers/ReviewStepFailedNotifications.js";
import { ReviewApprovedNotifications } from "./handlers/ReviewApprovedNotifications.js";
import { ReviewCancelledNotifications } from "./handlers/ReviewCancelledNotifications.js";
import { ReviewRequestedChangeNotifications } from "./handlers/ReviewRequestedChangeNotifications.js";
import { ReviewStepStartedChangeNotifications } from "./handlers/ReviewStepStartedChangeNotifications.js";
import { ReviewStepApprovedChangeNotifications } from "./handlers/ReviewStepApprovedChangeNotifications.js";
import { ReviewStepRestartedChangeNotifications } from "./handlers/ReviewStepRestartedChangeNotifications.js";

/**
 * The review notifications (R182, R199): the notifier and the services it uses, and one handler
 * per notifying event. `requested`, `stepStarted`, `stepApproved` and `stepRestarted` have no
 * notification handler (R181). Since 8b those four events each have one more
 * handler, which sends the silent `workflows.reviewChanged` message to the requester and the
 * current owner (R253, R254). The CMS and Website Builder `ReviewTargetLink` adapters register
 * in their own packages. Registered by `WorkflowsFeature`, inside its
 * `advancedPublishingWorkflow` gate.
 */
export const ReviewNotificationsFeature = createFeature({
    name: "WorkflowNotifications/ReviewNotifications",
    register(container) {
        NotificationRecipientServiceFeature.register(container);
        WorkflowsAdminUrlServiceFeature.register(container);
        ReviewTargetLinkServiceFeature.register(container);
        ReviewWebsocketSenderFeature.register(container);
        ReviewNotifierServiceFeature.register(container);

        container.register(ReviewStepReachedNotifications);
        container.register(ReviewStepReassignedNotifications);
        container.register(ReviewStepTakenOverNotifications);
        container.register(ReviewStepRejectedNotifications);
        container.register(ReviewStepFailedNotifications);
        container.register(ReviewApprovedNotifications);
        container.register(ReviewCancelledNotifications);

        ReviewChangeNotifierServiceFeature.register(container);
        container.register(ReviewRequestedChangeNotifications);
        container.register(ReviewStepStartedChangeNotifications);
        container.register(ReviewStepApprovedChangeNotifications);
        container.register(ReviewStepRestartedChangeNotifications);
    }
});
