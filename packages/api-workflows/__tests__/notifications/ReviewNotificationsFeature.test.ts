import { describe, expect, it } from "vitest";
import type { Abstraction } from "@webiny/di";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ReviewApprovedEventHandler,
    ReviewStepApprovedEventHandler
} from "~/features/review/ApproveReviewStep/events.js";
import { ReviewCancelledEventHandler } from "~/features/review/CancelReview/events.js";
import { ReviewRequestedEventHandler } from "~/features/review/RequestReview/events.js";
import { ReviewStepFailedEventHandler } from "~/features/review/shared/events.js";
import { ReviewStepReachedEventHandler } from "~/features/review/ReviewStepReacher/events.js";
import { ReviewStepReassignedEventHandler } from "~/features/review/ReassignReviewStep/events.js";
import { ReviewStepRejectedEventHandler } from "~/features/review/RejectReviewStep/events.js";
import { ReviewStepRestartedEventHandler } from "~/features/review/RestartReviewStep/events.js";
import { ReviewStepStartedEventHandler } from "~/features/review/StartReviewStep/events.js";
import { ReviewStepTakenOverEventHandler } from "~/features/review/TakeOverReviewStep/events.js";
import { NotificationRecipientService } from "~/features/notifications/NotificationRecipientService/index.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/index.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewTargetLink } from "~/features/notifications/ReviewTargetLink/index.js";
import { ReviewTargetLinkService } from "~/features/notifications/ReviewTargetLinkService/index.js";
import { ReviewWebsocketSender } from "~/features/notifications/ReviewWebsocketSender/index.js";
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/index.js";
import { ReviewStepReachedNotifications } from "~/features/notifications/handlers/ReviewStepReachedNotifications.js";
import { ReviewStepReassignedNotifications } from "~/features/notifications/handlers/ReviewStepReassignedNotifications.js";
import { ReviewStepTakenOverNotifications } from "~/features/notifications/handlers/ReviewStepTakenOverNotifications.js";
import { ReviewStepRejectedNotifications } from "~/features/notifications/handlers/ReviewStepRejectedNotifications.js";
import { ReviewStepFailedNotifications } from "~/features/notifications/handlers/ReviewStepFailedNotifications.js";
import { ReviewApprovedNotifications } from "~/features/notifications/handlers/ReviewApprovedNotifications.js";
import { ReviewCancelledNotifications } from "~/features/notifications/handlers/ReviewCancelledNotifications.js";
import { ReviewRequestedChangeNotifications } from "~/features/notifications/handlers/ReviewRequestedChangeNotifications.js";
import { ReviewStepStartedChangeNotifications } from "~/features/notifications/handlers/ReviewStepStartedChangeNotifications.js";
import { ReviewStepApprovedChangeNotifications } from "~/features/notifications/handlers/ReviewStepApprovedChangeNotifications.js";
import { ReviewStepRestartedChangeNotifications } from "~/features/notifications/handlers/ReviewStepRestartedChangeNotifications.js";

/** An event abstraction and the one implementation the feature registers for it. */
interface HandlerRegistration {
    abstraction: Abstraction<any>;
    implementation: new (...args: never[]) => unknown;
}

/** One notification handler each (R181). */
const NOTIFYING: HandlerRegistration[] = [
    { abstraction: ReviewStepReachedEventHandler, implementation: ReviewStepReachedNotifications },
    {
        abstraction: ReviewStepReassignedEventHandler,
        implementation: ReviewStepReassignedNotifications
    },
    {
        abstraction: ReviewStepTakenOverEventHandler,
        implementation: ReviewStepTakenOverNotifications
    },
    {
        abstraction: ReviewStepRejectedEventHandler,
        implementation: ReviewStepRejectedNotifications
    },
    { abstraction: ReviewStepFailedEventHandler, implementation: ReviewStepFailedNotifications },
    { abstraction: ReviewApprovedEventHandler, implementation: ReviewApprovedNotifications },
    { abstraction: ReviewCancelledEventHandler, implementation: ReviewCancelledNotifications }
];

/** One change-message handler each and no notification handler (R181, R253). */
const CHANGE_ONLY: HandlerRegistration[] = [
    {
        abstraction: ReviewRequestedEventHandler,
        implementation: ReviewRequestedChangeNotifications
    },
    {
        abstraction: ReviewStepStartedEventHandler,
        implementation: ReviewStepStartedChangeNotifications
    },
    {
        abstraction: ReviewStepApprovedEventHandler,
        implementation: ReviewStepApprovedChangeNotifications
    },
    {
        abstraction: ReviewStepRestartedEventHandler,
        implementation: ReviewStepRestartedChangeNotifications
    }
];

describe("ReviewNotificationsFeature registration (R182, R199, R253)", () => {
    it("registers the notifier, the sender, the change notifier, the recipient, admin URL and link services once", async () => {
        const { context } = await createContextHandler();
        const { container } = context;

        expect(container.resolveAll(ReviewNotifierService)).toHaveLength(1);
        expect(container.resolveAll(ReviewWebsocketSender)).toHaveLength(1);
        expect(container.resolveAll(ReviewChangeNotifierService)).toHaveLength(1);
        expect(container.resolveAll(NotificationRecipientService)).toHaveLength(1);
        expect(container.resolveAll(WorkflowsAdminUrlService)).toHaveLength(1);
        expect(container.resolveAll(ReviewTargetLinkService)).toHaveLength(1);
        // The CMS and Website Builder adapters register the ports in their own packages.
        expect(container.resolveAll(ReviewTargetLink)).toHaveLength(0);
    });

    it("registers one handler for each notifying event, and resolves its dependencies", async () => {
        const { context } = await createContextHandler();

        for (const { abstraction, implementation } of NOTIFYING) {
            const handlers = context.container.resolveAll(abstraction);
            expect(handlers).toHaveLength(1);
            expect(handlers[0]).toBeInstanceOf(implementation);
        }
    });

    it("registers one change-message handler for requested, started, intermediate approvals and restarts, and no notification handler (R181, R253)", async () => {
        const { context } = await createContextHandler();

        for (const { abstraction, implementation } of CHANGE_ONLY) {
            const handlers = context.container.resolveAll(abstraction);
            expect(handlers).toHaveLength(1);
            expect(handlers[0]).toBeInstanceOf(implementation);
        }
    });

    it("registers nothing without the advancedPublishingWorkflow license", async () => {
        const license = createTestWcpLicense();
        license.package.features[PROJECT_PACKAGE_FEATURE_NAME.APW] = { enabled: false };
        const { context } = await createContextHandler({ testProjectLicense: license });

        expect(context.container.resolveAll(ReviewNotifierService)).toHaveLength(0);
        expect(context.container.resolveAll(ReviewWebsocketSender)).toHaveLength(0);
        expect(context.container.resolveAll(ReviewChangeNotifierService)).toHaveLength(0);
        for (const { abstraction } of [...NOTIFYING, ...CHANGE_ONLY]) {
            expect(context.container.resolveAll(abstraction)).toHaveLength(0);
        }
    });
});
