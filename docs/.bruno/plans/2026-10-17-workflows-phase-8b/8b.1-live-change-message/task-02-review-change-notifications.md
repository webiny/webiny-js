### Task 2: `ReviewChangeNotifierService` and the four handlers

Spec 12; D60, D132, D149, D160; R87, R146, R181, R182, R253, R254, R255; A94; Review Focus 3 (recipients are exactly R254's, other tenants get nothing, a failure is logged and not thrown) and Review Focus 5 (the acting user gets no change message). Every Global Constraint of 8a and 8b applies (read `../00-shared.md` and the 8a `00-shared.md` "Global Constraints" first; the admin rules R202-R243 do not apply to this API task). Task 1 must be committed: this task consumes `ReviewWebsocketSender`.

Four thin event handlers send the new silent websocket message `workflows.reviewChanged` (ids and namespace, no title, no body, no toast, R253) through one `ReviewChangeNotifierService`, which hands the frame to Task 1's sender. Each handler picks its recipients with the pure `getReviewChangeRecipients` (R254), calls the service and catches everything (R87): the saver publishes after the save and lets handler exceptions propagate, so a throw here would fail an action that already happened. The 7 notification handlers and the 8 notification events are untouched.

- **`getReviewChangeRecipients(review, actor)`** (R254). Pure. The ids of `review.createdBy.id` and `review.currentOwnerId`, in that order, each once, an empty or `null` id left out, minus the actor through `dropActor` when `actor.type === "user"` (an AI or automation actor carries the requester's id, D58, and never drops the requester).
- **`ReviewChangeNotifierService.notify({ review, stepId, kind, recipientIds })`**. No recipient id: returns at once. Otherwise builds `WorkflowReviewChangedWebsocketData { kind, reviewId, stepId, namespace: review.model, targetId, targetRevisionId }` and calls the sender with `event: kind`, `action: WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION`. An inline `try`/`catch` logs a rejecting sender once with `Could not send a workflow websocket notification.` and the code and name of the error, `reviewId`, `event`.
- **The four handlers** (`[AWF]/features/notifications/handlers/Review<Event>ChangeNotifications.ts`, each `<Event>Handler.createImplementation` with dependencies `[ReviewChangeNotifierService, Logger]`; a handler body is one `try`/`catch` that logs `A workflow notification handler failed.` with the code and name, `reviewId` and `event: fact.type`):
  - `ReviewRequestedChangeNotifications` (`ReviewRequestedEvent`): kind `requested`, `stepId: review.currentStepId`, recipients per R254.
  - `ReviewStepStartedChangeNotifications` (`ReviewStepStartedEvent`): kind `stepStarted`, `stepId: fact.change.stepId`.
  - `ReviewStepApprovedChangeNotifications` (`ReviewStepApprovedEvent`): kind `stepApproved`, `stepId: fact.change.stepId`; returns without calling the service unless `review.state === "inProgress"` (the final approval already sends the `approved` notification).
  - `ReviewStepRestartedChangeNotifications` (`ReviewStepRestartedEvent`): kind `stepRestarted`, `stepId: fact.change.stepId`.
  - A handler calls the service even when no recipient is left (`recipientIds: []`); the service ignores it.
- `ReviewNotificationsFeature` registers the service feature and the four handlers; its R181 comment is updated. `ReviewStepFailedEventHandler` keeps its one notification handler.
- **Existing tests that change** (named here, nothing else changes): `ReviewNotificationsFeature.test.ts` (the old "silent" list now has one handler each; the file is rewritten below), `notificationConstants.test.ts` (one constant added) and, in `ReviewNotificationsBackgroundTask.test.ts`, the pool-lookup test, whose frame count grows by the requester's change message (an automation approval does not drop the requester). `ReviewNotifications.test.ts` keeps every assertion: its websocket fake is replaced by `SplitWebsocketsSend`, which keeps `sent` to the notification frames only and records the change frames in `changes`.

**Files:**
- Modify: `packages/api-workflows/src/domain/notifications/constants.ts`
- Modify: `packages/api-workflows/src/domain/notifications/types.ts`
- Create: `packages/api-workflows/src/domain/notifications/getReviewChangeRecipients.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewChangeNotifierService/abstractions.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewChangeNotifierService/ReviewChangeNotifierService.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewChangeNotifierService/feature.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewChangeNotifierService/index.ts`
- Create: `packages/api-workflows/src/features/notifications/handlers/ReviewRequestedChangeNotifications.ts`
- Create: `packages/api-workflows/src/features/notifications/handlers/ReviewStepStartedChangeNotifications.ts`
- Create: `packages/api-workflows/src/features/notifications/handlers/ReviewStepApprovedChangeNotifications.ts`
- Create: `packages/api-workflows/src/features/notifications/handlers/ReviewStepRestartedChangeNotifications.ts`
- Modify: `packages/api-workflows/src/features/notifications/feature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/RecordingReviewChangeNotifier.ts`
- Create: `packages/api-workflows/__tests__/__helpers/changeNotificationReviews.ts`
- Create: `packages/api-workflows/__tests__/__helpers/SplitWebsocketsSend.ts`
- Create: `packages/api-workflows/__tests__/notifications/getReviewChangeRecipients.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewChangeNotifierService.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewRequestedChangeNotifications.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewStepStartedChangeNotifications.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewStepApprovedChangeNotifications.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewStepRestartedChangeNotifications.test.ts`
- Modify: `packages/api-workflows/__tests__/notifications/ReviewNotifications.test.ts`
- Modify: `packages/api-workflows/__tests__/notifications/ReviewNotificationsBackgroundTask.test.ts`
- Modify: `packages/api-workflows/__tests__/notifications/ReviewNotificationsFeature.test.ts`
- Modify: `packages/api-workflows/__tests__/notifications/notificationConstants.test.ts`

**Interfaces:**
- Consumes:
  - Task 1: `ReviewWebsocketSender` and `ReviewWebsocketSenderFeature` (`~/features/notifications/ReviewWebsocketSender/index.js`; `abstractions.js` inside the package), `RecordingReviewWebsocketSender` (`~tests/__helpers/RecordingReviewWebsocketSender.js`).
  - Existing (verified in the source): `dropActor` (`~/domain/notifications/dropActor.js`, `dropActor<T extends { id: string }>(recipients: T[], actor: Actor): T[]`), `getErrorLogFields` (`~/domain/notifications/getErrorLogFields.js`), `Actor`, `ReviewData` (`~/domain/review/types.js`), the facts `ReviewRequestedFact`, `ReviewStepStartedFact`, `ReviewStepApprovedFact`, `ReviewStepRestartedFact`, `ReviewStepFailedFact` (`~/domain/review/facts.js`; each has `actor: Actor`, the last four have `change: { stepId, fromState, toState }`), `ReviewRequestedEvent`/`ReviewRequestedEventHandler`, `ReviewStepStartedEvent`/`...Handler`, `ReviewStepApprovedEvent`/`...Handler`, `ReviewStepRestartedEvent`/`...Handler`, `ReviewStepFailedEvent`/`...Handler` (`~/features/review/events.js`; `handle(event)` reads `event.payload.review` and `event.payload.fact`), `Logger`.
  - Test helpers: `createContextHandler`, `captureLoggedErrors`, `loggedErrors`, `registerFaultyTenantContext`, `tenantFault`, `FakeWebsocketConnections`, `RecordingWebsocketsSend` and its `SentFrame`, `createNotificationReview` (`~tests/__helpers/notificationReviews.js`), `NOW`, `requester`, `reviewer`, `otherReviewer` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract):
  - `WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION = "workflows.reviewChanged"` (`~/domain/notifications/constants.js`); `WorkflowReviewChangedKind`, `WorkflowReviewChangedWebsocketData` (`~/domain/notifications/types.js`).
  - `getReviewChangeRecipients(review: ReviewData, actor: Actor): string[]` (`~/domain/notifications/getReviewChangeRecipients.js`).
  - `ReviewChangeNotifierService = createAbstraction<IReviewChangeNotifierService>("Workflows/ReviewChangeNotifierService")`, `notify(params: ReviewChangeNotifyParams): Promise<void>`, `ReviewChangeNotifyParams { review: ReviewData; stepId: string | null; kind: WorkflowReviewChangedKind; recipientIds: string[] }`; namespace `.Interface`, `.Params`. Exported with `ReviewChangeNotifierServiceFeature` from `~/features/notifications/ReviewChangeNotifierService/index.js`.
  - The four exported handler implementations, registered by `ReviewNotificationsFeature`.
  - Test helpers `RecordingReviewChangeNotifier` (`calls`, `mode`), `createChangeReview(currentOwnerId?)` (`~tests/__helpers/changeNotificationReviews.js`), `SplitWebsocketsSend` (`sent`, `changes`).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/RecordingReviewChangeNotifier.ts`:

```ts
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/index.js";

/**
 * Stands in for the change notifier in the handler tests: records every `notify` call (cloned),
 * and with `mode: "throw"` rejects, which the real service never does, to prove a handler
 * survives it. Register with `container.registerInstance(ReviewChangeNotifierService, notifier)`.
 */
export class RecordingReviewChangeNotifier implements ReviewChangeNotifierService.Interface {
    public readonly calls: ReviewChangeNotifierService.Params[] = [];
    public mode: "ok" | "throw" = "ok";

    public async notify(params: ReviewChangeNotifierService.Params): Promise<void> {
        this.calls.push(structuredClone(params));
        if (this.mode === "throw") {
            throw new Error("The change notifier crashed.");
        }
    }
}
```

Create `packages/api-workflows/__tests__/__helpers/changeNotificationReviews.ts`:

```ts
import type { ReviewData } from "~/domain/review/types.js";
import { reviewer } from "./fixtures.js";
import { createNotificationReview } from "./notificationReviews.js";

/**
 * The review of the change handler tests: "Article 1" requested by Rita Requester, its current
 * step "legal" `inReview` and owned by `currentOwnerId` (default Rob Reviewer, `null` for an
 * AI or automation owner, whose id is never stored in `currentOwnerId`). The fixture does not run
 * `prepareForSave`, so the three `current*` fields are set here, as a saved review has them. A
 * fresh copy on every call: tests may change it.
 */
export const createChangeReview = (currentOwnerId: string | null = reviewer.id): ReviewData => {
    const review = createNotificationReview();
    review.currentStepId = "legal";
    review.currentStepState = "inReview";
    review.currentOwnerId = currentOwnerId;
    return review;
};
```

Create `packages/api-workflows/__tests__/__helpers/SplitWebsocketsSend.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import {
    WebsocketsSendToConnectionsUseCase,
    type WebsocketsError
} from "@webiny/api-websockets/exports/api.js";
import { WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION } from "~/domain/notifications/constants.js";
import { RecordingWebsocketsSend, type SentFrame } from "./RecordingWebsocketsSend.js";

/**
 * `RecordingWebsocketsSend` that keeps the silent `workflows.reviewChanged` frames apart: `sent`
 * holds the notification frames only (so the phase 7 assertions on `sent` stay true) and `changes`
 * holds the change frames. A change frame is always answered with `Result.ok()`: `mode`, `onlyFor`
 * and `holdMs` apply to the notification frames. Register with
 * `container.registerInstance(WebsocketsSendToConnectionsUseCase, fake)`.
 */
export class SplitWebsocketsSend extends RecordingWebsocketsSend {
    public readonly changes: SentFrame[] = [];

    public override async execute<T extends GenericRecord = GenericRecord>(
        connections: WebsocketsSendToConnectionsUseCase.Connection[],
        data: WebsocketsSendToConnectionsUseCase.Data<T>
    ): Promise<Result<void, WebsocketsError>> {
        if (data.action !== WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION) {
            return super.execute(connections, data);
        }

        const message: WebsocketsSendToConnectionsUseCase.Data<GenericRecord> =
            structuredClone(data);
        this.changes.push({ connections: structuredClone(connections), message });
        return Result.ok();
    }
}
```

Create `packages/api-workflows/__tests__/notifications/getReviewChangeRecipients.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { requester, reviewer } from "~tests/__helpers/fixtures.js";
import { createChangeReview } from "~tests/__helpers/changeNotificationReviews.js";
import { getReviewChangeRecipients } from "~/domain/notifications/getReviewChangeRecipients.js";
import type { Actor } from "~/domain/review/types.js";

const OTHER: Actor = { type: "user", id: "user-other", displayName: "Olga Other" };
const AI: Actor = { type: "ai", id: requester.id, displayName: "AI check" };
const AUTOMATION: Actor = { type: "automation", id: requester.id, displayName: "Link checker" };

describe("getReviewChangeRecipients (R254)", () => {
    it("returns the requester and the current owner, requester first", () => {
        expect(getReviewChangeRecipients(createChangeReview(), OTHER)).toEqual([
            "user-requester",
            "user-reviewer"
        ]);
    });

    it("returns the requester alone when no user owns the step", () => {
        expect(getReviewChangeRecipients(createChangeReview(null), OTHER)).toEqual([
            "user-requester"
        ]);
    });

    it("returns a person once when the requester owns the step", () => {
        const review = createChangeReview(requester.id);

        expect(getReviewChangeRecipients(review, OTHER)).toEqual(["user-requester"]);
    });

    it("drops the actor when the actor is the requester as a user", () => {
        expect(getReviewChangeRecipients(createChangeReview(), requester)).toEqual([
            "user-reviewer"
        ]);
    });

    it("drops the actor when the actor is the owner as a user", () => {
        expect(getReviewChangeRecipients(createChangeReview(), reviewer)).toEqual([
            "user-requester"
        ]);
    });

    it("returns nobody when the one person is also the acting user", () => {
        const review = createChangeReview(requester.id);

        expect(getReviewChangeRecipients(review, requester)).toEqual([]);
    });

    it("keeps a user who is neither the requester nor the owner out of the list", () => {
        const recipients = getReviewChangeRecipients(createChangeReview(), OTHER);

        expect(recipients).not.toContain(OTHER.id);
    });

    it.each([
        { name: "an AI", actor: AI },
        { name: "an automation", actor: AUTOMATION }
    ])("keeps the requester when $name acts, because it carries the requester's id (D58)", ({ actor }) => {
        expect(getReviewChangeRecipients(createChangeReview(), actor)).toEqual([
            "user-requester",
            "user-reviewer"
        ]);
    });

    it("never returns an empty id", () => {
        const review = createChangeReview("");
        review.createdBy.id = "";

        expect(getReviewChangeRecipients(review, OTHER)).toEqual([]);
    });

    it("does not change the review", () => {
        const review = createChangeReview();
        const before = structuredClone(review);

        getReviewChangeRecipients(review, requester);

        expect(review).toEqual(before);
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ReviewChangeNotifierService.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { registerFaultyTenantContext, tenantFault } from "~tests/__helpers/FaultyTenantContext.js";
import { FakeWebsocketConnections } from "~tests/__helpers/FakeWebsocketConnections.js";
import { RecordingWebsocketsSend } from "~tests/__helpers/RecordingWebsocketsSend.js";
import { RecordingReviewWebsocketSender } from "~tests/__helpers/RecordingReviewWebsocketSender.js";
import { createChangeReview } from "~tests/__helpers/changeNotificationReviews.js";
import { WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION } from "~/domain/notifications/constants.js";
import type { WorkflowReviewChangedKind } from "~/domain/notifications/types.js";
import {
    ReviewChangeNotifierService,
    ReviewChangeNotifierServiceFeature
} from "~/features/notifications/ReviewChangeNotifierService/index.js";
import {
    ReviewWebsocketSender,
    ReviewWebsocketSenderFeature
} from "~/features/notifications/ReviewWebsocketSender/index.js";

const SECRET = "SECRET-TOKEN-4711";
const WEBSOCKET_TEXT = "Could not send a workflow websocket notification.";
const ANNA = "user-anna";
const BOB = "user-bob";

const KINDS: WorkflowReviewChangedKind[] = [
    "requested",
    "stepStarted",
    "stepApproved",
    "stepRestarted"
];

interface SetupParams {
    sender?: ReviewWebsocketSender.Interface;
}

const setup = async (params: SetupParams = {}) => {
    const connections = new FakeWebsocketConnections();
    const sends = new RecordingWebsocketsSend();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            registerFaultyTenantContext(container);
            container.registerInstance(WebsocketsListConnectionsUseCase, connections);
            container.registerInstance(WebsocketsSendToConnectionsUseCase, sends);
            ReviewWebsocketSenderFeature.register(container);
            ReviewChangeNotifierServiceFeature.register(container);
            if (params.sender) {
                container.registerInstance(ReviewWebsocketSender, params.sender);
            }
        }
    });
    const notifier = context.container.resolve(ReviewChangeNotifierService);
    const tenantId = context.container.resolve(TenantContext).getTenant().id;

    return {
        connections,
        sends,
        tenantId,
        notify: (overrides: Partial<ReviewChangeNotifierService.Params> = {}): Promise<void> => {
            return notifier.notify({
                review: createChangeReview(),
                stepId: "legal",
                kind: "stepStarted",
                recipientIds: [ANNA],
                ...overrides
            });
        }
    };
};

describe("ReviewChangeNotifierService (R253, R254, D149)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
        tenantFault.mode = "none";
    });

    afterEach(() => {
        tenantFault.mode = "none";
    });

    describe("the frame (R253)", () => {
        it("sends one frame with the change action and exactly the six ids-and-namespace fields", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await notify();

            expect(sends.sent).toEqual([
                {
                    connections: [{ connectionId: "conn-anna", endpoint: "wss://websockets.test" }],
                    message: {
                        action: WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION,
                        data: {
                            kind: "stepStarted",
                            reviewId: "review-1",
                            stepId: "legal",
                            namespace: "cms.article",
                            targetId: "article-1",
                            targetRevisionId: "article-1#0001"
                        }
                    }
                }
            ]);
            expect(Object.keys(sends.sent[0].message.data ?? {}).sort()).toEqual([
                "kind",
                "namespace",
                "reviewId",
                "stepId",
                "targetId",
                "targetRevisionId"
            ]);
        });

        it("carries no title, no body and no event: ids and namespace only (R200)", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await notify();

            const keys = Object.keys(sends.sent[0].message.data ?? {});
            expect(keys).not.toContain("title");
            expect(keys).not.toContain("body");
            expect(keys).not.toContain("event");
        });

        it("carries a null step id", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await notify({ stepId: null });

            expect(sends.sent[0].message.data).toMatchObject({ stepId: null });
        });

        it.each(KINDS)("carries the kind %s", async kind => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await notify({ kind });

            expect(sends.sent[0].message.data).toMatchObject({ kind });
        });
    });

    describe("what it hands the sender (R255)", () => {
        it("calls the sender once with the kind as the event, the recipient ids, the change action and the frame data", async () => {
            const sender = new RecordingReviewWebsocketSender();
            const { notify } = await setup({ sender });

            await notify({ kind: "stepRestarted", recipientIds: [ANNA, BOB] });

            expect(sender.calls).toEqual([
                {
                    reviewId: "review-1",
                    event: "stepRestarted",
                    recipientIds: [ANNA, BOB],
                    action: WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION,
                    data: {
                        kind: "stepRestarted",
                        reviewId: "review-1",
                        stepId: "legal",
                        namespace: "cms.article",
                        targetId: "article-1",
                        targetRevisionId: "article-1#0001"
                    }
                }
            ]);
        });

        it("does not call the sender without recipients", async () => {
            const sender = new RecordingReviewWebsocketSender();
            const { notify } = await setup({ sender });

            await notify({ recipientIds: [] });

            expect(sender.calls).toEqual([]);
        });
    });

    describe("recipients and tenant (R254, D149)", () => {
        it("sends only to the recipients, one frame each", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect(ANNA, tenantId, "conn-anna")
                .connect(BOB, tenantId, "conn-bob")
                .connect("user-dan", tenantId, "conn-dan");

            await notify({ recipientIds: [ANNA, BOB] });

            const frames = sends.sent
                .map(frame => frame.connections.map(item => item.connectionId))
                .sort((a, b) => a[0].localeCompare(b[0]));
            expect(frames).toEqual([["conn-anna"], ["conn-bob"]]);
        });

        it("sends nothing to the same user connected only in another tenant, and logs nothing", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect(ANNA, "another-tenant", "conn-other-tenant")
                .connect(BOB, tenantId, "conn-bob");

            await notify({ recipientIds: [ANNA, BOB] });

            expect(sends.sent.map(frame => frame.connections[0].connectionId)).toEqual([
                "conn-bob"
            ]);
            expect(loggedErrors).toEqual([]);
        });

        it("makes no connection call without recipients", async () => {
            const { notify, connections, sends } = await setup();

            await notify({ recipientIds: [] });

            expect(connections.calls).toEqual([]);
            expect(sends.sent).toEqual([]);
        });

        it("sends nothing and logs once when there is no current tenant", async () => {
            const { notify, connections, sends } = await setup();
            connections.connect(ANNA, "root", "conn-anna");
            tenantFault.mode = "missing";

            await expect(notify({ recipientIds: [ANNA, BOB] })).resolves.toBeUndefined();

            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toEqual({
                reviewId: "review-1",
                event: "stepStarted"
            });
        });
    });

    describe("failures never reject (R87, R196)", () => {
        it("a throwing connection list is logged once and the other recipient still gets the frame", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna").connect(BOB, tenantId, "conn-bob");
            connections.mode = "throw";
            connections.onlyFor = ANNA;
            connections.failureMessage = `The list crashed ${SECRET}.`;

            await expect(notify({ recipientIds: [ANNA, BOB] })).resolves.toBeUndefined();

            expect(sends.sent.map(frame => frame.connections[0].connectionId)).toEqual([
                "conn-bob"
            ]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toMatchObject({
                reviewId: "review-1",
                event: "stepStarted",
                recipientId: ANNA
            });
        });

        it("a failed send is logged once with the error code and name", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");
            sends.mode = "fail";

            await expect(notify()).resolves.toBeUndefined();

            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toMatchObject({
                errorCode: "Websocket/Service",
                errorName: "Error",
                recipientId: ANNA
            });
        });

        it("a sender that rejects is logged once with code and name only, never the message", async () => {
            const sender = new RecordingReviewWebsocketSender();
            sender.mode = "throw";
            const { notify } = await setup({ sender });

            await expect(notify({ kind: "requested" })).resolves.toBeUndefined();

            expect(loggedErrors).toEqual([
                {
                    message: WEBSOCKET_TEXT,
                    fields: { errorName: "Error", reviewId: "review-1", event: "requested" }
                }
            ]);
        });
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ReviewRequestedChangeNotifications.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewChangeNotifier } from "~tests/__helpers/RecordingReviewChangeNotifier.js";
import { createChangeReview } from "~tests/__helpers/changeNotificationReviews.js";
import { NOW, otherReviewer, requester } from "~tests/__helpers/fixtures.js";
import type { ReviewRequestedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewRequestedEvent,
    type ReviewRequestedEventHandler
} from "~/features/review/events.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/index.js";
import { ReviewRequestedChangeNotifications } from "~/features/notifications/handlers/ReviewRequestedChangeNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";
const AI_ACTOR: Actor = { type: "ai", id: requester.id, displayName: "AI check" };

const createFact = (overrides: Partial<ReviewRequestedFact> = {}): ReviewRequestedFact => {
    return { type: "requested", occurredOn: NOW, actor: requester, ...overrides };
};

const setup = async () => {
    const notifier = new RecordingReviewChangeNotifier();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(ReviewChangeNotifierService, notifier);
        }
    });
    const handler = context.container.resolveImplementation(
        ReviewRequestedChangeNotifications
    ) as ReviewRequestedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewRequestedFact): Promise<void> => {
            return handler.handle(new ReviewRequestedEvent({ review, fact }));
        }
    };
};

describe("ReviewRequestedChangeNotifications (R253, R254)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the current owner, not the requester who acted, that the review was requested", async () => {
        const { handle, notifier } = await setup();
        const review = createChangeReview();

        await handle(review, createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.kind).toBe("requested");
        expect(call.stepId).toBe("legal");
        expect(call.recipientIds).toEqual(["user-reviewer"]);
        expect(call.review).toEqual(review);
    });

    it("tells the requester too when another user requested it", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(), createFact({ actor: otherReviewer }));

        expect(notifier.calls[0].recipientIds).toEqual(["user-requester", "user-reviewer"]);
    });

    it("hands the notifier no recipient when the requester acts and no user owns the step", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(null), createFact());

        expect(notifier.calls).toHaveLength(1);
        expect(notifier.calls[0].recipientIds).toEqual([]);
    });

    it("keeps the requester when an AI is the actor, because it carries the requester's id (D58)", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(null), createFact({ actor: AI_ACTOR }));

        expect(notifier.calls[0].recipientIds).toEqual(["user-requester"]);
    });

    it("sends a null step when the review has no current step", async () => {
        const { handle, notifier } = await setup();
        const review = createChangeReview();
        review.currentStepId = null;

        await handle(review, createFact());

        expect(notifier.calls[0].stepId).toBeNull();
    });

    it("survives a notifier that throws (R87)", async () => {
        const { handle, notifier } = await setup();
        notifier.mode = "throw";

        await expect(handle(createChangeReview(), createFact())).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([
            {
                message: HANDLER_FAILED,
                fields: { errorName: "Error", reviewId: "review-1", event: "requested" }
            }
        ]);
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ReviewStepStartedChangeNotifications.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewChangeNotifier } from "~tests/__helpers/RecordingReviewChangeNotifier.js";
import { createChangeReview } from "~tests/__helpers/changeNotificationReviews.js";
import { NOW, otherReviewer, reviewer } from "~tests/__helpers/fixtures.js";
import type { ReviewStepStartedFact } from "~/domain/review/facts.js";
import type { ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepStartedEvent,
    type ReviewStepStartedEventHandler
} from "~/features/review/events.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/index.js";
import { ReviewStepStartedChangeNotifications } from "~/features/notifications/handlers/ReviewStepStartedChangeNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";
const createFact = (overrides: Partial<ReviewStepStartedFact> = {}): ReviewStepStartedFact => {
    return {
        type: "stepStarted",
        occurredOn: NOW,
        actor: reviewer,
        change: { stepId: "legal", fromState: "awaiting", toState: "inReview" },
        records: [],
        ...overrides
    };
};

const setup = async () => {
    const notifier = new RecordingReviewChangeNotifier();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(ReviewChangeNotifierService, notifier);
        }
    });
    const handler = context.container.resolveImplementation(
        ReviewStepStartedChangeNotifications
    ) as ReviewStepStartedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewStepStartedFact): Promise<void> => {
            return handler.handle(new ReviewStepStartedEvent({ review, fact }));
        }
    };
};

describe("ReviewStepStartedChangeNotifications (R253, R254)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the requester, not the user who started the step and now owns it", async () => {
        const { handle, notifier } = await setup();
        const review = createChangeReview();

        await handle(review, createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.kind).toBe("stepStarted");
        expect(call.stepId).toBe("legal");
        expect(call.recipientIds).toEqual(["user-requester"]);
        expect(call.review).toEqual(review);
    });

    it("tells the owner too when another user acted", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(), createFact({ actor: otherReviewer }));

        expect(notifier.calls[0].recipientIds).toEqual(["user-requester", "user-reviewer"]);
    });

    it("uses the step of the fact, not the review's current step", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createChangeReview(),
            createFact({ change: { stepId: "editorial", fromState: "awaiting", toState: "inReview" } })
        );

        expect(notifier.calls[0].stepId).toBe("editorial");
    });

    it("survives a notifier that throws (R87)", async () => {
        const { handle, notifier } = await setup();
        notifier.mode = "throw";

        await expect(handle(createChangeReview(), createFact())).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([
            {
                message: HANDLER_FAILED,
                fields: { errorName: "Error", reviewId: "review-1", event: "stepStarted" }
            }
        ]);
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ReviewStepApprovedChangeNotifications.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewChangeNotifier } from "~tests/__helpers/RecordingReviewChangeNotifier.js";
import { createChangeReview } from "~tests/__helpers/changeNotificationReviews.js";
import { NOW, otherReviewer, requester, reviewer } from "~tests/__helpers/fixtures.js";
import type { ReviewStepApprovedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepApprovedEvent,
    type ReviewStepApprovedEventHandler
} from "~/features/review/events.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/index.js";
import { ReviewStepApprovedChangeNotifications } from "~/features/notifications/handlers/ReviewStepApprovedChangeNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";
const AUTOMATION_ACTOR: Actor = {
    type: "automation",
    id: requester.id,
    displayName: "Link checker"
};

const createFact = (overrides: Partial<ReviewStepApprovedFact> = {}): ReviewStepApprovedFact => {
    return {
        type: "stepApproved",
        occurredOn: NOW,
        actor: reviewer,
        change: { stepId: "legal", fromState: "inReview", toState: "approved" },
        comment: null,
        ...overrides
    };
};

/** The saved review after an intermediate approval: the next step belongs to Olga Reviewer. */
const createNextOwnerReview = (): ReviewData => {
    const review = createChangeReview(otherReviewer.id);
    review.currentStepId = "editorial";
    return review;
};

const setup = async () => {
    const notifier = new RecordingReviewChangeNotifier();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(ReviewChangeNotifierService, notifier);
        }
    });
    const handler = context.container.resolveImplementation(
        ReviewStepApprovedChangeNotifications
    ) as ReviewStepApprovedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewStepApprovedFact): Promise<void> => {
            return handler.handle(new ReviewStepApprovedEvent({ review, fact }));
        }
    };
};

describe("ReviewStepApprovedChangeNotifications (R253, R254)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the requester and the next owner when a step is approved and the review goes on", async () => {
        const { handle, notifier } = await setup();
        const review = createNextOwnerReview();

        await handle(review, createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.kind).toBe("stepApproved");
        expect(call.stepId).toBe("legal");
        expect(call.recipientIds).toEqual(["user-requester", "user-other-reviewer"]);
        expect(call.review).toEqual(review);
    });

    it("does not tell the approver, even when the approver owns the saved step", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(), createFact());

        expect(notifier.calls[0].recipientIds).toEqual(["user-requester"]);
    });

    it("does not tell the requester who approves", async () => {
        const { handle, notifier } = await setup();

        await handle(createNextOwnerReview(), createFact({ actor: requester }));

        expect(notifier.calls[0].recipientIds).toEqual(["user-other-reviewer"]);
    });

    it("keeps the requester when an automation approves, because it carries the requester's id (D58)", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(null), createFact({ actor: AUTOMATION_ACTOR }));

        expect(notifier.calls[0].recipientIds).toEqual(["user-requester"]);
    });

    it.each(["approved", "rejected", "cancelled"] as const)(
        "sends nothing when the review is %s: the final approval already sends the approved notification",
        async state => {
            const { handle, notifier } = await setup();
            const review = createNextOwnerReview();
            review.state = state;

            await handle(review, createFact());

            expect(notifier.calls).toEqual([]);
            expect(loggedErrors).toEqual([]);
        }
    );

    it("survives a notifier that throws (R87)", async () => {
        const { handle, notifier } = await setup();
        notifier.mode = "throw";

        await expect(handle(createNextOwnerReview(), createFact())).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([
            {
                message: HANDLER_FAILED,
                fields: { errorName: "Error", reviewId: "review-1", event: "stepApproved" }
            }
        ]);
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ReviewStepRestartedChangeNotifications.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewChangeNotifier } from "~tests/__helpers/RecordingReviewChangeNotifier.js";
import { createChangeReview } from "~tests/__helpers/changeNotificationReviews.js";
import { NOW, requester } from "~tests/__helpers/fixtures.js";
import type { ReviewStepRestartedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepRestartedEvent,
    type ReviewStepRestartedEventHandler
} from "~/features/review/events.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/index.js";
import { ReviewStepRestartedChangeNotifications } from "~/features/notifications/handlers/ReviewStepRestartedChangeNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";
/** A user with `workflows.reassign`: the wrapper checked it, the engine only records it (D132). */
const MANAGER: Actor = { type: "user", id: "user-manager", displayName: "Mona Manager" };

const createFact = (overrides: Partial<ReviewStepRestartedFact> = {}): ReviewStepRestartedFact => {
    return {
        type: "stepRestarted",
        occurredOn: NOW,
        actor: MANAGER,
        change: { stepId: "legal", fromState: "failed", toState: "pending" },
        previousTaskId: "task-1",
        ...overrides
    };
};

const setup = async () => {
    const notifier = new RecordingReviewChangeNotifier();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(ReviewChangeNotifierService, notifier);
        }
    });
    const handler = context.container.resolveImplementation(
        ReviewStepRestartedChangeNotifications
    ) as ReviewStepRestartedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewStepRestartedFact): Promise<void> => {
            return handler.handle(new ReviewStepRestartedEvent({ review, fact }));
        }
    };
};

describe("ReviewStepRestartedChangeNotifications (R253, R254)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the requester when an operator restarts a step that no user owns", async () => {
        const { handle, notifier } = await setup();
        const review = createChangeReview(null);

        await handle(review, createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.kind).toBe("stepRestarted");
        expect(call.stepId).toBe("legal");
        expect(call.recipientIds).toEqual(["user-requester"]);
        expect(call.review).toEqual(review);
    });

    it("hands the notifier no recipient when the requester restarts it and no user owns the step", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(null), createFact({ actor: requester }));

        expect(notifier.calls).toHaveLength(1);
        expect(notifier.calls[0].recipientIds).toEqual([]);
    });

    it("tells the current user owner too", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(), createFact());

        expect(notifier.calls[0].recipientIds).toEqual(["user-requester", "user-reviewer"]);
    });

    it("uses the step of the fact", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createChangeReview(null),
            createFact({ change: { stepId: "editorial", fromState: "failed", toState: "pending" } })
        );

        expect(notifier.calls[0].stepId).toBe("editorial");
    });

    it("survives a notifier that throws (R87)", async () => {
        const { handle, notifier } = await setup();
        notifier.mode = "throw";

        await expect(handle(createChangeReview(null), createFact())).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([
            {
                message: HANDLER_FAILED,
                fields: { errorName: "Error", reviewId: "review-1", event: "stepRestarted" }
            }
        ]);
    });
});
```

Replace the whole of `packages/api-workflows/__tests__/notifications/ReviewNotificationsFeature.test.ts` with (it keeps Task 1's sender line):

```ts
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
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/index.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewTargetLink } from "~/features/notifications/ReviewTargetLink/index.js";
import { ReviewTargetLinkService } from "~/features/notifications/ReviewTargetLinkService/index.js";
import { ReviewWebsocketSender } from "~/features/notifications/ReviewWebsocketSender/index.js";
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/index.js";

/** One notification handler each (R181). */
const NOTIFYING: Abstraction<any>[] = [
    ReviewStepReachedEventHandler,
    ReviewStepReassignedEventHandler,
    ReviewStepTakenOverEventHandler,
    ReviewStepRejectedEventHandler,
    ReviewStepFailedEventHandler,
    ReviewApprovedEventHandler,
    ReviewCancelledEventHandler
];

/** One change-message handler each and no notification handler (R181, R253). */
const CHANGE_ONLY: Abstraction<any>[] = [
    ReviewRequestedEventHandler,
    ReviewStepStartedEventHandler,
    ReviewStepApprovedEventHandler,
    ReviewStepRestartedEventHandler
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

        for (const abstraction of NOTIFYING) {
            expect(context.container.resolveAll(abstraction)).toHaveLength(1);
        }
    });

    it("registers one change-message handler for requested, started, intermediate approvals and restarts, and no notification handler (R181, R253)", async () => {
        const { context } = await createContextHandler();

        for (const abstraction of CHANGE_ONLY) {
            expect(context.container.resolveAll(abstraction)).toHaveLength(1);
        }
    });

    it("registers nothing without the advancedPublishingWorkflow license", async () => {
        const license = createTestWcpLicense();
        license.package.features[PROJECT_PACKAGE_FEATURE_NAME.APW] = { enabled: false };
        const { context } = await createContextHandler({ testProjectLicense: license });

        expect(context.container.resolveAll(ReviewNotifierService)).toHaveLength(0);
        expect(context.container.resolveAll(ReviewWebsocketSender)).toHaveLength(0);
        expect(context.container.resolveAll(ReviewChangeNotifierService)).toHaveLength(0);
        for (const abstraction of [...NOTIFYING, ...CHANGE_ONLY]) {
            expect(context.container.resolveAll(abstraction)).toHaveLength(0);
        }
    });
});
```

Modify `packages/api-workflows/__tests__/notifications/notificationConstants.test.ts` (two hunks). Replace

```ts
    NOTIFICATION_SEND_CONCURRENCY,
    WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION
} from "~/domain/notifications/constants.js";
```

with

```ts
    NOTIFICATION_SEND_CONCURRENCY,
    WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION,
    WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION
} from "~/domain/notifications/constants.js";
```

and replace

```ts
        expect(WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION).toBe("workflows.notification");
```

with

```ts
        expect(WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION).toBe("workflows.notification");
        expect(WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION).toBe("workflows.reviewChanged");
```

Modify `packages/api-workflows/__tests__/notifications/ReviewNotifications.test.ts` (seven hunks).

Hunk 1, the websocket fake. Replace

```ts
import { RecordingWebsocketsSend } from "~tests/__helpers/RecordingWebsocketsSend.js";
```

with

```ts
import { SplitWebsocketsSend } from "~tests/__helpers/SplitWebsocketsSend.js";
```

Hunk 2, the constant. Replace

```ts
import { Review } from "~/domain/review/Review.js";
```

with

```ts
import { WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION } from "~/domain/notifications/constants.js";
import { Review } from "~/domain/review/Review.js";
```

Hunk 3, the fake in `setup`. Replace

```ts
    const sends = new RecordingWebsocketsSend();
```

with

```ts
    const sends = new SplitWebsocketsSend();
```

Hunk 4, `clear` forgets the change frames. Replace

```ts
            sends.sent.length = 0;
            mailer.sent.length = 0;
            chat.sent.length = 0;
```

with

```ts
            sends.sent.length = 0;
            sends.changes.length = 0;
            mailer.sent.length = 0;
            chat.sent.length = 0;
```

Hunk 5, the change-frame users next to `frameUsers`. Replace

```ts
        read: async (reviewId: string): Promise<ReviewData> => {
            return expectOk(await repository.get(reviewId));
        }
```

with

```ts
        /** The user ids that received a change frame (`workflows.reviewChanged`), sorted. */
        changeUsers: (): string[] => {
            return sends.changes
                .flatMap(frame => frame.connections.map(connection => connection.connectionId))
                .map(connectionId => connectionId.split(":")[0])
                .sort();
        },
        read: async (reviewId: string): Promise<ReviewData> => {
            return expectOk(await repository.get(reviewId));
        }
```

Hunk 6, the new cases, before the failure block. Replace the line

```ts
    describe("a failing mailer or websocket never fails the review action (R87, R196)", () => {
```

with

```ts
    describe("live change messages (R253, R254)", () => {
        const CHANGE_KEYS = [
            "kind",
            "namespace",
            "reviewId",
            "stepId",
            "targetId",
            "targetRevisionId"
        ];

        it("tells the picked owner, not the requester who acts, when a review is requested", async () => {
            const { request, connectAll, clear, sends, changeUsers } = await setup();
            allowReaders();
            connectAll();
            clear();
            const picks: ReviewPick[] = [{ stepId: "legal", userId: "user-bob" }];

            const review = expectOk(await request.execute(createRequestInput({ picks })));

            expect(workflowEventTypes()).toContain("Workflows/Review/Requested");
            expect(changeUsers()).toEqual(["user-bob"]);
            expect(sends.changes[0].message.action).toBe(WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION);
            expect(sends.changes[0].message.data).toEqual({
                kind: "requested",
                reviewId: review.id,
                stepId: "legal",
                namespace: ARTICLE_MODEL,
                targetId: "article-1",
                targetRevisionId: "article-1#0001"
            });
            expect(Object.keys(sends.changes[0].message.data ?? {}).sort()).toEqual(CHANGE_KEYS);
        });

        it("sends no change message when a review is requested into the pool, because the requester is the actor", async () => {
            const { request, connectAll, clear, sends, frameUsers } = await setup();
            allowReaders();
            connectAll();
            clear();

            expectOk(await request.execute(createRequestInput()));

            expect(sends.changes).toEqual([]);
            // The pool still gets its notification: the change message is a second, separate frame.
            expect(frameUsers()).toEqual(["user-anna", "user-bob", "user-cara"]);
        });

        it("tells the requester, not the user who starts a pool step", async () => {
            const { request, start, connectAll, clear, sends, changeUsers } = await setup();
            allowReaders();
            connectAll();
            const review = expectOk(await request.execute(createRequestInput()));
            clear();

            expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));

            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepStarted"]);
            expect(changeUsers()).toEqual(["user-requester"]);
            expect(sends.changes[0].message.data).toEqual({
                kind: "stepStarted",
                reviewId: review.id,
                stepId: "legal",
                namespace: ARTICLE_MODEL,
                targetId: "article-1",
                targetRevisionId: "article-1#0001"
            });
        });

        it("tells the requester and the next owner, not the approver, when a middle step is approved", async () => {
            const { request, start, approve, connectAll, clear, sends, changeUsers, frameUsers } =
                await setup();
            allowReaders();
            connectAll();
            const picks: ReviewPick[] = [{ stepId: "editorial", userId: "user-bob" }];
            const review = expectOk(await request.execute(createRequestInput({ picks })));
            expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));
            clear();

            expectOk(await approve.execute(actorInput(review.id, "legal", ANNA)));

            expect(changeUsers()).toEqual(["user-bob", "user-requester"]);
            for (const frame of sends.changes) {
                expect(frame.message.data).toMatchObject({
                    kind: "stepApproved",
                    reviewId: review.id,
                    stepId: "legal"
                });
            }
            // The next owner still gets the `assigned` notification, a separate frame.
            expect(frameUsers()).toEqual(["user-bob"]);
        });

        it("sends no change message for the final approval, which already sends the approved notification", async () => {
            const { request, start, approve, connectAll, clear, sends, frameUsers } =
                await setup();
            allowReaders();
            connectAll();
            const picks: ReviewPick[] = [{ stepId: "editorial", userId: "user-bob" }];
            const review = expectOk(await request.execute(createRequestInput({ picks })));
            expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));
            expectOk(await approve.execute(actorInput(review.id, "legal", ANNA)));
            clear();

            expectOk(await approve.execute(actorInput(review.id, "editorial", BOB)));

            expect(workflowEventTypes()).toEqual([
                "Workflows/Review/StepApproved",
                "Workflows/Review/Approved"
            ]);
            expect(sends.changes).toEqual([]);
            expect(frameUsers()).toEqual(["user-requester"]);
        });

        it("tells the requester when an operator restarts a failed step", async () => {
            const { repository, restart, connectAll, clear, sends, changeUsers } = await setup();
            connectAll();
            expectOk(
                await repository.save(toSaveData(createFailedAutomationReview(FAILURE_REASON)))
            );
            clear();

            expectOk(
                await restart.execute({
                    reviewId: "review-1",
                    stepId: AUTOMATION_STEP_ID,
                    actor: MANAGER
                })
            );

            expect(workflowEventTypes()).toContain("Workflows/Review/StepRestarted");
            expect(changeUsers()).toEqual(["user-requester"]);
            expect(sends.changes[0].message.data).toMatchObject({
                kind: "stepRestarted",
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID
            });
        });

        it("sends no change message when the requester restarts the step, because the requester is the actor", async () => {
            const { repository, restart, connectAll, clear, sends } = await setup();
            connectAll();
            expectOk(
                await repository.save(toSaveData(createFailedAutomationReview(FAILURE_REASON)))
            );
            clear();

            expectOk(
                await restart.execute({
                    reviewId: "review-1",
                    stepId: AUTOMATION_STEP_ID,
                    actor: requester
                })
            );

            expect(sends.changes).toEqual([]);
        });

        it("sends the requester the failed notification and no second change message when a step fails", async () => {
            const { repository, saver, connectAll, clear, sends, frameUsers } = await setup();
            connectAll();
            expectOk(await repository.save(toSaveData(createRunningAutomationReview("task-1"))));
            clear();

            const review = Review.fromData(expectOk(await repository.get("review-1")));
            expectOk(
                review.fail({ stepId: AUTOMATION_STEP_ID, reason: FAILURE_REASON, now: LATER })
            );
            expectOk(await saver.save(review));

            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
            expect(frameUsers()).toEqual(["user-requester"]);
            // The step is owned by the automation, not by a user: nobody else is a participant.
            expect(sends.changes).toEqual([]);
        });

        it("sends nothing to a recipient connected only in another tenant, and logs nothing", async () => {
            const { request, connections, clear, sends } = await setup();
            allowReaders();
            connections.connect("user-bob", "tenant-elsewhere", "conn-bob-elsewhere");
            clear();
            const picks: ReviewPick[] = [{ stepId: "legal", userId: "user-bob" }];

            expectOk(await request.execute(createRequestInput({ picks })));

            expect(sends.changes).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("never fails the review action when the connection list throws, and logs once", async () => {
            const { request, start, connectAll, connections, clear, sends, read } = await setup();
            allowReaders();
            connectAll();
            const review = expectOk(await request.execute(createRequestInput()));
            clear();
            connections.mode = "throw";
            connections.failureMessage = SECRET;

            const result = await start.execute(actorInput(review.id, "legal", ANNA));

            expect(result.isOk()).toBe(true);
            expect((await read(review.id)).currentOwnerId).toBe("user-anna");
            expect(sends.changes).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_FAILED);
        });
    });

    describe("a failing mailer or websocket never fails the review action (R87, R196)", () => {
```

Hunk 7, two titles that are half true now (a change frame is sent). Replace

```ts
        it("sends nothing when a pool step is started", async () => {
```

with

```ts
        it("sends no notification when a pool step is started", async () => {
```

and replace

```ts
        it("sends nothing when a failed step is restarted", async () => {
```

with

```ts
        it("sends no notification when a failed step is restarted", async () => {
```

Modify `packages/api-workflows/__tests__/notifications/ReviewNotificationsBackgroundTask.test.ts` (two hunks). Replace

```ts
import { Review } from "~/domain/review/Review.js";
```

with

```ts
import {
    WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION,
    WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION
} from "~/domain/notifications/constants.js";
import { Review } from "~/domain/review/Review.js";
```

and, in the test "runs the pool lookups inside the step run when the next step is a pool step, all without authorization", replace

```ts
        // The pool is told, the requester is not (an intermediate approve sends nothing).
        expect(sends.sent).toHaveLength(1);
        expect(sends.sent[0].connections.map(connection => connection.connectionId)).toEqual([
            "conn-anna-a"
        ]);
        expect(sends.sent[0].message.data).toMatchObject({
            event: "poolReached",
            stepId: "editorial"
        });
```

with

```ts
        // The pool is told with a notification. The requester gets the silent change message
        // (R253): the automation actor never drops the requester (R254, D58).
        const notifications = sends.sent.filter(
            frame => frame.message.action === WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION
        );
        const changes = sends.sent.filter(
            frame => frame.message.action === WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION
        );
        expect(sends.sent).toHaveLength(2);
        expect(notifications).toHaveLength(1);
        expect(notifications[0].connections.map(connection => connection.connectionId)).toEqual([
            "conn-anna-a"
        ]);
        expect(notifications[0].message.data).toMatchObject({
            event: "poolReached",
            stepId: "editorial"
        });
        expect(changes).toHaveLength(1);
        expect(changes[0].connections.map(connection => connection.connectionId)).toEqual([
            "conn-requester-a"
        ]);
        expect(changes[0].message.data).toMatchObject({
            kind: "stepApproved",
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            namespace: ARTICLE_MODEL
        });
```

The other tests of that file stay as they are: a reject and a final approval send no change message, and the failure cases reject.

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/notifications/getReviewChangeRecipients.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewChangeNotifierService.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewRequestedChangeNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepStartedChangeNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepApprovedChangeNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepRestartedChangeNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotificationsFeature.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/notificationConstants.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotificationsBackgroundTask.test.ts 2>&1 | tail -50`
Expected: FAIL for each (the new modules and constants do not exist; the two end-to-end files cannot import `WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION`).

- [ ] **Step 3: Implement**

Modify `packages/api-workflows/src/domain/notifications/constants.ts`. Replace

```ts
export const WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION = "workflows.notification";
```

with

```ts
export const WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION = "workflows.notification";

/**
 * The websocket action of the silent review change message (R253): ids and the namespace only,
 * no text and no toast; the kind is in `data`.
 */
export const WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION = "workflows.reviewChanged";
```

Modify `packages/api-workflows/src/domain/notifications/types.ts`. Replace

```ts
    title: string;
    body: string;
}
```

(the end of `WorkflowNotificationWebsocketData`, the last interface of the file) with

```ts
    title: string;
    body: string;
}

/** What changed in a review, as the silent change message names it (R253). */
export type WorkflowReviewChangedKind =
    | "requested"
    | "stepStarted"
    | "stepApproved"
    | "stepRestarted";

/**
 * The `data` of the `workflows.reviewChanged` websocket action (R253). Ids and the namespace
 * only (R200): the client refetches what shows the review. `stepId` is the step the change is
 * about, `null` when the review has none.
 */
export interface WorkflowReviewChangedWebsocketData {
    kind: WorkflowReviewChangedKind;
    reviewId: string;
    stepId: string | null;
    /** `review.model`: the client opens the CMS or Website Builder app by it (D133). */
    namespace: string;
    targetId: string;
    targetRevisionId: string;
}
```

Create `packages/api-workflows/src/domain/notifications/getReviewChangeRecipients.ts`:

```ts
import { dropActor } from "~/domain/notifications/dropActor.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";

/**
 * Who gets the silent `workflows.reviewChanged` message (R254): the requester and the current
 * owner when that is a user, each once, minus the actor when the actor is a user (`dropActor`, the
 * phase 7 rule). The actor's own tab refreshes through its own action. No pool lookup. An empty
 * or missing id is never a recipient. Pure.
 */
export const getReviewChangeRecipients = (review: ReviewData, actor: Actor): string[] => {
    const ids: string[] = [];
    for (const id of [review.createdBy.id, review.currentOwnerId]) {
        if (typeof id === "string" && id !== "" && !ids.includes(id)) {
            ids.push(id);
        }
    }

    const recipients = ids.map(id => ({ id }));
    const remaining = dropActor(recipients, actor);
    return remaining.map(item => item.id);
};
```

Create `packages/api-workflows/src/features/notifications/ReviewChangeNotifierService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type { WorkflowReviewChangedKind } from "~/domain/notifications/types.js";

export interface ReviewChangeNotifyParams {
    /** The saved review: the namespace and the ids of the frame. */
    review: ReviewData;
    /** The step the change is about; `null` when there is none. */
    stepId: string | null;
    kind: WorkflowReviewChangedKind;
    /** Already filtered by the handler (R254); duplicates are removed by the sender. */
    recipientIds: string[];
}

export interface IReviewChangeNotifierService {
    /**
     * Sends the silent `workflows.reviewChanged` frame (ids and namespace, no text, R253) to the
     * recipients' connections in the current tenant. No recipient: nothing happens. Never
     * rejects and never reports a failure (R87): every failure is logged once.
     */
    notify(params: ReviewChangeNotifyParams): Promise<void>;
}

/** Tells participants that a review changed. Internal (D132): no permission check. */
export const ReviewChangeNotifierService = createAbstraction<IReviewChangeNotifierService>(
    "Workflows/ReviewChangeNotifierService"
);

export namespace ReviewChangeNotifierService {
    export type Interface = IReviewChangeNotifierService;
    export type Params = ReviewChangeNotifyParams;
}
```

Create `packages/api-workflows/src/features/notifications/ReviewChangeNotifierService/ReviewChangeNotifierService.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION } from "~/domain/notifications/constants.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import type { WorkflowReviewChangedWebsocketData } from "~/domain/notifications/types.js";
import { ReviewWebsocketSender } from "~/features/notifications/ReviewWebsocketSender/abstractions.js";
import { ReviewChangeNotifierService as Abstraction } from "./abstractions.js";

const WEBSOCKET_TEXT = "Could not send a workflow websocket notification.";

class ReviewChangeNotifierServiceImpl implements Abstraction.Interface {
    public constructor(
        private websocketSender: ReviewWebsocketSender.Interface,
        private logger: Logger.Interface
    ) {}

    public async notify(params: Abstraction.Params): Promise<void> {
        const { review, stepId, kind, recipientIds } = params;
        if (recipientIds.length === 0) {
            return;
        }

        const data: WorkflowReviewChangedWebsocketData = {
            kind,
            reviewId: review.id,
            stepId,
            namespace: review.model,
            targetId: review.targetId,
            targetRevisionId: review.targetRevisionId
        };

        // The sender never rejects; this catch only guards a decorator that does (R87).
        try {
            await this.websocketSender.send({
                reviewId: review.id,
                event: kind,
                recipientIds,
                action: WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION,
                data
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: kind },
                WEBSOCKET_TEXT
            );
        }
    }
}

export const ReviewChangeNotifierService = Abstraction.createImplementation({
    implementation: ReviewChangeNotifierServiceImpl,
    dependencies: [ReviewWebsocketSender, Logger]
});
```

Create `packages/api-workflows/src/features/notifications/ReviewChangeNotifierService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ReviewChangeNotifierService } from "./ReviewChangeNotifierService.js";

export const ReviewChangeNotifierServiceFeature = createFeature({
    name: "WorkflowNotifications/ReviewChangeNotifierService",
    register(container) {
        container.register(ReviewChangeNotifierService);
    }
});
```

Create `packages/api-workflows/src/features/notifications/ReviewChangeNotifierService/index.ts`:

```ts
export { ReviewChangeNotifierServiceFeature } from "./feature.js";
export { ReviewChangeNotifierService } from "./abstractions.js";
```

Create `packages/api-workflows/src/features/notifications/handlers/ReviewRequestedChangeNotifications.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { getReviewChangeRecipients } from "~/domain/notifications/getReviewChangeRecipients.js";
import { ReviewRequestedEventHandler } from "~/features/review/events.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/abstractions.js";

/**
 * Sends the silent change message when a review is requested (R253, R254): to the requester and
 * the current owner, minus the actor when the actor is a user. The step is the review's current
 * step. Catches everything (R182, R87).
 */
class ReviewRequestedChangeNotificationsImpl implements ReviewRequestedEventHandler.Interface {
    public constructor(
        private changeNotifier: ReviewChangeNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewRequestedEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            const recipientIds = getReviewChangeRecipients(review, fact.actor);
            await this.changeNotifier.notify({
                review,
                stepId: review.currentStepId,
                kind: "requested",
                recipientIds
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: fact.type },
                "A workflow notification handler failed."
            );
        }
    }
}

export const ReviewRequestedChangeNotifications = ReviewRequestedEventHandler.createImplementation({
    implementation: ReviewRequestedChangeNotificationsImpl,
    dependencies: [ReviewChangeNotifierService, Logger]
});
```

Create `packages/api-workflows/src/features/notifications/handlers/ReviewStepStartedChangeNotifications.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { getReviewChangeRecipients } from "~/domain/notifications/getReviewChangeRecipients.js";
import { ReviewStepStartedEventHandler } from "~/features/review/events.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/abstractions.js";

/**
 * Sends the silent change message when a pool step is started (R253, R254): to the requester and
 * the current owner, minus the actor when the actor is a user. The starter becomes the owner, so
 * the requester is usually the only recipient. Catches everything (R182, R87).
 */
class ReviewStepStartedChangeNotificationsImpl implements ReviewStepStartedEventHandler.Interface {
    public constructor(
        private changeNotifier: ReviewChangeNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepStartedEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            const recipientIds = getReviewChangeRecipients(review, fact.actor);
            await this.changeNotifier.notify({
                review,
                stepId: fact.change.stepId,
                kind: "stepStarted",
                recipientIds
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: fact.type },
                "A workflow notification handler failed."
            );
        }
    }
}

export const ReviewStepStartedChangeNotifications =
    ReviewStepStartedEventHandler.createImplementation({
        implementation: ReviewStepStartedChangeNotificationsImpl,
        dependencies: [ReviewChangeNotifierService, Logger]
    });
```

Create `packages/api-workflows/src/features/notifications/handlers/ReviewStepApprovedChangeNotifications.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { getReviewChangeRecipients } from "~/domain/notifications/getReviewChangeRecipients.js";
import { ReviewStepApprovedEventHandler } from "~/features/review/events.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/abstractions.js";

/**
 * Sends the silent change message when a step is approved and the review goes on (R253, R254):
 * to the requester and the next owner, minus the actor when the actor is a user. When the review
 * is not `inProgress` this was the final approval, which already sends the `approved`
 * notification, so nothing is sent. Catches everything (R182, R87).
 */
class ReviewStepApprovedChangeNotificationsImpl implements ReviewStepApprovedEventHandler.Interface {
    public constructor(
        private changeNotifier: ReviewChangeNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepApprovedEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            if (review.state !== "inProgress") {
                return;
            }

            const recipientIds = getReviewChangeRecipients(review, fact.actor);
            await this.changeNotifier.notify({
                review,
                stepId: fact.change.stepId,
                kind: "stepApproved",
                recipientIds
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: fact.type },
                "A workflow notification handler failed."
            );
        }
    }
}

export const ReviewStepApprovedChangeNotifications =
    ReviewStepApprovedEventHandler.createImplementation({
        implementation: ReviewStepApprovedChangeNotificationsImpl,
        dependencies: [ReviewChangeNotifierService, Logger]
    });
```

Create `packages/api-workflows/src/features/notifications/handlers/ReviewStepRestartedChangeNotifications.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { getReviewChangeRecipients } from "~/domain/notifications/getReviewChangeRecipients.js";
import { ReviewStepRestartedEventHandler } from "~/features/review/events.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/abstractions.js";

/**
 * Sends the silent change message when a failed step is restarted (R253, R254): to the requester
 * and the current owner, minus the actor when the actor is a user. Catches everything (R182,
 * R87).
 */
class ReviewStepRestartedChangeNotificationsImpl implements ReviewStepRestartedEventHandler.Interface {
    public constructor(
        private changeNotifier: ReviewChangeNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepRestartedEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            const recipientIds = getReviewChangeRecipients(review, fact.actor);
            await this.changeNotifier.notify({
                review,
                stepId: fact.change.stepId,
                kind: "stepRestarted",
                recipientIds
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: fact.type },
                "A workflow notification handler failed."
            );
        }
    }
}

export const ReviewStepRestartedChangeNotifications =
    ReviewStepRestartedEventHandler.createImplementation({
        implementation: ReviewStepRestartedChangeNotificationsImpl,
        dependencies: [ReviewChangeNotifierService, Logger]
    });
```

Modify `packages/api-workflows/src/features/notifications/feature.ts` (four hunks, relative to Task 1's result). Replace

```ts
import { ReviewWebsocketSenderFeature } from "~/features/notifications/ReviewWebsocketSender/index.js";
```

with

```ts
import { ReviewWebsocketSenderFeature } from "~/features/notifications/ReviewWebsocketSender/index.js";
import { ReviewChangeNotifierServiceFeature } from "~/features/notifications/ReviewChangeNotifierService/index.js";
```

Replace

```ts
import { ReviewCancelledNotifications } from "./handlers/ReviewCancelledNotifications.js";
```

with

```ts
import { ReviewCancelledNotifications } from "./handlers/ReviewCancelledNotifications.js";
import { ReviewRequestedChangeNotifications } from "./handlers/ReviewRequestedChangeNotifications.js";
import { ReviewStepStartedChangeNotifications } from "./handlers/ReviewStepStartedChangeNotifications.js";
import { ReviewStepApprovedChangeNotifications } from "./handlers/ReviewStepApprovedChangeNotifications.js";
import { ReviewStepRestartedChangeNotifications } from "./handlers/ReviewStepRestartedChangeNotifications.js";
```

Replace the comment

```ts
 * The review notifications (R182, R199): the notifier and the services it uses, and one handler
 * per notifying event. `requested`, `stepStarted`, `stepApproved` and `stepRestarted` have no
 * handler (R181). The CMS and Website Builder `ReviewTargetLink` adapters register in their own
 * packages. Registered by `WorkflowsFeature`, inside its `advancedPublishingWorkflow` gate.
```

with

```ts
 * The review notifications (R182, R199): the notifier and the services it uses, and one handler
 * per notifying event. `requested`, `stepStarted`, `stepApproved` and `stepRestarted` have no
 * notification handler (R181). Since 8b those four events each have one more
 * handler, which sends the silent `workflows.reviewChanged` message to the requester and the
 * current owner (R253, R254). The CMS and Website Builder `ReviewTargetLink` adapters register
 * in their own packages. Registered by `WorkflowsFeature`, inside its
 * `advancedPublishingWorkflow` gate.
```

Replace

```ts
        container.register(ReviewCancelledNotifications);
```

with

```ts
        container.register(ReviewCancelledNotifications);

        ReviewChangeNotifierServiceFeature.register(container);
        container.register(ReviewRequestedChangeNotifications);
        container.register(ReviewStepStartedChangeNotifications);
        container.register(ReviewStepApprovedChangeNotifications);
        container.register(ReviewStepRestartedChangeNotifications);
```

- [ ] **Step 4: Run the tests to see them pass**

Run each file of Step 2 on its own with `yarn test <path> 2>&1 | tail -50`.
Expected: PASS for each.

Run the same ten with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code**

The notifier, the sender and the handlers of phase 7 share the feature and the websocket fakes; run each on its own with `yarn test` and then `yarn test:os`:
`yarn test packages/api-workflows/__tests__/notifications/ReviewWebsocketSender.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotifierService.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepFailedNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Check that no other test counted frames or handlers of these events: `grep -rln "RecordingWebsocketsSend\|resolveAll(ReviewStep" packages/api-workflows/__tests__ packages/api-headless-cms-workflows/__tests__ packages/api-website-builder-workflows/__tests__`. Expected: only the files named in this task, `handler.ts`, and the helper files. The CMS and Website Builder test contexts keep their inert websocket fakes, and their handlers now resolve the new sender and change notifier. Run one existing suite of each, with `yarn test` and then `yarn test:os`:
`yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS (the review events publish through the new handlers with the inert fakes).

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors in the touched package. (`resolveImplementation(...)` cast to the handler interface: cast through `unknown` if it complains. A `SplitWebsocketsSend.execute` override that reports an incompatible generic signature: copy the parameter and return types of `RecordingWebsocketsSend.execute` exactly.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from the 8a `00-shared.md` in full (`git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`, `git add .`), and restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`, and `git restore --staged .gitleaks.toml` if the chain staged it). If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-workflows): send the silent review change message" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

**Contract notes:**
- **`stepId` of each kind** (the contract says only `string | null`): `requested` sends `review.currentStepId` (the saved review's current step, `null` without one); the other four send `fact.change.stepId`. The client refetches by `reviewId`, so the value is informational.
- **Handlers always call the service**, even with no recipient left (`recipientIds: []`); the service returns at once for none. The contract does not say which side skips; this keeps the four handlers free of a repeated guard and the sender free of a decision.
- **No `failed` change message (contract change).** A failed AI or automation step has no user owner (`currentOwnerId` is set only for user owners) and the requester already gets the `failed` notification, so there is no `failed` kind and no handler. The end-to-end case pins "failed sends the notification only, no change frame".
- **Shared saved review:** `ReviewSaver` publishes every fact of one save with the same final review (`createEvent(saved, fact)`), so `requested` sees the owner picked at request time and an intermediate `stepApproved` sees the next owner. The end-to-end cases rely on it.
- **Existing tests beyond the contract's list:** `ReviewNotificationsBackgroundTask.test.ts` (one test, because an automation approval does not drop the requester) and `notificationConstants.test.ts` (one expectation). `ReviewNotificationsFeature.test.ts` is rewritten because the four formerly silent events now have one handler each.
- **Unverified (verify while running Step 4):** that the pick `{ stepId: "legal", userId: "user-bob" }` in the first end-to-end case gives Bob the first step at request time (the existing cases rely on the same for the `editorial` pick, and `legal` has `allowManualPick: true`); that restarting the seeded failed automation review re-reaches the step without a second change frame (a re-failure sends the `failed` notification only: there is no `failed` change kind, R253).
