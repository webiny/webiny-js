import { describe, expect, it } from "vitest";
import type { Abstraction } from "@webiny/di";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ReviewApprovedEventHandler,
    ReviewCancelledEventHandler,
    ReviewRequestedEventHandler,
    ReviewStepApprovedEventHandler,
    ReviewStepFailedEventHandler,
    ReviewStepReachedEventHandler,
    ReviewStepReassignedEventHandler,
    ReviewStepRejectedEventHandler,
    ReviewStepRestartedEventHandler,
    ReviewStepStartedEventHandler,
    ReviewStepTakenOverEventHandler
} from "~/features/review/events.js";
import { NotificationRecipientService } from "~/features/notifications/NotificationRecipientService/index.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewTargetLink } from "~/features/notifications/ReviewTargetLink/index.js";
import { ReviewTargetLinkService } from "~/features/notifications/ReviewTargetLinkService/index.js";
import { ReviewWebsocketSender } from "~/features/notifications/ReviewWebsocketSender/index.js";
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/index.js";

const NOTIFYING: Abstraction<any>[] = [
    ReviewStepReachedEventHandler,
    ReviewStepReassignedEventHandler,
    ReviewStepTakenOverEventHandler,
    ReviewStepRejectedEventHandler,
    ReviewStepFailedEventHandler,
    ReviewApprovedEventHandler,
    ReviewCancelledEventHandler
];

const SILENT: Abstraction<any>[] = [
    ReviewRequestedEventHandler,
    ReviewStepStartedEventHandler,
    ReviewStepApprovedEventHandler,
    ReviewStepRestartedEventHandler
];

describe("ReviewNotificationsFeature registration (R182, R199)", () => {
    it("registers the notifier, the recipient, admin URL and link services once", async () => {
        const { context } = await createContextHandler();
        const { container } = context;

        expect(container.resolveAll(ReviewNotifierService)).toHaveLength(1);
        expect(container.resolveAll(ReviewWebsocketSender)).toHaveLength(1);
        expect(container.resolveAll(NotificationRecipientService)).toHaveLength(1);
        expect(container.resolveAll(WorkflowsAdminUrlService)).toHaveLength(1);
        expect(container.resolveAll(ReviewTargetLinkService)).toHaveLength(1);
        // The CMS and Website Builder adapters register the ports in their own packages.
        expect(container.resolveAll(ReviewTargetLink)).toHaveLength(0);
    });

    it("registers one handler for each notifying event, and resolves its dependencies", async () => {
        const { context } = await createContextHandler();

        for (const abstraction of NOTIFYING) {
            expect(context.container.resolveAll(abstraction)).toHaveLength(1);
        }
    });

    it("registers no handler for requested, started, intermediate approvals or restarts (R181)", async () => {
        const { context } = await createContextHandler();

        for (const abstraction of SILENT) {
            expect(context.container.resolveAll(abstraction)).toHaveLength(0);
        }
    });

    it("registers nothing without the advancedPublishingWorkflow license", async () => {
        const license = createTestWcpLicense();
        license.package.features[PROJECT_PACKAGE_FEATURE_NAME.APW] = { enabled: false };
        const { context } = await createContextHandler({ testProjectLicense: license });

        expect(context.container.resolveAll(ReviewNotifierService)).toHaveLength(0);
        expect(context.container.resolveAll(ReviewWebsocketSender)).toHaveLength(0);
        for (const abstraction of NOTIFYING) {
            expect(context.container.resolveAll(abstraction)).toHaveLength(0);
        }
    });
});
