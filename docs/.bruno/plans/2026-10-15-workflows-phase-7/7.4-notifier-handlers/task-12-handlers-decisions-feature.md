### Task 12: Handlers for rejected, failed, approved and cancelled; `ReviewNotificationsFeature` and its registration

Spec 12; D44, D58, D100, D107, D126, D132, D134; R181, R182, R183, R184, R189, R189a, R196, R199; A66; Review Focus 1, 2, 4, 8. Four more thin handlers (same shape as Task 11), the `ReviewNotificationsFeature` that registers the notifier, the recipient, link and admin URL services and all seven handlers, and its registration by `WorkflowsFeature` inside the existing `advancedPublishingWorkflow` gate (it replaces the "recipient rules arrive in phase 7" comment). Registering the handlers changes every test that saves a review (the saver now resolves them when it publishes), so this task also gives the shared test context inert defaults for the mailer and both websocket use cases.

- **`ReviewStepRejectedNotifications`** (`ReviewStepRejectedEvent`): recipient the requester (`review.createdBy`), `dropActor(..., fact.actor)`, event `"rejected"`, step `fact.change.stepId` (not found: `Could not find the step for a workflow notification.` once, return), message `buildRejectedMessage({ contentTitle: review.title, stepTitle: step.title, decider: getActorName(fact.actor, step.title), comment: fact.comment ?? "" })`. `ReviewStepRejectedFact.comment` is `string | null` in the type and always set in practice (D100); the builder clamps it (R189a). The decider is the person's name, or the step title for an AI or automation actor (D107, D126). An AI or automation actor carries the requester's id (D58) and so never drops the requester (R184, Review Focus 2).
- **`ReviewStepFailedNotifications`** (`ReviewStepFailedEvent`): recipient the requester, **no `dropActor`** (R184: the actor of a failure can be the requester as a user, R140, and the requester must still hear about it), event `"failed"`, step `fact.change.stepId`, message `buildFailedMessage({ contentTitle, stepTitle, reason: fact.reason })`. `fact.reason` is the only text the message takes from the failure (a fixed text, R146, R170); the step's stored `comment` and everything else is ignored (Review Focus 4).
- **`ReviewApprovedNotifications`** (`ReviewApprovedEvent`): recipient the requester, `dropActor`, event `"approved"`, step `review.steps[review.steps.length - 1]` (the step that approved last; none: logged and returned), message `buildApprovedMessage({ contentTitle })`.
- **`ReviewCancelledNotifications`** (`ReviewCancelledEvent`): nobody when `fact.stepId` is `null` or `fact.stepState !== "inReview"`; otherwise the step is `review.steps.find(step => step.id === fact.stepId)` (not found: logged and returned), its `owner` is read from the step, not from `review.currentOwnerId` (a cancel does not clear `step.owner`, verified in `Review.cancel`), nobody when the owner is not a user (AI and automation owners, R183); recipient the owner, `dropActor(..., fact.actor)` (the owner who cancels their own review is not told), event `"cancelled"`, step `fact.stepId`, message `buildCancelledMessage({ contentTitle, stepTitle, canceller: getActorName(fact.actor, step.title), reason: fact.reason })` (the trashed and deleted reasons have their own text, any other reason reads as a normal cancel and is never printed, R189).

Same try/catch and log text as Task 11 (`"A workflow notification handler failed."`); the four handlers depend on `[ReviewNotifierService, Logger]` only (none of them looks anyone up).

`ReviewNotificationsFeature` (`features/notifications/feature.ts`) registers `NotificationRecipientServiceFeature`, `WorkflowsAdminUrlServiceFeature`, `ReviewTargetLinkServiceFeature`, `ReviewNotifierServiceFeature` and the seven handler implementations. `WorkflowsFeature` calls it right after the existing notification registrations. It subscribes to no other event: `requested`, `stepStarted`, `stepApproved` and `stepRestarted` have no handler (R181, R182). The CMS and Website Builder `ReviewTargetLink` adapters (Task 9) register in their own packages.

**The test contexts.** `WorkflowsFeature` now registers handlers that depend on `MailerService`, `WebsocketsListConnectionsUseCase` and `WebsocketsSendToConnectionsUseCase`. None of the three test contexts provides them: `createContextHandler` of `api-workflows`, `createContextHandler` of `api-headless-cms-workflows` (`__tests__/__handler/context.ts`) and `createContextHandler` of `api-website-builder-workflows` (`__tests__/__helpers/handler.ts`) all call `WorkflowsFeature.register` directly, not `registerApiRequestStack`. Each therefore registers inert instances right after `WorkflowsFeature.register(container)` (before the caller's `params.setup` where there is one), so no test sends anything (Global Constraints) and a test's own `registerInstance` for the same abstraction wins (last instance wins). `api-workflows` reuses Task 10's `RecordingMailer`, `FakeWebsocketConnections` and `RecordingWebsocketsSend`; the two other packages cannot import another package's `~tests` helpers, so each gets three small local stub classes (`InertMailer`, `InertWebsocketConnections`, `InertWebsocketsSend`, one class per file). The existing `registration.test.ts` of `api-workflows` keeps its own `MailerService` stub (it is overridden by the default, harmlessly).

**Files:**
- Create: `packages/api-workflows/src/features/notifications/handlers/ReviewStepRejectedNotifications.ts`
- Create: `packages/api-workflows/src/features/notifications/handlers/ReviewStepFailedNotifications.ts`
- Create: `packages/api-workflows/src/features/notifications/handlers/ReviewApprovedNotifications.ts`
- Create: `packages/api-workflows/src/features/notifications/handlers/ReviewCancelledNotifications.ts`
- Create: `packages/api-workflows/src/features/notifications/feature.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts` (import and call `ReviewNotificationsFeature`, replace the comment)
- Modify: `packages/api-workflows/__tests__/__helpers/handler.ts` (inert mailer and websocket defaults)
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/InertMailer.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/InertWebsocketConnections.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/InertWebsocketsSend.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__handler/context.ts` (register the three stubs)
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/InertMailer.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/InertWebsocketConnections.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/InertWebsocketsSend.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/handler.ts` (register the three stubs)
- Modify: `packages/api-headless-cms-workflows/package.json` and `packages/api-website-builder-workflows/package.json` (devDependencies `@webiny/api-mailer` and `@webiny/api-websockets`, only if `yarn adio` asks for them; the stubs import both)
- Create: `packages/api-workflows/__tests__/notifications/ReviewStepRejectedNotifications.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewStepFailedNotifications.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewApprovedNotifications.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewCancelledNotifications.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewNotificationsFeature.test.ts`

**Interfaces:**
- Consumes:
  - Task 11: `RecordingReviewNotifier` (`~tests/__helpers/RecordingReviewNotifier.js`), `createNotificationReview`, `EDITORIAL_CHANNEL`, `LEGAL_CHANNEL` (`~tests/__helpers/notificationReviews.js`), the three Task 11 handlers (`~/features/notifications/handlers/ReviewStepReachedNotifications.js`, `ReviewStepReassignedNotifications.js`, `ReviewStepTakenOverNotifications.js`).
  - Task 10: `ReviewNotifierService`, `ReviewNotifierServiceFeature` (`~/features/notifications/ReviewNotifierService/index.js`), `getErrorLogFields`, and the helpers `RecordingMailer`, `FakeWebsocketConnections`, `RecordingWebsocketsSend`.
  - Task 7: `NotificationRecipientService`, `NotificationRecipientServiceFeature`. Task 8: `WorkflowsAdminUrlService`, `WorkflowsAdminUrlServiceFeature`, `ReviewTargetLink`, `ReviewTargetLinkService`, `ReviewTargetLinkServiceFeature`.
  - Task 6: `getActorName`, `dropActor`, `buildRejectedMessage`, `buildFailedMessage`, `buildApprovedMessage`, `buildCancelledMessage`, `REVIEW_CANCEL_REASON_CONTENT_TRASHED`, `REVIEW_CANCEL_REASON_CONTENT_DELETED` (`~/domain/review/getDeleteCancelReason.js`).
  - Existing: `ReviewStepRejectedEventHandler`, `ReviewStepFailedEventHandler`, `ReviewApprovedEventHandler`, `ReviewCancelledEventHandler` and their events (`~/features/review/events.js`), the facts `ReviewStepRejectedFact`, `ReviewStepFailedFact`, `ReviewApprovedFact`, `ReviewCancelledFact` (`~/domain/review/facts.js`), `ReviewRequestedEventHandler`, `ReviewStepStartedEventHandler`, `ReviewStepApprovedEventHandler`, `ReviewStepRestartedEventHandler`, `Logger`, `MailerService` (`@webiny/api-mailer`), the websocket use cases (`@webiny/api-websockets/exports/api.js`), fixtures `requester`, `reviewer`, `otherReviewer`, `NOW`.
- Produces (matches the contract):
  - `ReviewStepRejectedNotifications`, `ReviewStepFailedNotifications`, `ReviewApprovedNotifications`, `ReviewCancelledNotifications` (dependencies `[ReviewNotifierService, Logger]`), and `ReviewNotificationsFeature` (`~/features/notifications/feature.js`, internal: only `WorkflowsFeature` calls it). All seven handlers are registered through `WorkflowsFeature` (consumed by Task 13).
  - `createContextHandler` registers inert `MailerService`, `WebsocketsListConnectionsUseCase` and `WebsocketsSendToConnectionsUseCase` instances before `params.setup`.
  - The `createContextHandler` of `api-headless-cms-workflows` and `api-website-builder-workflows` register the same three abstractions with local `InertMailer`, `InertWebsocketConnections` and `InertWebsocketsSend` instances, right after `WorkflowsFeature.register`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/notifications/ReviewStepRejectedNotifications.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewNotifier } from "~tests/__helpers/RecordingReviewNotifier.js";
import {
    createNotificationReview,
    EDITORIAL_CHANNEL,
    LEGAL_CHANNEL
} from "~tests/__helpers/notificationReviews.js";
import { NOW, requester, reviewer } from "~tests/__helpers/fixtures.js";
import type { ReviewStepRejectedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepRejectedEvent,
    type ReviewStepRejectedEventHandler
} from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewStepRejectedNotifications } from "~/features/notifications/handlers/ReviewStepRejectedNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";
const COMMENT = "The terms are unclear.";

const AI_ACTOR: Actor = { type: "ai", id: requester.id, displayName: "AI model name" };
const AUTOMATION_ACTOR: Actor = {
    type: "automation",
    id: requester.id,
    displayName: "Link checker"
};

const createFact = (overrides: Partial<ReviewStepRejectedFact> = {}): ReviewStepRejectedFact => {
    return {
        type: "stepRejected",
        occurredOn: NOW,
        actor: reviewer,
        change: { stepId: "legal", fromState: "inReview", toState: "rejected" },
        comment: COMMENT,
        ...overrides
    };
};

const setup = async () => {
    const notifier = new RecordingReviewNotifier();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(ReviewNotifierService, notifier);
        }
    });
    const handler = context.container.resolveImplementation(
        ReviewStepRejectedNotifications
    ) as ReviewStepRejectedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewStepRejectedFact): Promise<void> => {
            return handler.handle(new ReviewStepRejectedEvent({ review, fact }));
        }
    };
};

describe("ReviewStepRejectedNotifications (R181, R183, R184, R189, D107)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the requester who rejected the review and why, through the rejecting step's channels", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.event).toBe("rejected");
        expect(call.stepId).toBe("legal");
        expect(call.recipients).toEqual([{ id: "user-requester", displayName: "Rita Requester" }]);
        expect(call.message).toEqual({
            title: "“Article 1” was rejected at Legal review",
            body: "Rob Reviewer: “The terms are unclear.”. Create a new revision to fix it.",
            subject: "Rejected: Article 1 (Legal review)",
            text: "Rob Reviewer rejected this revision at Legal review: “The terms are unclear.”. This revision can’t be changed; create a new revision, fix it and request a new review.",
            linkLabel: "Open content"
        });
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: LEGAL_CHANNEL }
        ]);
    });

    it("uses the channels of the step that rejected (Review Focus 8)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({
                change: { stepId: "editorial", fromState: "inReview", toState: "rejected" }
            })
        );

        const [call] = notifier.calls;
        expect(call.stepId).toBe("editorial");
        expect(call.message.title).toBe("“Article 1” was rejected at Editorial review");
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: EDITORIAL_CHANNEL }
        ]);
    });

    it.each([
        { name: "an AI", actor: AI_ACTOR },
        { name: "an automation", actor: AUTOMATION_ACTOR }
    ])("names $name decider by the step title, never by its own name (D107, D126)", async ({ actor }) => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor }));

        const [call] = notifier.calls;
        expect(call.message.body).toBe(
            "Legal review: “The terms are unclear.”. Create a new revision to fix it."
        );
        expect(call.message.text).toContain("Legal review rejected this revision at Legal review");
        expect(JSON.stringify(call.message)).not.toContain("AI model name");
        expect(JSON.stringify(call.message)).not.toContain("Link checker");
    });

    it.each([
        { name: "an AI", actor: AI_ACTOR },
        { name: "an automation", actor: AUTOMATION_ACTOR }
    ])("still tells the requester when $name actor carries the requester's id (R184, D58, Review Focus 2)", async ({ actor }) => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor }));

        expect(notifier.calls).toHaveLength(1);
        expect(notifier.calls[0].recipients).toEqual([
            { id: "user-requester", displayName: "Rita Requester" }
        ]);
    });

    it("does not tell a user who rejects as the requester (R184)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: requester }));

        expect(notifier.calls).toEqual([]);
    });

    it("names a person with a blank display name `A user` (R189a)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ actor: { ...reviewer, displayName: "  " } })
        );

        expect(notifier.calls[0].message.body).toBe(
            "A user: “The terms are unclear.”. Create a new revision to fix it."
        );
    });

    it("passes an empty comment for a null comment (the type allows null, a reject always has one, D100)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ comment: null }));

        expect(notifier.calls[0].message.body).toBe(
            "Rob Reviewer: “”. Create a new revision to fix it."
        );
    });

    it("clamps a long comment to at most 300 characters (R189a)", async () => {
        const { handle, notifier } = await setup();
        const comment = "x".repeat(400);

        await handle(createNotificationReview(), createFact({ comment }));

        const body = notifier.calls[0].message.body;
        expect(body).toContain(`“${"x".repeat(299)}…”`);
        expect(body).not.toContain("x".repeat(300));
    });

    it("logs and returns when the step is not in the review", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ change: { stepId: "gone", fromState: "inReview", toState: "rejected" } })
        );

        expect(notifier.calls).toEqual([]);
        expect(loggedErrors).toEqual([
            {
                message: "Could not find the step for a workflow notification.",
                fields: { reviewId: "review-1", stepId: "gone" }
            }
        ]);
    });

    it("survives a notifier that throws (R87, Review Focus 1)", async () => {
        const { handle, notifier } = await setup();
        notifier.mode = "throw";

        await expect(handle(createNotificationReview(), createFact())).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([
            {
                message: HANDLER_FAILED,
                fields: { errorName: "Error", reviewId: "review-1", event: "stepRejected" }
            }
        ]);
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ReviewStepFailedNotifications.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewNotifier } from "~tests/__helpers/RecordingReviewNotifier.js";
import {
    createNotificationReview,
    EDITORIAL_CHANNEL,
    LEGAL_CHANNEL
} from "~tests/__helpers/notificationReviews.js";
import { NOW, requester } from "~tests/__helpers/fixtures.js";
import type { ReviewStepFailedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepFailedEvent,
    type ReviewStepFailedEventHandler
} from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewStepFailedNotifications } from "~/features/notifications/handlers/ReviewStepFailedNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";
const REASON = "The automation failed.";

const AUTOMATION_ACTOR: Actor = {
    type: "automation",
    id: requester.id,
    displayName: "Link checker"
};

const createFact = (overrides: Partial<ReviewStepFailedFact> = {}): ReviewStepFailedFact => {
    return {
        type: "stepFailed",
        occurredOn: NOW,
        actor: AUTOMATION_ACTOR,
        change: { stepId: "legal", fromState: "inReview", toState: "failed" },
        reason: REASON,
        ...overrides
    };
};

const setup = async () => {
    const notifier = new RecordingReviewNotifier();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(ReviewNotifierService, notifier);
        }
    });
    const handler = context.container.resolveImplementation(
        ReviewStepFailedNotifications
    ) as ReviewStepFailedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewStepFailedFact): Promise<void> => {
            return handler.handle(new ReviewStepFailedEvent({ review, fact }));
        }
    };
};

describe("ReviewStepFailedNotifications (R181, R183, R184, R189, R146)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the requester the step failed, through the failed step's channels", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.event).toBe("failed");
        expect(call.stepId).toBe("legal");
        expect(call.recipients).toEqual([{ id: "user-requester", displayName: "Rita Requester" }]);
        expect(call.message).toEqual({
            title: "Legal review failed on “Article 1”",
            body: "The automation failed. You can restart the step.",
            subject: "Step failed: Article 1 (Legal review)",
            text: "Legal review hit a technical error. The automation failed. The review is paused at this step until it is restarted.",
            linkLabel: "Open content"
        });
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: LEGAL_CHANNEL }
        ]);
    });

    it("uses the channels of the step that failed (Review Focus 8)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ change: { stepId: "editorial", fromState: "inReview", toState: "failed" } })
        );

        const [call] = notifier.calls;
        expect(call.stepId).toBe("editorial");
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: EDITORIAL_CHANNEL }
        ]);
    });

    it("tells the requester even when the actor is the requester as a user (R184, R140, Review Focus 2)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: requester }));

        expect(notifier.calls).toHaveLength(1);
        expect(notifier.calls[0].recipients).toEqual([
            { id: "user-requester", displayName: "Rita Requester" }
        ]);
    });

    it("uses only fact.reason: nothing else of the failure reaches the message (R146 mirror, Review Focus 4)", async () => {
        const { handle, notifier } = await setup();
        const review = createNotificationReview();
        review.steps[0].comment = "SECRET stack trace at /var/task/index.js:42";
        review.steps[0].runs = [
            {
                taskId: "task-0",
                startedOn: NOW,
                finishedOn: NOW,
                outcome: "failed",
                reason: "SECRET earlier failure"
            }
        ];

        await handle(review, createFact());

        expect(JSON.stringify(notifier.calls[0].message)).not.toContain("SECRET");
    });

    it("logs and returns when the step is not in the review", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ change: { stepId: "gone", fromState: "inReview", toState: "failed" } })
        );

        expect(notifier.calls).toEqual([]);
        expect(loggedErrors).toEqual([
            {
                message: "Could not find the step for a workflow notification.",
                fields: { reviewId: "review-1", stepId: "gone" }
            }
        ]);
    });

    it("survives a notifier that throws (R87, Review Focus 1)", async () => {
        const { handle, notifier } = await setup();
        notifier.mode = "throw";

        await expect(handle(createNotificationReview(), createFact())).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([
            {
                message: HANDLER_FAILED,
                fields: { errorName: "Error", reviewId: "review-1", event: "stepFailed" }
            }
        ]);
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ReviewApprovedNotifications.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewNotifier } from "~tests/__helpers/RecordingReviewNotifier.js";
import {
    createNotificationReview,
    EDITORIAL_CHANNEL
} from "~tests/__helpers/notificationReviews.js";
import { NOW, requester, reviewer } from "~tests/__helpers/fixtures.js";
import type { ReviewApprovedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import { ReviewApprovedEvent, type ReviewApprovedEventHandler } from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewApprovedNotifications } from "~/features/notifications/handlers/ReviewApprovedNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";

const AI_ACTOR: Actor = { type: "ai", id: requester.id, displayName: "AI check" };

const createFact = (overrides: Partial<ReviewApprovedFact> = {}): ReviewApprovedFact => {
    return { type: "approved", occurredOn: NOW, actor: reviewer, ...overrides };
};

const setup = async () => {
    const notifier = new RecordingReviewNotifier();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(ReviewNotifierService, notifier);
        }
    });
    const handler = context.container.resolveImplementation(
        ReviewApprovedNotifications
    ) as ReviewApprovedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewApprovedFact): Promise<void> => {
            return handler.handle(new ReviewApprovedEvent({ review, fact }));
        }
    };
};

describe("ReviewApprovedNotifications (R181, R183, R184, R189)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the requester the review is approved, through the channels of the last step", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.event).toBe("approved");
        expect(call.stepId).toBe("editorial");
        expect(call.recipients).toEqual([{ id: "user-requester", displayName: "Rita Requester" }]);
        expect(call.message).toEqual({
            title: "“Article 1” was approved",
            body: "All steps approved. It’s ready to publish.",
            subject: "Approved: Article 1",
            text: "Every step approved this revision. It’s ready to publish.",
            linkLabel: "Open content"
        });
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: EDITORIAL_CHANNEL }
        ]);
    });

    it("tells the requester when an AI or an automation approved (R184, D58)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: AI_ACTOR }));

        expect(notifier.calls).toHaveLength(1);
        expect(notifier.calls[0].recipients).toEqual([
            { id: "user-requester", displayName: "Rita Requester" }
        ]);
    });

    it("does not tell a user who approves as the requester (R184)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: requester }));

        expect(notifier.calls).toEqual([]);
    });

    it("logs and returns when the review has no step", async () => {
        const { handle, notifier } = await setup();
        const review = createNotificationReview();
        review.steps = [];

        await handle(review, createFact());

        expect(notifier.calls).toEqual([]);
        expect(loggedErrors).toEqual([
            {
                message: "Could not find the step for a workflow notification.",
                fields: { reviewId: "review-1", stepId: null }
            }
        ]);
    });

    it("survives a notifier that throws (R87, Review Focus 1)", async () => {
        const { handle, notifier } = await setup();
        notifier.mode = "throw";

        await expect(handle(createNotificationReview(), createFact())).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([
            {
                message: HANDLER_FAILED,
                fields: { errorName: "Error", reviewId: "review-1", event: "approved" }
            }
        ]);
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ReviewCancelledNotifications.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewNotifier } from "~tests/__helpers/RecordingReviewNotifier.js";
import {
    createNotificationReview,
    EDITORIAL_CHANNEL,
    LEGAL_CHANNEL
} from "~tests/__helpers/notificationReviews.js";
import { NOW, otherReviewer, requester, reviewer } from "~tests/__helpers/fixtures.js";
import type { ReviewCancelledFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    REVIEW_CANCEL_REASON_CONTENT_DELETED,
    REVIEW_CANCEL_REASON_CONTENT_TRASHED
} from "~/domain/review/getDeleteCancelReason.js";
import {
    ReviewCancelledEvent,
    type ReviewCancelledEventHandler
} from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewCancelledNotifications } from "~/features/notifications/handlers/ReviewCancelledNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";

const AI_OWNER: Actor = { type: "ai", id: requester.id, displayName: "AI check" };

const createFact = (overrides: Partial<ReviewCancelledFact> = {}): ReviewCancelledFact => {
    return {
        type: "cancelled",
        occurredOn: NOW,
        actor: requester,
        stepId: "legal",
        stepState: "inReview",
        reason: null,
        ...overrides
    };
};

const setup = async () => {
    const notifier = new RecordingReviewNotifier();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(ReviewNotifierService, notifier);
        }
    });
    const handler = context.container.resolveImplementation(
        ReviewCancelledNotifications
    ) as ReviewCancelledEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewCancelledFact): Promise<void> => {
            return handler.handle(new ReviewCancelledEvent({ review, fact }));
        }
    };
};

/** "Editorial review" is the current step, `inReview`, owned by Olga (the cancel keeps owners). */
const createReviewOnEditorial = (): ReviewData => {
    const review = createNotificationReview();
    review.steps[0].state = "approved";
    review.steps[1].state = "inReview";
    review.steps[1].owner = otherReviewer;
    review.currentStepId = "editorial";
    review.currentStepState = "inReview";
    return review;
};

describe("ReviewCancelledNotifications (R181, R183, R184, R189, D134)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the owner of the step the review was on, through that step's channels", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.event).toBe("cancelled");
        expect(call.stepId).toBe("legal");
        expect(call.recipients).toEqual([{ id: "user-reviewer", displayName: "Rob Reviewer" }]);
        expect(call.message).toEqual({
            title: "The review of “Article 1” was cancelled",
            body: "Cancelled by Rita Requester. You no longer need to review Legal review.",
            subject: "Review cancelled: Article 1",
            text: "Rita Requester cancelled this review. You don’t need to review Legal review any more.",
            linkLabel: "Open content"
        });
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: LEGAL_CHANNEL }
        ]);
    });

    it("reads the owner from the step and uses the step's channels when the review was on the second step (Review Focus 8)", async () => {
        const { handle, notifier } = await setup();

        await handle(createReviewOnEditorial(), createFact({ stepId: "editorial" }));

        const [call] = notifier.calls;
        expect(call.stepId).toBe("editorial");
        expect(call.recipients).toEqual([{ id: "user-other-reviewer", displayName: "Olga Reviewer" }]);
        expect(call.message.body).toBe(
            "Cancelled by Rita Requester. You no longer need to review Editorial review."
        );
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: EDITORIAL_CHANNEL }
        ]);
    });

    it("does not read the owner from review.currentOwnerId", async () => {
        const { handle, notifier } = await setup();
        const review = createNotificationReview();
        review.currentOwnerId = "user-someone-else";

        await handle(review, createFact());

        expect(notifier.calls[0].recipients).toEqual([
            { id: "user-reviewer", displayName: "Rob Reviewer" }
        ]);
    });

    it("tells nobody when the step was awaiting (a pool step has no owner)", async () => {
        const { handle, notifier } = await setup();
        const review = createNotificationReview();
        review.steps[0].state = "awaiting";
        review.steps[0].owner = null;

        await handle(review, createFact({ stepState: "awaiting" }));

        expect(notifier.calls).toEqual([]);
    });

    it("tells nobody when the cancel names no step", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ stepId: null, stepState: null }));

        expect(notifier.calls).toEqual([]);
        expect(loggedErrors).toEqual([]);
    });

    it("tells nobody when the owner is an AI or an automation (R183)", async () => {
        const { handle, notifier } = await setup();
        const review = createNotificationReview();
        review.steps[0].owner = AI_OWNER;

        await handle(review, createFact());

        expect(notifier.calls).toEqual([]);
    });

    it("does not tell an owner who cancels their own review (R184)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: reviewer }));

        expect(notifier.calls).toEqual([]);
    });

    it("names a canceller with a blank display name `A user` (R189a)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ actor: { ...requester, displayName: "" } })
        );

        expect(notifier.calls[0].message.body).toBe(
            "Cancelled by A user. You no longer need to review Legal review."
        );
    });

    it("uses the trash text when the content was trashed (D134)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ reason: REVIEW_CANCEL_REASON_CONTENT_TRASHED })
        );

        expect(notifier.calls[0].message).toEqual({
            title: "The review of “Article 1” was cancelled",
            body: "The content was moved to the trash. You no longer need to review Legal review.",
            subject: "Review cancelled: Article 1",
            text: "The content was moved to the trash, so this review was cancelled. You don’t need to review Legal review any more.",
            linkLabel: "Open content"
        });
    });

    it("uses the delete text when the content was deleted (D134)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ reason: REVIEW_CANCEL_REASON_CONTENT_DELETED })
        );

        expect(notifier.calls[0].message.body).toBe(
            "The content was deleted. You no longer need to review Legal review."
        );
    });

    it("never prints an unknown cancel reason (R146 mirror)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ reason: "SECRET internal reason" }));

        expect(notifier.calls[0].message.body).toBe(
            "Cancelled by Rita Requester. You no longer need to review Legal review."
        );
        expect(JSON.stringify(notifier.calls[0].message)).not.toContain("SECRET");
    });

    it("logs and returns when the cancelled step is not in the review", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ stepId: "gone" }));

        expect(notifier.calls).toEqual([]);
        expect(loggedErrors).toEqual([
            {
                message: "Could not find the step for a workflow notification.",
                fields: { reviewId: "review-1", stepId: "gone" }
            }
        ]);
    });

    it("survives a notifier that throws (R87, Review Focus 1)", async () => {
        const { handle, notifier } = await setup();
        notifier.mode = "throw";

        await expect(handle(createNotificationReview(), createFact())).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([
            {
                message: HANDLER_FAILED,
                fields: { errorName: "Error", reviewId: "review-1", event: "cancelled" }
            }
        ]);
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ReviewNotificationsFeature.test.ts`:

```ts
import { describe, expect, it } from "vitest";
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
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/index.js";

const NOTIFYING = [
    ReviewStepReachedEventHandler,
    ReviewStepReassignedEventHandler,
    ReviewStepTakenOverEventHandler,
    ReviewStepRejectedEventHandler,
    ReviewStepFailedEventHandler,
    ReviewApprovedEventHandler,
    ReviewCancelledEventHandler
];

const SILENT = [
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
        for (const abstraction of NOTIFYING) {
            expect(context.container.resolveAll(abstraction)).toHaveLength(0);
        }
    });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepRejectedNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepFailedNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewApprovedNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewCancelledNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotificationsFeature.test.ts 2>&1 | tail -50`
Expected: FAIL (the four handler modules do not exist; the feature test finds no notifier and no handler registered).

Run `yarn test:os packages/api-workflows/__tests__/notifications/ReviewNotificationsFeature.test.ts 2>&1 | tail -50`.
Expected: the same failure.

- [ ] **Step 3: Implement**

Create `packages/api-workflows/src/features/notifications/handlers/ReviewStepRejectedNotifications.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { dropActor } from "~/domain/notifications/dropActor.js";
import { getActorName } from "~/domain/notifications/getActorName.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { buildRejectedMessage } from "~/domain/notifications/messages/buildRejectedMessage.js";
import { ReviewStepRejectedEventHandler } from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/abstractions.js";

/**
 * Tells the requester their review was rejected, by whom and why (R181, R183, D107). An AI or
 * automation actor carries the requester's id (D58) and never drops the requester (R184).
 * Catches everything (R182, R87).
 */
class ReviewStepRejectedNotificationsImpl implements ReviewStepRejectedEventHandler.Interface {
    public constructor(
        private notifier: ReviewNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepRejectedEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            const step = review.steps.find(item => item.id === fact.change.stepId);
            if (!step) {
                this.logger.error(
                    { reviewId: review.id, stepId: fact.change.stepId },
                    "Could not find the step for a workflow notification."
                );
                return;
            }

            const recipients = dropActor(
                [{ id: review.createdBy.id, displayName: review.createdBy.displayName }],
                fact.actor
            );
            if (recipients.length === 0) {
                return;
            }
            await this.notifier.notify({
                review,
                stepId: step.id,
                event: "rejected",
                recipients,
                message: buildRejectedMessage({
                    contentTitle: review.title,
                    stepTitle: step.title,
                    decider: getActorName(fact.actor, step.title),
                    // A reject always has a comment (D100); the type allows null.
                    comment: fact.comment ?? ""
                })
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: fact.type },
                "A workflow notification handler failed."
            );
        }
    }
}

export const ReviewStepRejectedNotifications =
    ReviewStepRejectedEventHandler.createImplementation({
        implementation: ReviewStepRejectedNotificationsImpl,
        dependencies: [ReviewNotifierService, Logger]
    });
```

Create `packages/api-workflows/src/features/notifications/handlers/ReviewStepFailedNotifications.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { buildFailedMessage } from "~/domain/notifications/messages/buildFailedMessage.js";
import { ReviewStepFailedEventHandler } from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/abstractions.js";

/**
 * Tells the requester a step failed (R181, R183). The actor is never dropped (R184): the actor of
 * a failure can be the requester as a user (R140), who must still hear about it. The message
 * holds `fact.reason` only, a fixed text (R146 mirror). Catches everything (R182, R87).
 */
class ReviewStepFailedNotificationsImpl implements ReviewStepFailedEventHandler.Interface {
    public constructor(
        private notifier: ReviewNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepFailedEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            const step = review.steps.find(item => item.id === fact.change.stepId);
            if (!step) {
                this.logger.error(
                    { reviewId: review.id, stepId: fact.change.stepId },
                    "Could not find the step for a workflow notification."
                );
                return;
            }

            await this.notifier.notify({
                review,
                stepId: step.id,
                event: "failed",
                recipients: [
                    { id: review.createdBy.id, displayName: review.createdBy.displayName }
                ],
                message: buildFailedMessage({
                    contentTitle: review.title,
                    stepTitle: step.title,
                    reason: fact.reason
                })
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: fact.type },
                "A workflow notification handler failed."
            );
        }
    }
}

export const ReviewStepFailedNotifications = ReviewStepFailedEventHandler.createImplementation({
    implementation: ReviewStepFailedNotificationsImpl,
    dependencies: [ReviewNotifierService, Logger]
});
```

Create `packages/api-workflows/src/features/notifications/handlers/ReviewApprovedNotifications.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { dropActor } from "~/domain/notifications/dropActor.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { buildApprovedMessage } from "~/domain/notifications/messages/buildApprovedMessage.js";
import { ReviewApprovedEventHandler } from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/abstractions.js";

/**
 * Tells the requester every step approved the revision (R181, R183). The channels are the last
 * step's: it is the step that approved. Catches everything (R182, R87).
 */
class ReviewApprovedNotificationsImpl implements ReviewApprovedEventHandler.Interface {
    public constructor(
        private notifier: ReviewNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewApprovedEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            const step = review.steps[review.steps.length - 1];
            if (!step) {
                this.logger.error(
                    { reviewId: review.id, stepId: null },
                    "Could not find the step for a workflow notification."
                );
                return;
            }

            const recipients = dropActor(
                [{ id: review.createdBy.id, displayName: review.createdBy.displayName }],
                fact.actor
            );
            if (recipients.length === 0) {
                return;
            }
            await this.notifier.notify({
                review,
                stepId: step.id,
                event: "approved",
                recipients,
                message: buildApprovedMessage({ contentTitle: review.title })
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: fact.type },
                "A workflow notification handler failed."
            );
        }
    }
}

export const ReviewApprovedNotifications = ReviewApprovedEventHandler.createImplementation({
    implementation: ReviewApprovedNotificationsImpl,
    dependencies: [ReviewNotifierService, Logger]
});
```

Create `packages/api-workflows/src/features/notifications/handlers/ReviewCancelledNotifications.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { dropActor } from "~/domain/notifications/dropActor.js";
import { getActorName } from "~/domain/notifications/getActorName.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { buildCancelledMessage } from "~/domain/notifications/messages/buildCancelledMessage.js";
import { ReviewCancelledEventHandler } from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/abstractions.js";

/**
 * Tells the user who owned the current step that the review was cancelled (R181, R183). A pool
 * step (`awaiting`) has no owner, an AI or automation owner is never told, and the cancel does not
 * clear `step.owner`, so the owner is read from the step, never from `review.currentOwnerId`.
 * Catches everything (R182, R87).
 */
class ReviewCancelledNotificationsImpl implements ReviewCancelledEventHandler.Interface {
    public constructor(
        private notifier: ReviewNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewCancelledEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            if (fact.stepId === null || fact.stepState !== "inReview") {
                return;
            }

            const step = review.steps.find(item => item.id === fact.stepId);
            if (!step) {
                this.logger.error(
                    { reviewId: review.id, stepId: fact.stepId },
                    "Could not find the step for a workflow notification."
                );
                return;
            }
            if (!step.owner || step.owner.type !== "user") {
                return;
            }

            const recipients = dropActor(
                [{ id: step.owner.id, displayName: step.owner.displayName }],
                fact.actor
            );
            if (recipients.length === 0) {
                return;
            }
            await this.notifier.notify({
                review,
                stepId: step.id,
                event: "cancelled",
                recipients,
                message: buildCancelledMessage({
                    contentTitle: review.title,
                    stepTitle: step.title,
                    canceller: getActorName(fact.actor, step.title),
                    reason: fact.reason
                })
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: fact.type },
                "A workflow notification handler failed."
            );
        }
    }
}

export const ReviewCancelledNotifications = ReviewCancelledEventHandler.createImplementation({
    implementation: ReviewCancelledNotificationsImpl,
    dependencies: [ReviewNotifierService, Logger]
});
```

Create `packages/api-workflows/src/features/notifications/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { NotificationRecipientServiceFeature } from "~/features/notifications/NotificationRecipientService/index.js";
import { WorkflowsAdminUrlServiceFeature } from "~/features/notifications/WorkflowsAdminUrlService/index.js";
import { ReviewTargetLinkServiceFeature } from "~/features/notifications/ReviewTargetLinkService/index.js";
import { ReviewNotifierServiceFeature } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewStepReachedNotifications } from "./handlers/ReviewStepReachedNotifications.js";
import { ReviewStepReassignedNotifications } from "./handlers/ReviewStepReassignedNotifications.js";
import { ReviewStepTakenOverNotifications } from "./handlers/ReviewStepTakenOverNotifications.js";
import { ReviewStepRejectedNotifications } from "./handlers/ReviewStepRejectedNotifications.js";
import { ReviewStepFailedNotifications } from "./handlers/ReviewStepFailedNotifications.js";
import { ReviewApprovedNotifications } from "./handlers/ReviewApprovedNotifications.js";
import { ReviewCancelledNotifications } from "./handlers/ReviewCancelledNotifications.js";

/**
 * The review notifications (R182, R199): the notifier and the services it uses, and one handler
 * per notifying event. `requested`, `stepStarted`, `stepApproved` and `stepRestarted` have no
 * handler (R181). The CMS and Website Builder `ReviewTargetLink` adapters register in their own
 * packages. Registered by `WorkflowsFeature`, inside its `advancedPublishingWorkflow` gate.
 */
export const ReviewNotificationsFeature = createFeature({
    name: "WorkflowNotifications/ReviewNotifications",
    register(container) {
        NotificationRecipientServiceFeature.register(container);
        WorkflowsAdminUrlServiceFeature.register(container);
        ReviewTargetLinkServiceFeature.register(container);
        ReviewNotifierServiceFeature.register(container);

        container.register(ReviewStepReachedNotifications);
        container.register(ReviewStepReassignedNotifications);
        container.register(ReviewStepTakenOverNotifications);
        container.register(ReviewStepRejectedNotifications);
        container.register(ReviewStepFailedNotifications);
        container.register(ReviewApprovedNotifications);
        container.register(ReviewCancelledNotifications);
    }
});
```

Modify `packages/api-workflows/src/WorkflowsFeature.ts`. Add the import after the `NotificationTransportFeature` import (the import block of Task 1; line numbers move with it):

```ts
import { NotificationTransportFeature } from "~/features/notifications/NotificationTransport/index.js";
import { ReviewNotificationsFeature } from "~/features/notifications/feature.js";
```

and replace the notifications block (Task 1 left the comment as it was):

```ts
        // Notifications (internal, no permission check, D133; recipient rules arrive in phase 7)
        ListNotificationTransportsFeature.register(container);
        NotificationTransportFeature.register(container);
```

with:

```ts
        // Notifications (internal, no permission check, D133)
        ListNotificationTransportsFeature.register(container);
        NotificationTransportFeature.register(container);
        // Who is told about review events, and how (R182, R199)
        ReviewNotificationsFeature.register(container);
```

The call stays inside the existing `advancedPublishingWorkflow` gate (it is below the early `return`).

Modify `packages/api-workflows/__tests__/__helpers/handler.ts`. Add the imports:

```ts
import { MailerService } from "@webiny/api-mailer";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import { RecordingMailer } from "./RecordingMailer.js";
import { FakeWebsocketConnections } from "./FakeWebsocketConnections.js";
import { RecordingWebsocketsSend } from "./RecordingWebsocketsSend.js";
```

and, in `setup`, between the `GetTaskUseCase` registration and `await params.setup?.(container)`:

```ts
            // The review notification handlers (R182) depend on the mailer and the websocket use
            // cases, which the test context does not provide. Inert instances, so no test sends a
            // mail or a frame; a test's own `registerInstance` in `params.setup` wins.
            container.registerInstance(MailerService, new RecordingMailer());
            container.registerInstance(WebsocketsListConnectionsUseCase, new FakeWebsocketConnections());
            container.registerInstance(WebsocketsSendToConnectionsUseCase, new RecordingWebsocketsSend());
```

The final `setup` body reads:

```ts
        setup: async container => {
            WorkflowsFeature.register(container);
            // `ReviewSaver` aborts tasks through `TaskService`; the test containers have no
            // background-tasks feature. A test that needs another one registers it in `setup`.
            container.register(FakeTaskService);
            // Single review reads look at the step's task (stuck detection, R152).
            container.registerInstance(GetTaskUseCase, fakeGetTask);
            // The review notification handlers (R182) depend on the mailer and the websocket use
            // cases, which the test context does not provide. Inert instances, so no test sends a
            // mail or a frame; a test's own `registerInstance` in `params.setup` wins.
            container.registerInstance(MailerService, new RecordingMailer());
            container.registerInstance(WebsocketsListConnectionsUseCase, new FakeWebsocketConnections());
            container.registerInstance(WebsocketsSendToConnectionsUseCase, new RecordingWebsocketsSend());
            await params.setup?.(container);
        },
```

For `api-headless-cms-workflows` and `api-website-builder-workflows` create the same three stubs in each package's `__tests__/__helpers/` (identical content, the only difference is the package they live in).

Create `packages/<package>/__tests__/__helpers/InertMailer.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { MailerService } from "@webiny/api-mailer";

/** A mailer that sends nothing: the notification handlers need one to resolve (Task 12). */
export class InertMailer implements MailerService.Interface {
    public async sendMail<T = any>(): MailerService.Return<T> {
        return Result.ok({ result: null, error: null });
    }
}
```

Create `packages/<package>/__tests__/__helpers/InertWebsocketConnections.ts`:

```ts
import { Result } from "@webiny/feature/api";
import {
    WebsocketsListConnectionsUseCase,
    type WebsocketsError
} from "@webiny/api-websockets/exports/api.js";

/** Lists no connection: nobody is online in these tests (Task 12). */
export class InertWebsocketConnections implements WebsocketsListConnectionsUseCase.Interface {
    public async execute(): Promise<
        Result<WebsocketsListConnectionsUseCase.RegistryData[], WebsocketsError>
    > {
        return Result.ok([]);
    }
}
```

Create `packages/<package>/__tests__/__helpers/InertWebsocketsSend.ts`:

```ts
import { Result } from "@webiny/feature/api";
import {
    WebsocketsSendToConnectionsUseCase,
    type WebsocketsError
} from "@webiny/api-websockets/exports/api.js";

/** Sends no frame (Task 12). */
export class InertWebsocketsSend implements WebsocketsSendToConnectionsUseCase.Interface {
    public async execute(): Promise<Result<void, WebsocketsError>> {
        return Result.ok();
    }
}
```

Modify `packages/api-headless-cms-workflows/__tests__/__handler/context.ts`. Add the imports after the `FakeTaskService` import:

```ts
import { MailerService } from "@webiny/api-mailer";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import { InertMailer } from "../__helpers/InertMailer.js";
import { InertWebsocketConnections } from "../__helpers/InertWebsocketConnections.js";
import { InertWebsocketsSend } from "../__helpers/InertWebsocketsSend.js";
```

and in `setup`, right after `CmsWorkflowsFeature.register(container);`:

```ts
            // The review notification handlers (api-workflows) need a mailer and the websocket use
            // cases; this context has no request stack. Inert, so nothing is sent.
            container.registerInstance(MailerService, new InertMailer());
            container.registerInstance(WebsocketsListConnectionsUseCase, new InertWebsocketConnections());
            container.registerInstance(WebsocketsSendToConnectionsUseCase, new InertWebsocketsSend());
```

Modify `packages/api-website-builder-workflows/__tests__/__helpers/handler.ts`. Add the imports after `import { createArticleModelPlugins } from "./cmsModel.js";`:

```ts
import { MailerService } from "@webiny/api-mailer";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import { InertMailer } from "./InertMailer.js";
import { InertWebsocketConnections } from "./InertWebsocketConnections.js";
import { InertWebsocketsSend } from "./InertWebsocketsSend.js";
```

and in `setup`, right after `CmsWorkflowsFeature.register(container);`:

```ts
            // The review notification handlers (api-workflows) need a mailer and the websocket use
            // cases; this context has no request stack. Inert, so nothing is sent.
            container.registerInstance(MailerService, new InertMailer());
            container.registerInstance(WebsocketsListConnectionsUseCase, new InertWebsocketConnections());
            container.registerInstance(WebsocketsSendToConnectionsUseCase, new InertWebsocketsSend());
```

If `yarn adio` reports `@webiny/api-mailer` or `@webiny/api-websockets` as missing in either package (the stubs import them), add them to that package's `devDependencies` as `"0.0.0"` (adio and `yarn webiny sync-dependencies` in the pre-commit chain settle `package.json`, tsconfig and references).

- [ ] **Step 4: Run the tests to see them pass**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepRejectedNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepFailedNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewApprovedNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewCancelledNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotificationsFeature.test.ts 2>&1 | tail -50`
Expected: PASS for each.

Run the same five with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code**

`WorkflowsFeature` now registers handlers that every review save resolves when it publishes, so every existing test file that saves or transitions a review is covered, by path, one file per command (never a whole package suite). The `api-workflows` files:

```bash
for f in aiTools/UpdateTargetFieldsTool graphql/workflowsSchema registration \
  review/ApproveRejectIssues review/AssignmentRecordsAfterSave review/CancelDeleteAbortTask \
  review/CancelTargetReviews review/CurrentStepType review/DeleteTargetReviews \
  review/ReassignReviewStep review/RequestReview review/RequestTitleAndRejectComment \
  review/RestartReviewStep review/ReviewFailRestartEvents review/ReviewSaver \
  review/ReviewSaverTaskAbort review/ReviewTransitions routing/InspectRouting \
  routing/ListStepCandidates routing/RoutingEvaluatorService routing/RoutingStepAssignmentResolver \
  stepRun/StepRunReachService stepRun/StepRunStaleCheckService stepRun/StuckStepService \
  stepRun/StuckStepServiceRunners stepRun/WorkflowStepRunTask stepRun/WorkflowStepRunTaskDispatch \
  stepRun/WorkflowStepRunTaskIssues stepRun/WorkflowStepRunTaskRun \
  stepRun/WorkflowStepRunTaskRunnerHooks stepRun/WorkflowStepRunTaskSignals stepTypes/AutomationReach; do
  yarn test packages/api-workflows/__tests__/$f.test.ts 2>&1 | tail -15
done
```

then the same loop with `yarn test:os` instead of `yarn test` (run the `test:os` commands one at a time). The `api-headless-cms-workflows` files:

```bash
for f in entrySystemSchema graphql/cmsRestartSchema graphql/cmsRoutingSchema graphql/cmsWorkflowsSchema hooks/trashAndDelete \
  hooks/publishAndMove hooks/revisionAndSaveBlock target/CmsEntryFolderPort \
  target/CmsEntryReviewTargetEditorUpdate wrappers/cancelReviewsForDelete wrappers/workflowWrappers \
  registration target/CmsEntryAdapter wrappers/listReviews wrappers/requestAndGetReview \
  wrappers/restartReviewStep wrappers/reviewTransitions wrappers/routingWrappers \
  wrappers/targetReviewAndAssignments; do
  yarn test packages/api-headless-cms-workflows/__tests__/$f.test.ts 2>&1 | tail -15
done
```

and the `api-website-builder-workflows` files:

```bash
for f in graphql/pageRestart graphql/pageReviews graphql/pageRouting registration \
  wrappers/cancelReviewsForDelete wrappers/workflowWrappers target/WbPageReviewTargetEditorUpdate \
  target/WbPageFolderPort target/WbPageAdapter graphql/pagePublishBlocked graphql/pageSystemWorkflow \
  graphql/pageReviewLists graphql/pageWorkflows \
  target/WbPageTrashAndDelete wrappers/listReviews wrappers/requestAndGetReview \
  wrappers/restartReviewStep wrappers/reviewTransitions wrappers/routingWrappers \
  wrappers/targetReviewAndAssignments; do
  yarn test packages/api-website-builder-workflows/__tests__/$f.test.ts 2>&1 | tail -15
done
```

each also with `yarn test:os`. Confirm the lists are complete before running them: for each package run `grep -rlE "ReviewSaver|createReviewContext|createRoutingContext|requestReview|startPageReview|request(Entry|Page)Review|approve(Entry|Page)Review|cancel(Entry|Page)Review|createWbReview|createCmsReview" packages/<package>/__tests__ --include=*.test.ts` and add any `.test.ts` hit that is not in the lists above (the `api-workflows` `notifications/` files are the new ones of this phase and run in their own tasks).

Expected: PASS everywhere. Existing expectations stay as they are, with one documented exception: the step-reached handler now looks the pool up (`listMembers`, so one more `ListUsers` call and, for a readable user, one more read check) whenever a step goes to the pool, so a test that counts `users.calls` or `readChecks`, or asserts that `loggedErrors` is empty, around such a step may change. Watch `review/ReassignReviewStep`, `routing/RoutingStepAssignmentResolver` and `stepRun/StuckStepService*` first. Fix such a test only in its own `setup` (register the missing fake: `createRoutingContext` and `readableUsers` are the usual ones) or by updating the call count for exactly that documented reason, never by changing a handler, and name the file in the commit message. A failure for any other reason is a defect in Tasks 10-12.

Run: `yarn check:test:types -p api-workflows,api-headless-cms-workflows,api-website-builder-workflows --report cli 2>&1 | tail -40`
Expected: no errors in the touched packages.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `00-shared.md` in full, building each changed package with `--no-cache` (`@webiny/api-workflows`; `api-headless-cms-workflows` and `api-website-builder-workflows` only gain test files and `package.json` devDependencies, so their source builds are unchanged, but adio and sync-dependencies in the chain cover their `package.json` and tsconfig changes), and restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`). If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-workflows): notify on rejected, failed, approved and cancelled and register the notifications feature" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```
