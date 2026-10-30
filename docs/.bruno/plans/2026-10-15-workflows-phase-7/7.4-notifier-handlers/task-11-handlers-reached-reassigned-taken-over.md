### Task 11: Handlers for step reached, reassigned and taken over

Spec 12; D44, D58, D107, D111, D126, D132; R181, R182, R183, R184, R185, R189, R189a, R196; A66; Review Focus 1, 2, 8. Three thin event handlers: each picks the recipients of its event (R183), drops the actor when the actor is a user (R184), builds the message (Task 6) and calls the one shared `ReviewNotifierService` (Task 10). No handler talks to a transport or a websocket. Each `handle` is one try/catch around the whole body (R182, R87): the saver publishes after the save and lets handler exceptions propagate, so a throw here would fail an action that already happened.

- **`ReviewStepReachedNotifications`** (event `ReviewStepReachedEvent`, abstraction `ReviewStepReachedEventHandler`).
  - `fact.owner` is `ai` or `automation`: return (AI and automation owners carry the requester's id, D58, and are never notified as owners; nothing else is called).
  - Otherwise the step is `review.steps.find(step => step.id === fact.change.stepId)`; a step that is not found logs `Logger.error({ reviewId, stepId }, "Could not find the step for a workflow notification.")` once and returns.
  - `fact.owner` is a user: recipient `{ id: owner.id, displayName: owner.displayName }`, `dropActor(recipients, fact.actor)`, event `"assigned"`, message `buildAssignedMessage({ contentTitle: review.title, stepTitle: step.title, reason: getAssignmentReason(fact.assignment?.source, getActorName(review.createdBy, step.title)), reassignedBy: null })`.
  - `fact.owner` is `null` (pool): `NotificationRecipientService.listPool({ review, stepId: step.id, now: new Date(fact.occurredOn) })`; a failed Result is logged (`Could not list the members of the step's teams.` with `errorCode`, `errorName`, `reviewId`, `stepId`, never the message, R196) and nothing else happens; otherwise `dropActor`, event `"poolReached"`, message `buildPoolReachedMessage({ contentTitle, stepTitle, requester: getActorName(review.createdBy, step.title) })`.
  - No recipient left: no `notify` call. `notify({ review, stepId: step.id, event, recipients, message })`, so the channels are the ones of the step that was reached (R186, Review Focus 8).
- **`ReviewStepReassignedNotifications`** (`ReviewStepReassignedEvent`). The step is `fact.change.stepId` (not found: logged and returned, as above). Two notifications, in this order, each with `dropActor(..., fact.actor)`: (1) the new owner `fact.owner` (a user), event `"assigned"`, `buildAssignedMessage({ contentTitle, stepTitle, reason: null, reassignedBy: getActorName(fact.actor, step.title) })`; (2) the old owner `fact.previousOwner`, only when it is a user (`null` for an `awaiting` step, AI and automation owners are never notified), event `"reassigned"`, `buildReassignedMessage({ contentTitle, stepTitle, operator: getActorName(fact.actor, step.title), newOwner: getActorName(fact.owner, step.title) })`. Both use the channels of `fact.change.stepId`. The pool is not told that a step left it (R181).
- **`ReviewStepTakenOverNotifications`** (`ReviewStepTakenOverEvent`). Return (nothing logged) when `fact.notifyPreviousOwner` is false (D111, R185) or `fact.previousOwner.type` is not `"user"`. Otherwise the step is `fact.change.stepId` (not found: logged and returned), recipient `fact.previousOwner`, `dropActor`, event `"takenOver"`, `buildTakenOverMessage({ contentTitle, stepTitle, taker: getActorName(fact.actor, step.title) })`.

Every name passed to a builder is `getActorName(actor, step.title)` of an actor, never a raw `displayName` (R189a): a blank name reads `A user`, and an AI or automation actor is named by the step title (D107, D126). The three handlers log a throw of their own body with `Logger.error({ errorCode, errorName, reviewId, event: fact.type }, "A workflow notification handler failed.")` (the notifier never rejects, so this only catches a bug or a throwing recipient service).

Only the reached handler needs `NotificationRecipientService` (the pool); the other two depend on the notifier and the logger only.

**Files:**
- Create: `packages/api-workflows/src/features/notifications/handlers/ReviewStepReachedNotifications.ts`
- Create: `packages/api-workflows/src/features/notifications/handlers/ReviewStepReassignedNotifications.ts`
- Create: `packages/api-workflows/src/features/notifications/handlers/ReviewStepTakenOverNotifications.ts`
- Create: `packages/api-workflows/__tests__/__helpers/RecordingReviewNotifier.ts`
- Create: `packages/api-workflows/__tests__/__helpers/StubNotificationRecipients.ts`
- Create: `packages/api-workflows/__tests__/__helpers/notificationReviews.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewStepReachedNotifications.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewStepReassignedNotifications.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewStepTakenOverNotifications.test.ts`

**Interfaces:**
- Consumes:
  - Task 10: `ReviewNotifierService` and `ReviewNotifierService.Params` (`~/features/notifications/ReviewNotifierService/index.js`), `getErrorLogFields` (`~/domain/notifications/getErrorLogFields.js`).
  - Task 7: `NotificationRecipientService`, `NotificationRecipient` (`~/features/notifications/NotificationRecipientService/index.js`; `listPool(params): Promise<Result<NotificationRecipient[], WorkflowPersistenceError>>`).
  - Task 6: `getActorName`, `dropActor` (`~/domain/notifications/getActorName.js`, `dropActor.js`), `buildAssignedMessage`, `buildPoolReachedMessage`, `buildReassignedMessage`, `buildTakenOverMessage`, `getAssignmentReason` (`~/domain/notifications/messages/<name>.js`).
  - Task 4: `ReviewStepTakenOverFact.notifyPreviousOwner: boolean` (`~/domain/review/facts.js`).
  - Existing: `ReviewStepReachedEventHandler`, `ReviewStepReachedEvent`, `ReviewStepReassignedEventHandler`, `ReviewStepReassignedEvent`, `ReviewStepTakenOverEventHandler`, `ReviewStepTakenOverEvent` (`~/features/review/events.js`; `handle(event)` reads `event.payload.review` and `event.payload.fact`), the fact types `ReviewStepReachedFact`, `ReviewStepReassignedFact`, `ReviewStepTakenOverFact` (`~/domain/review/facts.js`), `Actor`, `ReviewData` (`~/domain/review/types.js`), `Logger`, `WorkflowPersistenceError` (`~/domain/workflow/errors.js`).
  - Test helpers: `createContextHandler`, `captureLoggedErrors`, `loggedErrors`, `createWorkflow`, `createReviewStep`, `createStartedReview`, `requester`, `reviewer`, `otherReviewer`, `NOW` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract):
  - `ReviewStepReachedNotifications`, `ReviewStepReassignedNotifications`, `ReviewStepTakenOverNotifications`: the exported implementations (`<Event>Handler.createImplementation`; dependencies `[ReviewNotifierService, NotificationRecipientService, Logger]` for the reached handler, `[ReviewNotifierService, Logger]` for the other two). Registered by `ReviewNotificationsFeature` (Task 12).
  - Test helpers `RecordingReviewNotifier` (`calls`, `mode`), `StubNotificationRecipients` (`pool`, `mode`, `poolCalls`), `createNotificationReview()` and `createNotificationWorkflow()` (`~tests/__helpers/notificationReviews.js`), reused by Tasks 12 and 13.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/RecordingReviewNotifier.ts`:

```ts
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";

/**
 * Stands in for the notifier in the handler tests: records every `notify` call (cloned), and with
 * `mode: "throw"` rejects, which the real notifier never does, to prove a handler survives it.
 * Register with `container.registerInstance(ReviewNotifierService, notifier)`.
 */
export class RecordingReviewNotifier implements ReviewNotifierService.Interface {
    public readonly calls: ReviewNotifierService.Params[] = [];
    public mode: "ok" | "throw" = "ok";

    public async notify(params: ReviewNotifierService.Params): Promise<void> {
        this.calls.push(structuredClone(params));
        if (this.mode === "throw") {
            throw new Error("The notifier crashed.");
        }
    }
}
```

Create `packages/api-workflows/__tests__/__helpers/StubNotificationRecipients.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import {
    NotificationRecipientService,
    type NotificationRecipient
} from "~/features/notifications/NotificationRecipientService/index.js";

/** The text a failing pool lookup carries; a handler must never log it (R196). */
export const POOL_FAILURE_SECRET = "SECRET-POOL-4711";

/**
 * Answers `listPool` with a fixed list, a failure whose message holds a secret, or a throw, and
 * records how it was called. `listUsers` is not used by the handlers. Register with
 * `container.registerInstance(NotificationRecipientService, stub)`.
 */
export class StubNotificationRecipients implements NotificationRecipientService.Interface {
    public pool: NotificationRecipient[] = [];
    public mode: "ok" | "fail" | "throw" = "ok";
    public readonly poolCalls: NotificationRecipientService.PoolParams[] = [];

    public async listPool(
        params: NotificationRecipientService.PoolParams
    ): NotificationRecipientService.PoolReturn {
        this.poolCalls.push(structuredClone(params));
        if (this.mode === "throw") {
            throw new Error("The recipient service crashed.");
        }
        if (this.mode === "fail") {
            return Result.fail(
                new WorkflowPersistenceError(new Error(`Lookup failed ${POOL_FAILURE_SECRET}.`))
            );
        }
        return Result.ok(this.pool.map(item => ({ ...item })));
    }

    public async listUsers(): NotificationRecipientService.UsersReturn {
        throw new Error("Not used by the handlers.");
    }
}
```

Create `packages/api-workflows/__tests__/__helpers/notificationReviews.ts`:

```ts
import type { ReviewData } from "~/domain/review/types.js";
import type { Workflow } from "~/domain/workflow/types.js";
import { createReviewStep, createStartedReview, createWorkflow } from "./fixtures.js";

/** The channels of the two steps differ, so a handler that picks the wrong step is caught (D103). */
export const LEGAL_CHANNEL = "channel-legal";
export const EDITORIAL_CHANNEL = "channel-editorial";

/** "Legal review" notifies through `channel-legal`, "Editorial review" through `channel-editorial`. */
export const createNotificationWorkflow = (): Workflow => {
    return createWorkflow({
        steps: [
            {
                ...createReviewStep({ id: "legal", title: "Legal review", allowManualPick: true }),
                notifications: [{ id: LEGAL_CHANNEL }]
            },
            {
                ...createReviewStep({ id: "editorial", title: "Editorial review" }),
                notifications: [{ id: EDITORIAL_CHANNEL }]
            }
        ]
    });
};

/**
 * "Article 1" requested by Rita Requester; "Legal review" is `inReview`, owned by Rob Reviewer
 * (`reviewer`); "Editorial review" is `pending`. A fresh copy on every call: tests may change it.
 */
export const createNotificationReview = (): ReviewData => {
    return createStartedReview({ workflow: createNotificationWorkflow() }).toData();
};
```

Create `packages/api-workflows/__tests__/notifications/ReviewStepReachedNotifications.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewNotifier } from "~tests/__helpers/RecordingReviewNotifier.js";
import {
    POOL_FAILURE_SECRET,
    StubNotificationRecipients
} from "~tests/__helpers/StubNotificationRecipients.js";
import {
    createNotificationReview,
    EDITORIAL_CHANNEL,
    LEGAL_CHANNEL
} from "~tests/__helpers/notificationReviews.js";
import { NOW, requester } from "~tests/__helpers/fixtures.js";
import type { ReviewStepReachedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepReachedEvent,
    type ReviewStepReachedEventHandler
} from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { NotificationRecipientService } from "~/features/notifications/NotificationRecipientService/index.js";
import { ReviewStepReachedNotifications } from "~/features/notifications/handlers/ReviewStepReachedNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";

const ANNA: Actor = { type: "user", id: "user-anna", displayName: "Anna", identityType: "admin" };
const BOB: Actor = { type: "user", id: "user-bob", displayName: "Bob", identityType: "admin" };
const AI_OWNER: Actor = { type: "ai", id: requester.id, displayName: "AI check" };
const AUTOMATION_OWNER: Actor = {
    type: "automation",
    id: requester.id,
    displayName: "Link checker"
};

const createFact = (overrides: Partial<ReviewStepReachedFact> = {}): ReviewStepReachedFact => {
    return {
        type: "stepReached",
        occurredOn: NOW,
        actor: requester,
        owner: ANNA,
        change: { stepId: "legal", fromState: "pending", toState: "inReview" },
        assignment: { source: "picked" },
        taskId: null,
        records: [],
        ...overrides
    };
};

const setup = async () => {
    const notifier = new RecordingReviewNotifier();
    const recipients = new StubNotificationRecipients();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(ReviewNotifierService, notifier);
            container.registerInstance(NotificationRecipientService, recipients);
        }
    });
    const handler = context.container.resolveImplementation(
        ReviewStepReachedNotifications
    ) as ReviewStepReachedEventHandler.Interface;

    return {
        notifier,
        recipients,
        handle: (review: ReviewData, fact: ReviewStepReachedFact): Promise<void> => {
            return handler.handle(new ReviewStepReachedEvent({ review, fact }));
        }
    };
};

describe("ReviewStepReachedNotifications (R181, R183, R184, R189)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    describe("a user owns the reached step", () => {
        it("tells the owner the step is theirs, through the channels of the reached step", async () => {
            const { handle, notifier } = await setup();
            const review = createNotificationReview();

            await handle(review, createFact());

            expect(notifier.calls).toHaveLength(1);
            const [call] = notifier.calls;
            expect(call.event).toBe("assigned");
            expect(call.stepId).toBe("legal");
            expect(call.recipients).toEqual([{ id: "user-anna", displayName: "Anna" }]);
            expect(call.message).toEqual({
                title: "You’re reviewing “Article 1”",
                body: "Legal review · picked by Rita Requester",
                subject: "You’re reviewing: Article 1 (Legal review)",
                text: "You are the owner of Legal review. Open the content to approve or reject it.",
                linkLabel: "Open content"
            });
            expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
                { id: LEGAL_CHANNEL }
            ]);
        });

        it("uses the channels of the second step when the second step was reached (Review Focus 8)", async () => {
            const { handle, notifier } = await setup();

            await handle(
                createNotificationReview(),
                createFact({
                    owner: BOB,
                    actor: ANNA,
                    change: { stepId: "editorial", fromState: "pending", toState: "inReview" }
                })
            );

            expect(notifier.calls).toHaveLength(1);
            const [call] = notifier.calls;
            expect(call.stepId).toBe("editorial");
            expect(call.recipients).toEqual([{ id: "user-bob", displayName: "Bob" }]);
            expect(call.message.body).toBe("Editorial review · picked by Rita Requester");
            expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
                { id: EDITORIAL_CHANNEL }
            ]);
        });

        it.each([
            { source: "picked", reason: "picked by Rita Requester" },
            { source: "rule", reason: "assigned by a routing rule" },
            { source: "roundRobin", reason: "assigned by round-robin" },
            { source: "leastLoaded", reason: "assigned by least-loaded" },
            { source: "poolStart", reason: "assigned to you" }
        ] as const)("explains an assignment by $source", async ({ source, reason }) => {
            const { handle, notifier } = await setup();

            await handle(createNotificationReview(), createFact({ assignment: { source } }));

            expect(notifier.calls[0].message.body).toBe(`Legal review · ${reason}`);
        });

        it("reads a missing assignment as assigned to you", async () => {
            const { handle, notifier } = await setup();

            await handle(createNotificationReview(), createFact({ assignment: null }));

            expect(notifier.calls[0].message.body).toBe("Legal review · assigned to you");
        });

        it("names a requester with a blank display name `A user` (R189a)", async () => {
            const { handle, notifier } = await setup();
            const review = createNotificationReview();
            review.createdBy = { ...requester, displayName: "   " };

            await handle(review, createFact());

            expect(notifier.calls[0].message.body).toBe("Legal review · picked by A user");
        });

        it("does not tell a user who reached the step for themselves (R184)", async () => {
            const { handle, notifier } = await setup();

            await handle(createNotificationReview(), createFact({ actor: ANNA, owner: ANNA }));

            expect(notifier.calls).toEqual([]);
        });

        it("still tells the owner when an AI actor with the owner's id reached the step (R184, D58)", async () => {
            const { handle, notifier } = await setup();
            const aiActor: Actor = { type: "ai", id: "user-anna", displayName: "AI check" };

            await handle(createNotificationReview(), createFact({ actor: aiActor, owner: ANNA }));

            expect(notifier.calls).toHaveLength(1);
            expect(notifier.calls[0].recipients).toEqual([
                { id: "user-anna", displayName: "Anna" }
            ]);
        });

        it.each([
            { name: "an AI owner", owner: AI_OWNER },
            { name: "an automation owner", owner: AUTOMATION_OWNER }
        ])("tells nobody when the owner is $name (R183)", async ({ owner }) => {
            const { handle, notifier, recipients } = await setup();

            await handle(createNotificationReview(), createFact({ owner, assignment: null }));

            expect(notifier.calls).toEqual([]);
            expect(recipients.poolCalls).toEqual([]);
        });
    });

    describe("the step went to the pool", () => {
        const poolFact = (overrides: Partial<ReviewStepReachedFact> = {}) => {
            return createFact({
                owner: null,
                assignment: { source: "pool" },
                change: { stepId: "editorial", fromState: "pending", toState: "awaiting" },
                ...overrides
            });
        };

        it("tells the pool members, through the channels of the reached step", async () => {
            const { handle, notifier, recipients } = await setup();
            recipients.pool = [
                { id: "user-anna", displayName: "Anna" },
                { id: "user-bob", displayName: "Bob" }
            ];
            const review = createNotificationReview();

            await handle(review, poolFact());

            expect(recipients.poolCalls).toEqual([
                { review, stepId: "editorial", now: new Date(NOW) }
            ]);
            expect(notifier.calls).toHaveLength(1);
            const [call] = notifier.calls;
            expect(call.event).toBe("poolReached");
            expect(call.stepId).toBe("editorial");
            expect(call.recipients).toEqual([
                { id: "user-anna", displayName: "Anna" },
                { id: "user-bob", displayName: "Bob" }
            ]);
            expect(call.message).toEqual({
                title: "“Article 1” is waiting in the team pool",
                body: "Editorial review · requested by Rita Requester",
                subject: "Team pool: Article 1 (Editorial review)",
                text: "“Editorial review” is waiting in the team pool. Anyone in the team can start it.",
                linkLabel: "Open content"
            });
            expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
                { id: EDITORIAL_CHANNEL }
            ]);
        });

        it("drops a pool member who caused the step to be reached (R184)", async () => {
            const { handle, notifier, recipients } = await setup();
            recipients.pool = [
                { id: "user-anna", displayName: "Anna" },
                { id: "user-bob", displayName: "Bob" }
            ];

            await handle(createNotificationReview(), poolFact({ actor: ANNA }));

            expect(notifier.calls[0].recipients).toEqual([{ id: "user-bob", displayName: "Bob" }]);
        });

        it("keeps a pool member when an AI actor with their id reached the step (R184)", async () => {
            const { handle, notifier, recipients } = await setup();
            recipients.pool = [{ id: "user-anna", displayName: "Anna" }];
            const aiActor: Actor = { type: "ai", id: "user-anna", displayName: "AI check" };

            await handle(createNotificationReview(), poolFact({ actor: aiActor }));

            expect(notifier.calls[0].recipients).toEqual([
                { id: "user-anna", displayName: "Anna" }
            ]);
        });

        it("sends nothing when the pool is empty", async () => {
            const { handle, notifier } = await setup();

            await handle(createNotificationReview(), poolFact());

            expect(notifier.calls).toEqual([]);
        });

        it("names a requester with a blank display name `A user` (R189a)", async () => {
            const { handle, notifier, recipients } = await setup();
            recipients.pool = [{ id: "user-anna", displayName: "Anna" }];
            const review = createNotificationReview();
            review.createdBy = { ...requester, displayName: "" };

            await handle(review, poolFact());

            expect(notifier.calls[0].message.body).toBe("Editorial review · requested by A user");
        });

        it("logs a failed pool lookup with code and name only and sends nothing (R196)", async () => {
            const { handle, notifier, recipients } = await setup();
            recipients.mode = "fail";

            await expect(handle(createNotificationReview(), poolFact())).resolves.toBeUndefined();

            expect(notifier.calls).toEqual([]);
            expect(loggedErrors).toEqual([
                {
                    message: "Could not list the members of the step's teams.",
                    fields: {
                        errorCode: "Workflows/Workflow/Persistence",
                        errorName: "Error",
                        reviewId: "review-1",
                        stepId: "editorial"
                    }
                }
            ]);
            expect(JSON.stringify(loggedErrors)).not.toContain(POOL_FAILURE_SECRET);
        });

        it("survives a recipient service that throws (R87)", async () => {
            const { handle, notifier, recipients } = await setup();
            recipients.mode = "throw";

            await expect(handle(createNotificationReview(), poolFact())).resolves.toBeUndefined();

            expect(notifier.calls).toEqual([]);
            expect(loggedErrors).toEqual([
                {
                    message: HANDLER_FAILED,
                    fields: {
                        errorName: "Error",
                        reviewId: "review-1",
                        event: "stepReached"
                    }
                }
            ]);
        });
    });

    it("logs and returns when the reached step is not in the review", async () => {
        const { handle, notifier } = await setup();

        await expect(
            handle(
                createNotificationReview(),
                createFact({ change: { stepId: "gone", fromState: "pending", toState: "inReview" } })
            )
        ).resolves.toBeUndefined();

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
                fields: { errorName: "Error", reviewId: "review-1", event: "stepReached" }
            }
        ]);
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ReviewStepReassignedNotifications.test.ts`:

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
import { NOW, reviewer } from "~tests/__helpers/fixtures.js";
import type { ReviewStepReassignedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepReassignedEvent,
    type ReviewStepReassignedEventHandler
} from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewStepReassignedNotifications } from "~/features/notifications/handlers/ReviewStepReassignedNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";

const MANAGER: Actor = {
    type: "user",
    id: "user-manager",
    displayName: "Mona Manager",
    identityType: "admin"
};
const ANNA: Actor = { type: "user", id: "user-anna", displayName: "Anna", identityType: "admin" };

const createFact = (
    overrides: Partial<ReviewStepReassignedFact> = {}
): ReviewStepReassignedFact => {
    return {
        type: "stepReassigned",
        occurredOn: NOW,
        actor: MANAGER,
        change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
        owner: ANNA,
        previousOwner: reviewer,
        records: [],
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
        ReviewStepReassignedNotifications
    ) as ReviewStepReassignedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewStepReassignedFact): Promise<void> => {
            return handler.handle(new ReviewStepReassignedEvent({ review, fact }));
        }
    };
};

describe("ReviewStepReassignedNotifications (R181, R183, R184, R189)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the new owner first and the old owner second, each with its own message", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact());

        expect(notifier.calls).toHaveLength(2);
        const [assigned, reassigned] = notifier.calls;
        expect(assigned.event).toBe("assigned");
        expect(assigned.stepId).toBe("legal");
        expect(assigned.recipients).toEqual([{ id: "user-anna", displayName: "Anna" }]);
        expect(assigned.message).toEqual({
            title: "You’re reviewing “Article 1”",
            body: "Legal review · reassigned to you by Mona Manager",
            subject: "You’re reviewing: Article 1 (Legal review)",
            text: "You are the owner of Legal review. Open the content to approve or reject it.",
            linkLabel: "Open content"
        });
        expect(reassigned.event).toBe("reassigned");
        expect(reassigned.stepId).toBe("legal");
        expect(reassigned.recipients).toEqual([
            { id: "user-reviewer", displayName: "Rob Reviewer" }
        ]);
        expect(reassigned.message).toEqual({
            title: "“Article 1” was reassigned to Anna",
            body: "Legal review · reassigned by Mona Manager. You no longer own this step.",
            subject: "Reassigned: Article 1 (Legal review)",
            text: "Mona Manager reassigned this step to Anna. You don’t need to review it any more.",
            linkLabel: "Open content"
        });
    });

    it("uses the channels of the reassigned step for both messages (Review Focus 8)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({
                change: { stepId: "editorial", fromState: "inReview", toState: "inReview" }
            })
        );

        expect(notifier.calls.map(call => call.stepId)).toEqual(["editorial", "editorial"]);
        expect(notifier.calls[0].message.body).toBe(
            "Editorial review · reassigned to you by Mona Manager"
        );
        for (const call of notifier.calls) {
            expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
                { id: EDITORIAL_CHANNEL }
            ]);
        }
        expect(
            notifier.calls[0].review.steps.find(step => step.id === "legal")?.notifications
        ).toEqual([{ id: LEGAL_CHANNEL }]);
    });

    it("tells only the new owner when the step was awaiting (no previous owner)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ previousOwner: null }));

        expect(notifier.calls.map(call => call.event)).toEqual(["assigned"]);
    });

    it.each([
        { type: "ai", displayName: "AI check" },
        { type: "automation", displayName: "Link checker" }
    ] as const)("never tells an $type previous owner", async ({ type, displayName }) => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ previousOwner: { type, id: "user-requester", displayName } })
        );

        expect(notifier.calls.map(call => call.event)).toEqual(["assigned"]);
    });

    it("does not tell a user who reassigns the step to themselves (R184), but still the old owner", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: ANNA }));

        expect(notifier.calls.map(call => call.event)).toEqual(["reassigned"]);
        expect(notifier.calls[0].recipients).toEqual([
            { id: "user-reviewer", displayName: "Rob Reviewer" }
        ]);
    });

    it("does not tell an old owner who reassigns their own step (R184), but still the new owner", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: reviewer }));

        expect(notifier.calls.map(call => call.event)).toEqual(["assigned"]);
        expect(notifier.calls[0].message.body).toBe(
            "Legal review · reassigned to you by Rob Reviewer"
        );
    });

    it("names every person through getActorName: a blank display name reads `A user` (R189a)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({
                actor: { ...MANAGER, displayName: "  " },
                owner: { ...ANNA, displayName: "" }
            })
        );

        expect(notifier.calls[0].message.body).toBe(
            "Legal review · reassigned to you by A user"
        );
        expect(notifier.calls[1].message.title).toBe("“Article 1” was reassigned to A user");
        expect(notifier.calls[1].message.body).toBe(
            "Legal review · reassigned by A user. You no longer own this step."
        );
    });

    it("logs and returns when the step is not in the review", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ change: { stepId: "gone", fromState: "inReview", toState: "inReview" } })
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
                fields: { errorName: "Error", reviewId: "review-1", event: "stepReassigned" }
            }
        ]);
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ReviewStepTakenOverNotifications.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewNotifier } from "~tests/__helpers/RecordingReviewNotifier.js";
import {
    createNotificationReview,
    EDITORIAL_CHANNEL
} from "~tests/__helpers/notificationReviews.js";
import { NOW, reviewer } from "~tests/__helpers/fixtures.js";
import type { ReviewStepTakenOverFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepTakenOverEvent,
    type ReviewStepTakenOverEventHandler
} from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewStepTakenOverNotifications } from "~/features/notifications/handlers/ReviewStepTakenOverNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";

const ANNA: Actor = { type: "user", id: "user-anna", displayName: "Anna", identityType: "admin" };

const createFact = (overrides: Partial<ReviewStepTakenOverFact> = {}): ReviewStepTakenOverFact => {
    return {
        type: "stepTakenOver",
        occurredOn: NOW,
        actor: ANNA,
        change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
        previousOwner: reviewer,
        notifyPreviousOwner: true,
        records: [],
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
        ReviewStepTakenOverNotifications
    ) as ReviewStepTakenOverEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewStepTakenOverFact): Promise<void> => {
            return handler.handle(new ReviewStepTakenOverEvent({ review, fact }));
        }
    };
};

describe("ReviewStepTakenOverNotifications (R181, R183, R185, D111)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the previous owner who took the step over", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.event).toBe("takenOver");
        expect(call.stepId).toBe("legal");
        expect(call.recipients).toEqual([{ id: "user-reviewer", displayName: "Rob Reviewer" }]);
        expect(call.message).toEqual({
            title: "Anna took over Legal review on “Article 1”.",
            body: "You no longer own this step.",
            subject: "Taken over: Article 1 (Legal review)",
            text: "Anna took over Legal review on “Article 1”. You don’t need to review it any more.",
            linkLabel: "Open content"
        });
    });

    it("uses the channels of the step that was taken over (Review Focus 8)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({
                change: { stepId: "editorial", fromState: "inReview", toState: "inReview" }
            })
        );

        const [call] = notifier.calls;
        expect(call.stepId).toBe("editorial");
        expect(call.message.title).toBe("Anna took over Editorial review on “Article 1”.");
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: EDITORIAL_CHANNEL }
        ]);
    });

    it("sends nothing when the taker opted out of the notice (D111, R185)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ notifyPreviousOwner: false }));

        expect(notifier.calls).toEqual([]);
        expect(loggedErrors).toEqual([]);
    });

    it.each([
        { type: "ai", displayName: "AI check" },
        { type: "automation", displayName: "Link checker" }
    ] as const)("never tells an $type previous owner", async ({ type, displayName }) => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ previousOwner: { type, id: "user-requester", displayName } })
        );

        expect(notifier.calls).toEqual([]);
    });

    it("does not tell a user who takes over their own step (R184)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: reviewer }));

        expect(notifier.calls).toEqual([]);
    });

    it("names the taker through getActorName: a blank display name reads `A user` (R189a)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ actor: { ...ANNA, displayName: "  " } })
        );

        expect(notifier.calls[0].message.title).toBe("A user took over Legal review on “Article 1”.");
    });

    it("logs and returns when the step is not in the review", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ change: { stepId: "gone", fromState: "inReview", toState: "inReview" } })
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
                fields: { errorName: "Error", reviewId: "review-1", event: "stepTakenOver" }
            }
        ]);
    });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepReachedNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepReassignedNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepTakenOverNotifications.test.ts 2>&1 | tail -50`
Expected: FAIL (the three handler modules do not exist).

- [ ] **Step 3: Implement**

Create `packages/api-workflows/src/features/notifications/handlers/ReviewStepReachedNotifications.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { dropActor } from "~/domain/notifications/dropActor.js";
import { getActorName } from "~/domain/notifications/getActorName.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { buildAssignedMessage } from "~/domain/notifications/messages/buildAssignedMessage.js";
import { buildPoolReachedMessage } from "~/domain/notifications/messages/buildPoolReachedMessage.js";
import { getAssignmentReason } from "~/domain/notifications/messages/getAssignmentReason.js";
import { ReviewStepReachedEventHandler } from "~/features/review/events.js";
import { NotificationRecipientService } from "~/features/notifications/NotificationRecipientService/abstractions.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/abstractions.js";

/**
 * Tells the owner of a reached step that it is theirs, or the pool that a step is waiting (R181,
 * R183). AI and automation owners are never told (D58). Catches everything (R182, R87).
 */
class ReviewStepReachedNotificationsImpl implements ReviewStepReachedEventHandler.Interface {
    public constructor(
        private notifier: ReviewNotifierService.Interface,
        private recipients: NotificationRecipientService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepReachedEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            if (fact.owner && fact.owner.type !== "user") {
                return;
            }

            const step = review.steps.find(item => item.id === fact.change.stepId);
            if (!step) {
                this.logger.error(
                    { reviewId: review.id, stepId: fact.change.stepId },
                    "Could not find the step for a workflow notification."
                );
                return;
            }

            if (fact.owner) {
                const recipients = dropActor(
                    [{ id: fact.owner.id, displayName: fact.owner.displayName }],
                    fact.actor
                );
                if (recipients.length === 0) {
                    return;
                }
                await this.notifier.notify({
                    review,
                    stepId: step.id,
                    event: "assigned",
                    recipients,
                    message: buildAssignedMessage({
                        contentTitle: review.title,
                        stepTitle: step.title,
                        reason: getAssignmentReason(
                            fact.assignment?.source,
                            getActorName(review.createdBy, step.title)
                        ),
                        reassignedBy: null
                    })
                });
                return;
            }

            const pool = await this.recipients.listPool({
                review,
                stepId: step.id,
                now: new Date(fact.occurredOn)
            });
            if (pool.isFail()) {
                // The recipient service wraps every lookup error: code and name only (R196).
                this.logger.error(
                    {
                        ...getErrorLogFields(pool.error),
                        reviewId: review.id,
                        stepId: step.id
                    },
                    "Could not list the members of the step's teams."
                );
                return;
            }
            const recipients = dropActor(pool.value, fact.actor);
            if (recipients.length === 0) {
                return;
            }
            await this.notifier.notify({
                review,
                stepId: step.id,
                event: "poolReached",
                recipients,
                message: buildPoolReachedMessage({
                    contentTitle: review.title,
                    stepTitle: step.title,
                    requester: getActorName(review.createdBy, step.title)
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

export const ReviewStepReachedNotifications = ReviewStepReachedEventHandler.createImplementation({
    implementation: ReviewStepReachedNotificationsImpl,
    dependencies: [ReviewNotifierService, NotificationRecipientService, Logger]
});
```

Create `packages/api-workflows/src/features/notifications/handlers/ReviewStepReassignedNotifications.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { dropActor } from "~/domain/notifications/dropActor.js";
import { getActorName } from "~/domain/notifications/getActorName.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { buildAssignedMessage } from "~/domain/notifications/messages/buildAssignedMessage.js";
import { buildReassignedMessage } from "~/domain/notifications/messages/buildReassignedMessage.js";
import { ReviewStepReassignedEventHandler } from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/abstractions.js";

/**
 * Tells the new owner of a reassigned step that it is theirs and the old owner (a user) that they
 * no longer own it (R181, R183). Catches everything (R182, R87).
 */
class ReviewStepReassignedNotificationsImpl implements ReviewStepReassignedEventHandler.Interface {
    public constructor(
        private notifier: ReviewNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepReassignedEventHandler.Event): Promise<void> {
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

            // The new owner. Every name goes through `getActorName` (R189a).
            if (fact.owner.type === "user") {
                const newOwners = dropActor(
                    [{ id: fact.owner.id, displayName: fact.owner.displayName }],
                    fact.actor
                );
                if (newOwners.length > 0) {
                    await this.notifier.notify({
                        review,
                        stepId: step.id,
                        event: "assigned",
                        recipients: newOwners,
                        message: buildAssignedMessage({
                            contentTitle: review.title,
                            stepTitle: step.title,
                            reason: null,
                            reassignedBy: getActorName(fact.actor, step.title)
                        })
                    });
                }
            }

            // The old owner, when it was a user (an awaiting step has none; AI and automation
            // owners are never told, D58).
            if (fact.previousOwner && fact.previousOwner.type === "user") {
                const oldOwners = dropActor(
                    [{ id: fact.previousOwner.id, displayName: fact.previousOwner.displayName }],
                    fact.actor
                );
                if (oldOwners.length > 0) {
                    await this.notifier.notify({
                        review,
                        stepId: step.id,
                        event: "reassigned",
                        recipients: oldOwners,
                        message: buildReassignedMessage({
                            contentTitle: review.title,
                            stepTitle: step.title,
                            operator: getActorName(fact.actor, step.title),
                            newOwner: getActorName(fact.owner, step.title)
                        })
                    });
                }
            }
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: fact.type },
                "A workflow notification handler failed."
            );
        }
    }
}

export const ReviewStepReassignedNotifications =
    ReviewStepReassignedEventHandler.createImplementation({
        implementation: ReviewStepReassignedNotificationsImpl,
        dependencies: [ReviewNotifierService, Logger]
    });
```

Create `packages/api-workflows/src/features/notifications/handlers/ReviewStepTakenOverNotifications.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { dropActor } from "~/domain/notifications/dropActor.js";
import { getActorName } from "~/domain/notifications/getActorName.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { buildTakenOverMessage } from "~/domain/notifications/messages/buildTakenOverMessage.js";
import { ReviewStepTakenOverEventHandler } from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/abstractions.js";

/**
 * Tells the previous owner of a step that somebody took it over (D111, R181, R183), unless the
 * taker opted out (`fact.notifyPreviousOwner`, R185) or the previous owner is an AI or an
 * automation. Catches everything (R182, R87).
 */
class ReviewStepTakenOverNotificationsImpl implements ReviewStepTakenOverEventHandler.Interface {
    public constructor(
        private notifier: ReviewNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepTakenOverEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            if (!fact.notifyPreviousOwner || fact.previousOwner.type !== "user") {
                return;
            }

            const step = review.steps.find(item => item.id === fact.change.stepId);
            if (!step) {
                this.logger.error(
                    { reviewId: review.id, stepId: fact.change.stepId },
                    "Could not find the step for a workflow notification."
                );
                return;
            }

            const recipients = dropActor(
                [{ id: fact.previousOwner.id, displayName: fact.previousOwner.displayName }],
                fact.actor
            );
            if (recipients.length === 0) {
                return;
            }
            await this.notifier.notify({
                review,
                stepId: step.id,
                event: "takenOver",
                recipients,
                message: buildTakenOverMessage({
                    contentTitle: review.title,
                    stepTitle: step.title,
                    taker: getActorName(fact.actor, step.title)
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

export const ReviewStepTakenOverNotifications =
    ReviewStepTakenOverEventHandler.createImplementation({
        implementation: ReviewStepTakenOverNotificationsImpl,
        dependencies: [ReviewNotifierService, Logger]
    });
```

None of the three files is registered yet: `ReviewNotificationsFeature` (Task 12) registers all seven handlers. The handler tests build them with `resolveImplementation`, the way Task 12 of phase 5 builds the step run handler.

- [ ] **Step 4: Run the tests to see them pass**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepReachedNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepReassignedNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepTakenOverNotifications.test.ts 2>&1 | tail -50`
Expected: PASS for each.

Run the same three with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code**

Nothing existing changes in this task (the handlers are not registered yet), so only the notifier tests that share the new helpers need a check:
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotifierService.test.ts 2>&1 | tail -50` and the same with `yarn test:os`.
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors in the touched packages. (If `resolveImplementation(...)` complains about the cast to the handler interface, cast through `unknown`.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `00-shared.md` in full, building each changed package (`@webiny/api-workflows`) with `--no-cache`, and restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`). If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-workflows): notify on step reached, reassigned and taken over" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```
