### Task 10: Activity bus, `ReviewChangedEvent`, `ReviewCacheSyncHandler`, `ReviewToasts`, `ReviewNotificationService`

Spec 13.1; R207 (toast options: bottom right, 8 s, close button, link; the `Notifications` extension of Task 7), R210 (`ReviewActivity` signals `{ namespace, source }`, `subscribe(namespaces, listener)`, no polling), R211 (everything registered under the flag-gated `WorkflowsAdminApp`, nothing without the flag), R212 (the three services are singletons), R213 (`ReviewChangedEvent` replaces `WorkflowStateChangedEvent`; one shared `ReviewCacheSyncHandler` hands `toSystemWorkflow(review)` to the app's cache writer), R214 (own-action toast texts, QBZ-93, QBZ-82), R223 (the shared `ReviewNotificationService` for incoming `workflows.notification` messages; the websocket handler class itself is Task 28), D60 (no stored inbox, notifications are toasts plus a refetch signal), D125. Review Focus 7 (toast stack misconfigured, other toasts changed) and 8 (decorators active without the feature, here the `WorkflowsAdminApp` flag test), 17 (shared logic tested once).

What this task builds, all in `packages/app-workflows/src/review/`:

- **Event and cache sync.** `ReviewChangedEvent` (`eventType = "workflows.review.changed"`, payload `{ namespace, targetId, targetRevisionId, review: Review | null }`; event payloads are not view models) and its handler abstraction `ReviewChangedHandler`, one per file (`ReviewChangedHandler.ts` imports the event with `import type`, which breaks the cycle; the event file imports the handler value). `ReviewCacheSyncHandler` (constructor `(writer: IReviewCacheWriter)`): `handle(event)` returns unless `writer.canHandle(namespace)`, else `writer.write({ namespace, targetId, targetRevisionId }, toSystemWorkflow(review))`. It is exported plain and **never passed to `createImplementation`** (that call stores the abstraction and dependencies as metadata on the class and returns the same class, so one shared class bound by two apps would collide, the last call silently winning). Each app subclasses it once in its own file (`class CmsReviewCacheSyncHandlerImpl extends ReviewCacheSyncHandler implements ReviewChangedHandler.Interface {}`) and registers `ReviewChangedHandler.createImplementation({ implementation: CmsReviewCacheSyncHandlerImpl, dependencies: [CmsReviewCacheWriter] })` (Tasks 21, 24); this task tests the pattern with two test-only subclasses and writers in one container.
- **Activity bus.** `ReviewActivity` (`subscribe(namespaces, listener)` returns an idempotent unsubscribe; a listener receives only the signals of its namespaces; a listener that throws does not stop the others and is logged with `console.error`; unsubscribing inside a listener is safe because delivery iterates a snapshot; the namespace array is copied at subscribe time).
- **Toasts.** `getReviewToastText(params)` is the one pure table of the QBZ-93 texts; `ReviewToasts.show(params)` calls `notifications.success({ title, description?, position: "bottom-right", duration: 8000, dismissible: true, link? })` with the fields built by plain `if`s; the link `{ label: "Open Content Reviews", url }` only when `reviewsUrl` is set (the editors pass it, Content Reviews does not). Errors are never toasts (R214).
- **Incoming notifications.** `ReviewNotificationService.handle({ data, url })` shows `notifications.notify({ title: data.title, description: data.body, position, duration, dismissible, link? })` (link `{ label: "Open content", url }` only with a URL) and then signals `activity.notify({ namespace: data.namespace, source: "remote" })`. It knows no app: the shared websocket handler (Task 28) computes the URL with the app's content adapter and decides which messages to pass in.
- **Feature and gate.** `ReviewServicesFeature` registers the three singletons; `WorkflowsAdminApp` registers it inside the flag gate (`advancedPublishingWorkflow`), so without the flag nothing is registered (R211, Review Focus 8).

QBZ-93 table (verbatim from `docs/.bruno/workflows/design/answers.md`, with QBZ-82 for Start):

| Kind | Title | Body |
|---|---|---|
| `requested` | "Review requested" | "{first step} is the first step." |
| `started` | "Started “{step}”" | "It’s now in Assigned to me." |
| `approved` | "Approved “{step}”" | "Next: {step}." or "All steps approved. It’s ready to publish." |
| `rejected` | "Rejected “{step}”" | "The requester is notified." |
| `tookOver` | "Took over “{step}”" | "{name} was notified." only when a name is given (notify ticked) |
| `reassigned` | "Reassigned “{step}” to {name}" | "Both the previous and the new owner are notified." |
| `cancelled` | "Review cancelled" | "Editing is unlocked." |

There is no fallback copy: `ReviewToastParams` is a union typed per kind, so a step kind cannot be shown without its step title and `reassigned` cannot be shown without the new owner's name (the design texts need them); `tookOver` takes `personName: string | null` because the design shows the body only when notify is ticked. "Restarted" is 8b and is not a kind here.

**Files:**
- Create: `packages/app-workflows/src/review/events/ReviewChangedHandler.ts`, `packages/app-workflows/src/review/events/ReviewChangedEvent.ts`
- Create: `packages/app-workflows/src/review/cache/ReviewCacheSyncHandler.ts`
- Create: `packages/app-workflows/src/review/activity/abstractions.ts`, `packages/app-workflows/src/review/activity/ReviewActivity.ts`
- Create: `packages/app-workflows/src/review/toasts/constants.ts`, `abstractions.ts`, `getReviewToastText.ts`, `ReviewToasts.ts`
- Create: `packages/app-workflows/src/review/notifications/abstractions.ts`, `ReviewNotificationService.ts`
- Create: `packages/app-workflows/src/review/feature.ts`
- Create tests: `packages/app-workflows/src/review/events/ReviewChangedEvent.test.ts`, `cache/ReviewCacheSyncHandler.test.ts`, `activity/ReviewActivity.test.ts`, `toasts/getReviewToastText.test.ts`, `toasts/ReviewToasts.test.ts`, `notifications/ReviewNotificationService.test.ts`, `feature.test.ts`; `packages/app-workflows/src/app.test.tsx`
- Modify: `packages/app-workflows/src/app.tsx` (register `ReviewServicesFeature` inside the gate)
- Modify: `packages/app-workflows/package.json` (devDependency `@testing-library/react`)

**Interfaces:**
- Consumes: Task 8 (`Review`, `SystemWorkflowValue`, `toSystemWorkflow`, `IReviewCacheWriter`, `createReview` from `src/review/testing/reviewFixtures.ts`, imported `~/review/testing/reviewFixtures.js`, R243); Task 7 (`INotificationInput` gains `link`, `duration`, `position`, `dismissible`; `NotificationPosition`; `INotifications.error` exists but is not used here), imported `@webiny/app-admin/features/notifications/abstractions.js` (`Notifications`, `INotificationInput`, `NotificationPosition`); `BaseEvent`, `IEventHandler` from `@webiny/app/features/eventPublisher/abstractions.js`; `createAbstraction`, `createFeature` from `@webiny/feature/admin`; `Container` from `@webiny/di` (tests); `RegisterFeature`, `useFeatureFlags` from `@webiny/app-admin`; `DiContainerProvider` from `@webiny/app/shared/di/DiContainerProvider.js`. All verified in the current code (the old `packages/app-workflows/src/domain/events.ts` is the pattern for the event).
- Produces (consumed by Tasks 13-36):
  - `ReviewChangedPayload`, `ReviewChangedEvent`, `ReviewChangedHandler` (`"Workflows/ReviewChangedHandler"`, namespace `Interface`/`Event`), separate files.
  - `ReviewCacheSyncHandler implements ReviewChangedHandler.Interface`, constructor `(writer: IReviewCacheWriter)`, exported plain; Tasks 21 and 24 subclass it per app and register the subclass.
  - `ReviewActivitySignal { namespace; source: "own" | "remote" }`, `ReviewActivityListener`, `IReviewActivity`, token `ReviewActivity` (`"Workflows/ReviewActivity"`).
  - `ReviewToastKind`, `ReviewToastParams` (a union typed per kind, each member carrying `kind; stepTitle; personName; reviewsUrl`, `approved` also `nextStepTitle: string | null`), `IReviewToasts`, token `ReviewToasts` (`"Workflows/ReviewToasts"`), `getReviewToastText`.
  - `WorkflowsNotificationData`, `HandleReviewNotificationParams`, `IReviewNotificationService`, token `ReviewNotificationService` (`"Workflows/ReviewNotificationService"`).
  - `ReviewServicesFeature` (`resolve` -> `{ activity, toasts, notifications }`).
  - No barrel adds (R-k): the app packages import these by deep path (`@webiny/app-workflows/review/...`).

- [ ] **Step 1: Write the failing tests**

Add the test dependency first so the imports resolve (`@webiny/di` is already a dependency since Task 9). In `packages/app-workflows/package.json` add to `devDependencies` (keep keys sorted):

```json
  "devDependencies": {
    "@testing-library/react": "^16.3.2",
    "@types/react": "18.3.31",
    "@webiny/build-tools": "0.0.0",
    "rimraf": "^6.1.3",
    "typescript": "^7.0.2",
    "vitest": "^4.1.11"
  },
```

Run `yarn > /dev/null 2>&1` so the lockfile and `node_modules` pick them up.

Create `packages/app-workflows/src/review/events/ReviewChangedEvent.test.ts`:

```ts
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { ReviewChangedEvent } from "./ReviewChangedEvent.js";
import { ReviewChangedHandler } from "./ReviewChangedHandler.js";
import { createReview } from "~/review/testing/reviewFixtures.js";

describe("ReviewChangedEvent", () => {
    it("has the review changed event type and carries the payload as is", () => {
        const review = createReview();

        const event = new ReviewChangedEvent({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            review
        });

        expect(event.eventType).toBe("workflows.review.changed");
        expect(event.payload).toEqual({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            review
        });
        expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it("accepts a null review (no review any more)", () => {
        const event = new ReviewChangedEvent({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            review: null
        });

        expect(event.payload.review).toBeNull();
    });

    it("hands the publisher the review changed handler abstraction", () => {
        const event = new ReviewChangedEvent({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            review: null
        });

        expect(event.getHandlerAbstraction()).toBe(ReviewChangedHandler);
    });
});
```

Create `packages/app-workflows/src/review/cache/ReviewCacheSyncHandler.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { createAbstraction } from "@webiny/feature/admin";
import { ReviewCacheSyncHandler } from "./ReviewCacheSyncHandler.js";
import type { IReviewCacheWriter } from "./IReviewCacheWriter.js";
import { ReviewChangedEvent } from "~/review/events/ReviewChangedEvent.js";
import { ReviewChangedHandler } from "~/review/events/ReviewChangedHandler.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { createReview } from "~/review/testing/reviewFixtures.js";

const createEvent = (review: ReturnType<typeof createReview> | null): ReviewChangedEvent => {
    return new ReviewChangedEvent({
        namespace: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        review
    });
};

describe("ReviewCacheSyncHandler", () => {
    const writer = {
        canHandle: vi.fn(),
        write: vi.fn()
    };

    beforeEach(() => {
        writer.canHandle.mockReset();
        writer.write.mockReset();
        writer.canHandle.mockReturnValue(true);
    });

    it("writes toSystemWorkflow(review) for the event target", async () => {
        const handler = new ReviewCacheSyncHandler(writer);

        await handler.handle(createEvent(createReview()));

        expect(writer.canHandle).toHaveBeenCalledWith("cms.article");
        expect(writer.write).toHaveBeenCalledTimes(1);
        expect(writer.write).toHaveBeenCalledWith(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0001" },
            {
                workflowId: "workflow-1",
                reviewState: ReviewState.InProgress,
                stepId: "step-1",
                stepName: "Editorial check",
                stepState: StepState.Awaiting
            }
        );
    });

    it("writes null when the review is gone", async () => {
        const handler = new ReviewCacheSyncHandler(writer);

        await handler.handle(createEvent(null));

        expect(writer.write).toHaveBeenCalledWith(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0001" },
            null
        );
    });

    it("writes null for a cancelled review (the target is unlocked)", async () => {
        const handler = new ReviewCacheSyncHandler(writer);
        const cancelled = createReview({
            state: ReviewState.Cancelled,
            isActive: false,
            currentStepId: null,
            currentStepState: null
        });

        await handler.handle(createEvent(cancelled));

        expect(writer.write).toHaveBeenCalledWith(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0001" },
            null
        );
    });

    it("ignores a namespace the writer cannot handle", async () => {
        writer.canHandle.mockReturnValue(false);
        const handler = new ReviewCacheSyncHandler(writer);

        await handler.handle(createEvent(createReview()));

        expect(writer.canHandle).toHaveBeenCalledWith("cms.article");
        expect(writer.write).not.toHaveBeenCalled();
    });

    it("is bound per app by subclasses: each resolves with its own writer in one container", async () => {
        const WriterA = createAbstraction<IReviewCacheWriter>("Test/ReviewCacheWriterA");
        const WriterB = createAbstraction<IReviewCacheWriter>("Test/ReviewCacheWriterB");

        class HandlerAImpl extends ReviewCacheSyncHandler implements ReviewChangedHandler.Interface {}
        class HandlerBImpl extends ReviewCacheSyncHandler implements ReviewChangedHandler.Interface {}

        const writerA = { canHandle: vi.fn((namespace: string) => namespace === "cms.article"), write: vi.fn() };
        const writerB = { canHandle: vi.fn((namespace: string) => namespace === "wb.page"), write: vi.fn() };
        const container = new Container();
        container.registerInstance(WriterA, writerA);
        container.registerInstance(WriterB, writerB);
        container.register(
            ReviewChangedHandler.createImplementation({
                implementation: HandlerAImpl,
                dependencies: [WriterA]
            })
        );
        container.register(
            ReviewChangedHandler.createImplementation({
                implementation: HandlerBImpl,
                dependencies: [WriterB]
            })
        );
        const event = createEvent(createReview());

        const handlers = container.resolveAll(event.getHandlerAbstraction());
        for (const handler of handlers) {
            await handler.handle(event);
        }

        expect(handlers).toHaveLength(2);
        expect(writerA.write).toHaveBeenCalledTimes(1);
        expect(writerB.write).not.toHaveBeenCalled();
        expect(writerB.canHandle).toHaveBeenCalledWith("cms.article");
    });

    it("the shared class carries no abstraction metadata, so it cannot be registered as is", () => {
        const container = new Container();

        expect(() => container.register(ReviewCacheSyncHandler)).toThrow(
            "No abstraction metadata found"
        );
    });
});
```

Create `packages/app-workflows/src/review/activity/ReviewActivity.test.ts`:

```ts
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ReviewActivity as ReviewActivityToken } from "./abstractions.js";
import { ReviewActivity } from "./ReviewActivity.js";

describe("ReviewActivity", () => {
    let activity: ReviewActivityToken.Interface;

    beforeEach(() => {
        const container = new Container();
        container.register(ReviewActivity).inSingletonScope();
        activity = container.resolve(ReviewActivityToken);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("delivers a signal to a listener of its namespace", () => {
        const listener = vi.fn();
        activity.subscribe(["cms.article"], listener);

        activity.notify({ namespace: "cms.article", source: "own" });

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ namespace: "cms.article", source: "own" });
    });

    it("does not deliver signals of other namespaces", () => {
        const listener = vi.fn();
        activity.subscribe(["cms.article"], listener);

        activity.notify({ namespace: "wb.page", source: "remote" });

        expect(listener).not.toHaveBeenCalled();
    });

    it("delivers the signals of every subscribed namespace", () => {
        const listener = vi.fn();
        activity.subscribe(["cms.article", "wb.page"], listener);

        activity.notify({ namespace: "cms.article", source: "own" });
        activity.notify({ namespace: "wb.page", source: "remote" });
        activity.notify({ namespace: "cms.page", source: "remote" });

        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener).toHaveBeenNthCalledWith(1, { namespace: "cms.article", source: "own" });
        expect(listener).toHaveBeenNthCalledWith(2, { namespace: "wb.page", source: "remote" });
    });

    it("delivers one signal to every matching listener", () => {
        const first = vi.fn();
        const second = vi.fn();
        activity.subscribe(["cms.article"], first);
        activity.subscribe(["cms.article"], second);

        activity.notify({ namespace: "cms.article", source: "remote" });

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
    });

    it("stops delivering after unsubscribe, and unsubscribe is idempotent", () => {
        const listener = vi.fn();
        const other = vi.fn();
        const unsubscribe = activity.subscribe(["cms.article"], listener);
        activity.subscribe(["cms.article"], other);

        unsubscribe();
        unsubscribe();
        activity.notify({ namespace: "cms.article", source: "own" });

        expect(listener).not.toHaveBeenCalled();
        expect(other).toHaveBeenCalledTimes(1);
    });

    it("keeps delivering to the others when a listener throws, and logs the failure", () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const failing = vi.fn(() => {
            throw new Error("Listener failed.");
        });
        const healthy = vi.fn();
        activity.subscribe(["cms.article"], failing);
        activity.subscribe(["cms.article"], healthy);

        activity.notify({ namespace: "cms.article", source: "own" });

        expect(failing).toHaveBeenCalledTimes(1);
        expect(healthy).toHaveBeenCalledTimes(1);
        expect(error).toHaveBeenCalledTimes(1);
    });

    it("copies the namespaces at subscribe time", () => {
        const listener = vi.fn();
        const namespaces = ["cms.article"];
        activity.subscribe(namespaces, listener);

        namespaces.push("wb.page");
        activity.notify({ namespace: "wb.page", source: "own" });

        expect(listener).not.toHaveBeenCalled();
    });

    it("lets a listener unsubscribe itself while a signal is being delivered", () => {
        const later = vi.fn();
        const unsubscribeSelf = activity.subscribe(["cms.article"], () => {
            unsubscribeSelf();
        });
        activity.subscribe(["cms.article"], later);

        activity.notify({ namespace: "cms.article", source: "own" });
        activity.notify({ namespace: "cms.article", source: "own" });

        expect(later).toHaveBeenCalledTimes(2);
    });

    it("is a singleton", () => {
        const container = new Container();
        container.register(ReviewActivity).inSingletonScope();

        expect(container.resolve(ReviewActivityToken)).toBe(container.resolve(ReviewActivityToken));
    });
});
```

Create `packages/app-workflows/src/review/toasts/getReviewToastText.test.ts`:

```ts
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { getReviewToastText } from "./getReviewToastText.js";

describe("getReviewToastText (QBZ-93, QBZ-82)", () => {
    it("requested: names the first step", () => {
        expect(
            getReviewToastText({
                kind: "requested",
                stepTitle: "Editorial check",
                personName: null,
                reviewsUrl: null
            })
        ).toEqual({
            title: "Review requested",
            description: "Editorial check is the first step."
        });
    });

    it("started: names the step and says where it went", () => {
        expect(
            getReviewToastText({
                kind: "started",
                stepTitle: "Draft check",
                personName: null,
                reviewsUrl: null
            })
        ).toEqual({
            title: "Started “Draft check”",
            description: "It’s now in Assigned to me."
        });
    });

    it("approved: names the next step when there is one", () => {
        expect(
            getReviewToastText({
                kind: "approved",
                stepTitle: "Draft check",
                personName: null,
                reviewsUrl: null,
                nextStepTitle: "Legal check"
            })
        ).toEqual({
            title: "Approved “Draft check”",
            description: "Next: Legal check."
        });
    });

    it("approved: says the content is ready when it was the last step", () => {
        expect(
            getReviewToastText({
                kind: "approved",
                stepTitle: "Draft check",
                personName: null,
                reviewsUrl: null,
                nextStepTitle: null
            })
        ).toEqual({
            title: "Approved “Draft check”",
            description: "All steps approved. It’s ready to publish."
        });
    });

    it("rejected: tells the requester is notified", () => {
        expect(
            getReviewToastText({
                kind: "rejected",
                stepTitle: "Draft check",
                personName: null,
                reviewsUrl: null
            })
        ).toEqual({
            title: "Rejected “Draft check”",
            description: "The requester is notified."
        });
    });

    it("tookOver: names who was notified when notify was ticked", () => {
        expect(
            getReviewToastText({
                kind: "tookOver",
                stepTitle: "Draft check",
                personName: "Ada Lovelace",
                reviewsUrl: null
            })
        ).toEqual({
            title: "Took over “Draft check”",
            description: "Ada Lovelace was notified."
        });
    });

    it("tookOver: has no body when notify was not ticked", () => {
        expect(
            getReviewToastText({
                kind: "tookOver",
                stepTitle: "Draft check",
                personName: null,
                reviewsUrl: null
            })
        ).toEqual({ title: "Took over “Draft check”", description: null });
    });

    it("reassigned: names the new owner and says both are notified", () => {
        expect(
            getReviewToastText({
                kind: "reassigned",
                stepTitle: "Draft check",
                personName: "Grace Hopper",
                reviewsUrl: null
            })
        ).toEqual({
            title: "Reassigned “Draft check” to Grace Hopper",
            description: "Both the previous and the new owner are notified."
        });
    });

    it("cancelled: says editing is unlocked", () => {
        expect(
            getReviewToastText({
                kind: "cancelled",
                stepTitle: null,
                personName: null,
                reviewsUrl: null
            })
        ).toEqual({ title: "Review cancelled", description: "Editing is unlocked." });
    });
});
```

Create `packages/app-workflows/src/review/toasts/ReviewToasts.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { INotificationInput } from "@webiny/app-admin/features/notifications/abstractions.js";
import { ReviewToasts as ReviewToastsToken } from "./abstractions.js";
import type { ReviewToastKind } from "./abstractions.js";
import type { ReviewToastParams } from "./abstractions.js";
import { ReviewToasts } from "./ReviewToasts.js";

type FakeNotifications = { [K in keyof Notifications.Interface]: Mock };

const createFakeNotifications = (): FakeNotifications => {
    return {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    };
};

interface ToastCase {
    kind: ReviewToastKind;
    params: ReviewToastParams;
    title: string;
    description: string | null;
}

const toastCases: ToastCase[] = [
    {
        kind: "requested",
        params: { kind: "requested", stepTitle: "Draft check", personName: null, reviewsUrl: null },
        title: "Review requested",
        description: "Draft check is the first step."
    },
    {
        kind: "started",
        params: { kind: "started", stepTitle: "Draft check", personName: null, reviewsUrl: null },
        title: "Started “Draft check”",
        description: "It’s now in Assigned to me."
    },
    {
        kind: "tookOver",
        params: {
            kind: "tookOver",
            stepTitle: "Draft check",
            personName: "Ada Lovelace",
            reviewsUrl: null
        },
        title: "Took over “Draft check”",
        description: "Ada Lovelace was notified."
    },
    {
        kind: "reassigned",
        params: {
            kind: "reassigned",
            stepTitle: "Draft check",
            personName: "Grace Hopper",
            reviewsUrl: null
        },
        title: "Reassigned “Draft check” to Grace Hopper",
        description: "Both the previous and the new owner are notified."
    },
    {
        kind: "approved",
        params: {
            kind: "approved",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: null,
            nextStepTitle: "Legal check"
        },
        title: "Approved “Draft check”",
        description: "Next: Legal check."
    },
    {
        kind: "rejected",
        params: { kind: "rejected", stepTitle: "Draft check", personName: null, reviewsUrl: null },
        title: "Rejected “Draft check”",
        description: "The requester is notified."
    },
    {
        kind: "cancelled",
        params: { kind: "cancelled", stepTitle: null, personName: null, reviewsUrl: null },
        title: "Review cancelled",
        description: "Editing is unlocked."
    }
];

describe("ReviewToasts", () => {
    let notifications: FakeNotifications;
    let toasts: ReviewToastsToken.Interface;

    beforeEach(() => {
        notifications = createFakeNotifications();
        const container = new Container();
        container.registerInstance(Notifications, notifications);
        container.register(ReviewToasts).inSingletonScope();
        toasts = container.resolve(ReviewToastsToken);
    });

    it.each(toastCases)(
        "$kind shows the QBZ-93 text bottom right for 8 seconds with a close button",
        toastCase => {
            toasts.show(toastCase.params);

            expect(notifications.success).toHaveBeenCalledTimes(1);
            const input: INotificationInput = notifications.success.mock.calls[0][0];
            expect(input.title).toBe(toastCase.title);
            expect(input.description).toBe(toastCase.description ?? undefined);
            expect(input.position).toBe("bottom-right");
            expect(input.duration).toBe(8000);
            expect(input.dismissible).toBe(true);
            expect(input).not.toHaveProperty("link");
        }
    );

    it.each(toastCases)("$kind uses only the success variant", toastCase => {
        toasts.show(toastCase.params);

        expect(notifications.notify).not.toHaveBeenCalled();
        expect(notifications.warning).not.toHaveBeenCalled();
        expect(notifications.error).not.toHaveBeenCalled();
    });

    it("adds the Open Content Reviews link only when a reviews URL is passed", () => {
        toasts.show({
            kind: "started",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: "/cms/content-reviews"
        });

        const input: INotificationInput = notifications.success.mock.calls[0][0];
        expect(input.link).toEqual({ label: "Open Content Reviews", url: "/cms/content-reviews" });
    });

    it("omits the description when the text has none", () => {
        toasts.show({
            kind: "tookOver",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: null
        });

        const input: INotificationInput = notifications.success.mock.calls[0][0];
        expect(input).not.toHaveProperty("description");
        expect(input.title).toBe("Took over “Draft check”");
    });

    it("is a singleton", () => {
        const container = new Container();
        container.registerInstance(Notifications, notifications);
        container.register(ReviewToasts).inSingletonScope();

        expect(container.resolve(ReviewToastsToken)).toBe(container.resolve(ReviewToastsToken));
    });
});
```

Create `packages/app-workflows/src/review/notifications/ReviewNotificationService.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { INotificationInput } from "@webiny/app-admin/features/notifications/abstractions.js";
import { ReviewActivity as ReviewActivityToken } from "~/review/activity/abstractions.js";
import type { ReviewActivitySignal } from "~/review/activity/abstractions.js";
import { ReviewActivity } from "~/review/activity/ReviewActivity.js";
import { ReviewNotificationService as ReviewNotificationServiceToken } from "./abstractions.js";
import type { WorkflowsNotificationData } from "./abstractions.js";
import { ReviewNotificationService } from "./ReviewNotificationService.js";

type FakeNotifications = { [K in keyof Notifications.Interface]: Mock };

const createFakeNotifications = (): FakeNotifications => {
    return {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    };
};

const createData = (overrides: Partial<WorkflowsNotificationData> = {}): WorkflowsNotificationData => {
    return {
        event: "assigned",
        reviewId: "review-1",
        stepId: "step-1",
        namespace: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "A review is waiting for you",
        body: "Draft check on “Launch article”.",
        ...overrides
    };
};

describe("ReviewNotificationService", () => {
    let notifications: FakeNotifications;
    let service: ReviewNotificationServiceToken.Interface;
    let signals: ReviewActivitySignal[];

    beforeEach(() => {
        notifications = createFakeNotifications();
        const container = new Container();
        container.registerInstance(Notifications, notifications);
        container.register(ReviewActivity).inSingletonScope();
        container.register(ReviewNotificationService).inSingletonScope();
        service = container.resolve(ReviewNotificationServiceToken);
        signals = [];
        container.resolve(ReviewActivityToken).subscribe(["cms.article", "wb.page"], signal => {
            signals.push(signal);
        });
    });

    it("shows the notification bottom right for 8 seconds with a close button", () => {
        service.handle({ data: createData(), url: null });

        expect(notifications.notify).toHaveBeenCalledTimes(1);
        const input: INotificationInput = notifications.notify.mock.calls[0][0];
        expect(input.title).toBe("A review is waiting for you");
        expect(input.description).toBe("Draft check on “Launch article”.");
        expect(input.position).toBe("bottom-right");
        expect(input.duration).toBe(8000);
        expect(input.dismissible).toBe(true);
        expect(input).not.toHaveProperty("link");
    });

    it("adds an Open content link only when a URL is passed", () => {
        service.handle({
            data: createData(),
            url: "/cms/content-entries/article?id=entry-1%230001"
        });

        const input: INotificationInput = notifications.notify.mock.calls[0][0];
        expect(input.link).toEqual({
            label: "Open content",
            url: "/cms/content-entries/article?id=entry-1%230001"
        });
    });

    it("signals the activity bus with a remote source for the message namespace", () => {
        service.handle({ data: createData({ namespace: "wb.page" }), url: null });

        expect(signals).toEqual([{ namespace: "wb.page", source: "remote" }]);
    });

    it("shows every event kind the same way", () => {
        service.handle({ data: createData({ event: "rejected", title: "Rejected" }), url: null });
        service.handle({ data: createData({ event: "cancelled", title: "Cancelled" }), url: null });

        expect(notifications.notify).toHaveBeenCalledTimes(2);
        expect(signals).toHaveLength(2);
    });

    it("never uses the success variant (those are own-action toasts)", () => {
        service.handle({ data: createData(), url: null });

        expect(notifications.success).not.toHaveBeenCalled();
    });
});
```

Create `packages/app-workflows/src/review/feature.test.ts`:

```ts
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { ReviewServicesFeature } from "./feature.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { ReviewNotificationService } from "~/review/notifications/abstractions.js";

const createContainer = (): Container => {
    const container = new Container();
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    });
    return container;
};

describe("ReviewServicesFeature", () => {
    it("registers the three services", () => {
        const container = createContainer();
        ReviewServicesFeature.register(container);

        expect(container.resolve(ReviewActivity)).toBeDefined();
        expect(container.resolve(ReviewToasts)).toBeDefined();
        expect(container.resolve(ReviewNotificationService)).toBeDefined();
    });

    it("registers them as singletons and resolves them", () => {
        const container = createContainer();
        ReviewServicesFeature.register(container);

        const first = ReviewServicesFeature.resolve(container);
        const second = ReviewServicesFeature.resolve(container);

        expect(first.activity).toBe(second.activity);
        expect(first.toasts).toBe(second.toasts);
        expect(first.notifications).toBe(second.notifications);
        expect(first.activity).toBe(container.resolve(ReviewActivity));
    });

    it("shares one activity bus between the notification service and its subscribers", () => {
        const container = createContainer();
        ReviewServicesFeature.register(container);
        const { activity, notifications } = ReviewServicesFeature.resolve(container);
        const listener = vi.fn();
        activity.subscribe(["cms.article"], listener);

        notifications.handle({
            data: {
                event: "assigned",
                reviewId: "review-1",
                stepId: "step-1",
                namespace: "cms.article",
                targetId: "entry-1",
                targetRevisionId: "entry-1#0001",
                title: "A review is waiting for you",
                body: "Draft check."
            },
            url: null
        });

        expect(listener).toHaveBeenCalledWith({ namespace: "cms.article", source: "remote" });
    });
});
```

Create `packages/app-workflows/src/app.test.tsx` (the `WorkflowsAdminApp` flag test, Review Focus 8). The three mocks keep the test about the registration: `useFeatureFlags` is the flag source, and the two components that need admin composition providers (`SecurityPermissions`, `ContentReviews`) render nothing:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app/shared/di/DiContainerProvider.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { WorkflowsAdminApp } from "~/app.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { ReviewNotificationService } from "~/review/notifications/abstractions.js";

const flags = vi.hoisted(() => {
    return { isEnabled: vi.fn() };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return { ...actual, useFeatureFlags: () => ({ isEnabled: flags.isEnabled }) };
});

vi.mock("~/presentation/permissions/index.js", async importOriginal => {
    const actual = await importOriginal<typeof import("~/presentation/permissions/index.js")>();
    return { ...actual, SecurityPermissions: () => null };
});

vi.mock("~/presentation/ContentReviews.js", () => {
    return { ContentReviews: () => null };
});

const mount = (flagOn: boolean): Container => {
    flags.isEnabled.mockImplementation((name: string) => {
        return flagOn && name === "advancedPublishingWorkflow";
    });
    const container = new Container();
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    });
    render(
        <DiContainerProvider container={container}>
            <WorkflowsAdminApp />
        </DiContainerProvider>
    );
    return container;
};

describe("WorkflowsAdminApp review services", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the review services when advancedPublishingWorkflow is on", () => {
        const container = mount(true);

        expect(flags.isEnabled).toHaveBeenCalledWith("advancedPublishingWorkflow");
        expect(container.resolve(ReviewActivity)).toBeDefined();
        expect(container.resolve(ReviewToasts)).toBeDefined();
        expect(container.resolve(ReviewNotificationService)).toBeDefined();
    });

    it("registers them as singletons", () => {
        const container = mount(true);

        expect(container.resolve(ReviewActivity)).toBe(container.resolve(ReviewActivity));
        expect(container.resolve(ReviewToasts)).toBe(container.resolve(ReviewToasts));
    });

    it("registers nothing when the flag is off (R211)", () => {
        const container = mount(false);

        expect(flags.isEnabled).toHaveBeenCalledWith("advancedPublishingWorkflow");
        expect(() => container.resolve(ReviewActivity)).toThrow();
        expect(() => container.resolve(ReviewToasts)).toThrow();
        expect(() => container.resolve(ReviewNotificationService)).toThrow();
    });
});
```

(Prettier rewraps long lines on `yarn format:fix`.)

- [ ] **Step 2: Run the tests and expect failure**

One file per command (admin package: `yarn test` only, there is no storage-specific run for `app-workflows`):

```bash
yarn test packages/app-workflows/src/review/events/ReviewChangedEvent.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/cache/ReviewCacheSyncHandler.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/activity/ReviewActivity.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/toasts/getReviewToastText.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/toasts/ReviewToasts.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/notifications/ReviewNotificationService.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/feature.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -50
```

Expected: every file FAILS with `Failed to resolve import "./<module>.js"` (or `~/review/...`): the sources do not exist yet.

- [ ] **Step 3: Implement**

`packages/app-workflows/src/review/events/ReviewChangedHandler.ts` (type-only import of the event breaks the cycle with `ReviewChangedEvent.ts`):

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IEventHandler } from "@webiny/app/features/eventPublisher/abstractions.js";
import type { ReviewChangedEvent } from "./ReviewChangedEvent.js";

export const ReviewChangedHandler = createAbstraction<IEventHandler<ReviewChangedEvent>>(
    "Workflows/ReviewChangedHandler"
);

export namespace ReviewChangedHandler {
    export type Interface = IEventHandler<ReviewChangedEvent>;
    export type Event = ReviewChangedEvent;
}
```

`packages/app-workflows/src/review/events/ReviewChangedEvent.ts`:

```ts
import { BaseEvent } from "@webiny/app/features/eventPublisher/abstractions.js";
import type { Review } from "~/review/domain/types.js";
import { ReviewChangedHandler } from "./ReviewChangedHandler.js";

export interface ReviewChangedPayload {
    namespace: string;
    targetId: string;
    targetRevisionId: string;
    review: Review | null;
}

export class ReviewChangedEvent extends BaseEvent<ReviewChangedPayload> {
    eventType = "workflows.review.changed" as const;

    getHandlerAbstraction() {
        return ReviewChangedHandler;
    }
}
```

`packages/app-workflows/src/review/cache/ReviewCacheSyncHandler.ts`:

```ts
import type { IReviewCacheWriter } from "./IReviewCacheWriter.js";
import type { ReviewChangedEvent } from "~/review/events/ReviewChangedEvent.js";
import type { ReviewChangedHandler } from "~/review/events/ReviewChangedHandler.js";
import { toSystemWorkflow } from "~/review/domain/toSystemWorkflow.js";

/**
 * The one shared handler that keeps an app's content list cache in step with the review (R213).
 * The only per-app part is the cache writer it is built with. Exported plain: it is never passed
 * to `createImplementation`; each app subclasses it once and registers the subclass.
 */
export class ReviewCacheSyncHandler implements ReviewChangedHandler.Interface {
    constructor(private writer: IReviewCacheWriter) {}

    async handle(event: ReviewChangedEvent): Promise<void> {
        const { namespace, targetId, targetRevisionId, review } = event.payload;
        if (!this.writer.canHandle(namespace)) {
            return;
        }
        const workflow = toSystemWorkflow(review);
        this.writer.write({ namespace, targetId, targetRevisionId }, workflow);
    }
}
```

`packages/app-workflows/src/review/activity/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";

export type ReviewActivitySource = "own" | "remote";

export interface ReviewActivitySignal {
    namespace: string;
    source: ReviewActivitySource;
}

export type ReviewActivityListener = (signal: ReviewActivitySignal) => void;

export interface IReviewActivity {
    /** Returns an idempotent unsubscribe. A listener only receives the signals of its namespaces. */
    subscribe(namespaces: string[], listener: ReviewActivityListener): () => void;
    notify(signal: ReviewActivitySignal): void;
}

export const ReviewActivity = createAbstraction<IReviewActivity>("Workflows/ReviewActivity");

export namespace ReviewActivity {
    export type Interface = IReviewActivity;
    export type Signal = ReviewActivitySignal;
    export type Listener = ReviewActivityListener;
}
```

`packages/app-workflows/src/review/activity/ReviewActivity.ts`:

```ts
import { ReviewActivity as Abstraction } from "./abstractions.js";
import type { ReviewActivityListener } from "./abstractions.js";
import type { ReviewActivitySignal } from "./abstractions.js";

interface ReviewActivitySubscription {
    namespaces: string[];
    listener: ReviewActivityListener;
}

/**
 * The live-update bus (R210). Own actions and incoming notifications signal it; list and widget
 * presenters subscribe to their namespaces and refetch. No polling, no stored state.
 */
class ReviewActivityImpl implements Abstraction.Interface {
    private subscriptions = new Set<ReviewActivitySubscription>();

    subscribe(namespaces: string[], listener: ReviewActivityListener): () => void {
        const subscription: ReviewActivitySubscription = {
            namespaces: [...namespaces],
            listener
        };
        this.subscriptions.add(subscription);
        return () => {
            this.subscriptions.delete(subscription);
        };
    }

    /**
     * Delivery iterates a snapshot of the subscriptions taken when `notify` starts: a listener
     * added during delivery only sees later signals, one removed during delivery may still
     * receive the current signal.
     */
    notify(signal: ReviewActivitySignal): void {
        for (const subscription of [...this.subscriptions]) {
            if (!subscription.namespaces.includes(signal.namespace)) {
                continue;
            }
            try {
                subscription.listener(signal);
            } catch (error) {
                console.error("[ReviewActivity] A listener failed.", error);
            }
        }
    }
}

export const ReviewActivity = Abstraction.createImplementation({
    implementation: ReviewActivityImpl,
    dependencies: []
});
```

`packages/app-workflows/src/review/toasts/constants.ts`:

```ts
import type { NotificationPosition } from "@webiny/app-admin/features/notifications/abstractions.js";

/** Every workflows toast: bottom right, 8 seconds, with a close button (R207, QBZ-93). */
export const REVIEW_TOAST_POSITION: NotificationPosition = "bottom-right";
export const REVIEW_TOAST_DURATION = 8000;
export const REVIEW_TOAST_LINK_LABEL = "Open Content Reviews";
```

`packages/app-workflows/src/review/toasts/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";

export type ReviewToastKind =
    | "requested"
    | "started"
    | "tookOver"
    | "reassigned"
    | "approved"
    | "rejected"
    | "cancelled";

interface ReviewToastBase {
    /** The Content Reviews URL for the "Open Content Reviews" link; `null` on Content Reviews itself. */
    reviewsUrl: string | null;
}

/** `requested` (the first step of the workflow), `started` and `rejected` name one step. */
export interface StepReviewToastParams extends ReviewToastBase {
    kind: "requested" | "started" | "rejected";
    stepTitle: string;
    personName: null;
}

/** `approved` names the step and the step that is next, `null` when it was the last step. */
export interface ApprovedReviewToastParams extends ReviewToastBase {
    kind: "approved";
    stepTitle: string;
    personName: null;
    nextStepTitle: string | null;
}

/** `tookOver` names the person notified, `null` when notify was not ticked. */
export interface TookOverReviewToastParams extends ReviewToastBase {
    kind: "tookOver";
    stepTitle: string;
    personName: string | null;
}

/** `reassigned` always names the new owner. */
export interface ReassignedReviewToastParams extends ReviewToastBase {
    kind: "reassigned";
    stepTitle: string;
    personName: string;
}

export interface CancelledReviewToastParams extends ReviewToastBase {
    kind: "cancelled";
    stepTitle: null;
    personName: null;
}

export type ReviewToastParams =
    | StepReviewToastParams
    | ApprovedReviewToastParams
    | TookOverReviewToastParams
    | ReassignedReviewToastParams
    | CancelledReviewToastParams;

export interface IReviewToasts {
    show(params: ReviewToastParams): void;
}

export const ReviewToasts = createAbstraction<IReviewToasts>("Workflows/ReviewToasts");

export namespace ReviewToasts {
    export type Interface = IReviewToasts;
    export type Params = ReviewToastParams;
}
```

`packages/app-workflows/src/review/toasts/getReviewToastText.ts`:

```ts
import type { ReviewToastParams } from "./abstractions.js";

export interface ReviewToastText {
    title: string;
    description: string | null;
}

/**
 * The own-action toast texts (QBZ-93; Start per QBZ-82). Pure. The params are typed per kind, so
 * every text has what it needs. "Restarted" is 8b and has no kind.
 */
export const getReviewToastText = (params: ReviewToastParams): ReviewToastText => {
    switch (params.kind) {
        case "requested":
            return {
                title: "Review requested",
                description: `${params.stepTitle} is the first step.`
            };
        case "started":
            return {
                title: `Started “${params.stepTitle}”`,
                description: "It’s now in Assigned to me."
            };
        case "approved": {
            if (params.nextStepTitle) {
                return {
                    title: `Approved “${params.stepTitle}”`,
                    description: `Next: ${params.nextStepTitle}.`
                };
            }
            return {
                title: `Approved “${params.stepTitle}”`,
                description: "All steps approved. It’s ready to publish."
            };
        }
        case "rejected":
            return {
                title: `Rejected “${params.stepTitle}”`,
                description: "The requester is notified."
            };
        case "tookOver": {
            if (params.personName === null) {
                return { title: `Took over “${params.stepTitle}”`, description: null };
            }
            return {
                title: `Took over “${params.stepTitle}”`,
                description: `${params.personName} was notified.`
            };
        }
        case "reassigned":
            return {
                title: `Reassigned “${params.stepTitle}” to ${params.personName}`,
                description: "Both the previous and the new owner are notified."
            };
        case "cancelled":
            return { title: "Review cancelled", description: "Editing is unlocked." };
    }
};
```

`packages/app-workflows/src/review/toasts/ReviewToasts.ts`:

```ts
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { INotificationInput } from "@webiny/app-admin/features/notifications/abstractions.js";
import { ReviewToasts as Abstraction } from "./abstractions.js";
import type { ReviewToastParams } from "./abstractions.js";
import { getReviewToastText } from "./getReviewToastText.js";
import { REVIEW_TOAST_DURATION } from "./constants.js";
import { REVIEW_TOAST_LINK_LABEL } from "./constants.js";
import { REVIEW_TOAST_POSITION } from "./constants.js";

class ReviewToastsImpl implements Abstraction.Interface {
    constructor(private notifications: Notifications.Interface) {}

    show(params: ReviewToastParams): void {
        const text = getReviewToastText(params);
        const input: INotificationInput = {
            title: text.title,
            position: REVIEW_TOAST_POSITION,
            duration: REVIEW_TOAST_DURATION,
            dismissible: true
        };
        if (text.description !== null) {
            input.description = text.description;
        }
        if (params.reviewsUrl) {
            input.link = { label: REVIEW_TOAST_LINK_LABEL, url: params.reviewsUrl };
        }
        this.notifications.success(input);
    }
}

export const ReviewToasts = Abstraction.createImplementation({
    implementation: ReviewToastsImpl,
    dependencies: [Notifications]
});
```

`packages/app-workflows/src/review/notifications/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";

export type WorkflowsNotificationEvent =
    | "poolReached"
    | "assigned"
    | "reassigned"
    | "takenOver"
    | "approved"
    | "rejected"
    | "failed"
    | "cancelled";

/** The data of a `workflows.notification` websocket message (phase 7 contract, R187). */
export interface WorkflowsNotificationData {
    event: WorkflowsNotificationEvent;
    reviewId: string;
    stepId: string | null;
    namespace: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    body: string;
}

export interface HandleReviewNotificationParams {
    data: WorkflowsNotificationData;
    /** The content URL for the "Open content" link; `null` when the app cannot build one. */
    url: string | null;
}

export interface IReviewNotificationService {
    handle(params: HandleReviewNotificationParams): void;
}

export const ReviewNotificationService = createAbstraction<IReviewNotificationService>(
    "Workflows/ReviewNotificationService"
);

export namespace ReviewNotificationService {
    export type Interface = IReviewNotificationService;
    export type Params = HandleReviewNotificationParams;
}
```

`packages/app-workflows/src/review/notifications/ReviewNotificationService.ts`:

```ts
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { INotificationInput } from "@webiny/app-admin/features/notifications/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { REVIEW_TOAST_DURATION } from "~/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "~/review/toasts/constants.js";
import { ReviewNotificationService as Abstraction } from "./abstractions.js";
import type { HandleReviewNotificationParams } from "./abstractions.js";

const OPEN_CONTENT_LABEL = "Open content";

/**
 * Turns one incoming `workflows.notification` message into a toast and a refetch signal (R223,
 * R210). It knows no app: the caller passes the content URL.
 */
class ReviewNotificationServiceImpl implements Abstraction.Interface {
    constructor(
        private notifications: Notifications.Interface,
        private activity: ReviewActivity.Interface
    ) {}

    handle(params: HandleReviewNotificationParams): void {
        const { data, url } = params;
        const input: INotificationInput = {
            title: data.title,
            description: data.body,
            position: REVIEW_TOAST_POSITION,
            duration: REVIEW_TOAST_DURATION,
            dismissible: true
        };
        if (url) {
            input.link = { label: OPEN_CONTENT_LABEL, url };
        }
        this.notifications.notify(input);
        this.activity.notify({ namespace: data.namespace, source: "remote" });
    }
}

export const ReviewNotificationService = Abstraction.createImplementation({
    implementation: ReviewNotificationServiceImpl,
    dependencies: [Notifications, ReviewActivity]
});
```

`packages/app-workflows/src/review/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ReviewActivity as ReviewActivityAbstraction } from "./activity/abstractions.js";
import { ReviewActivity } from "./activity/ReviewActivity.js";
import { ReviewToasts as ReviewToastsAbstraction } from "./toasts/abstractions.js";
import { ReviewToasts } from "./toasts/ReviewToasts.js";
import { ReviewNotificationService as ReviewNotificationServiceAbstraction } from "./notifications/abstractions.js";
import { ReviewNotificationService } from "./notifications/ReviewNotificationService.js";

/**
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
```

`packages/app-workflows/src/app.tsx`, two hunks (existing imports and registrations otherwise unchanged):

```diff
 import { WorkflowsFeature } from "~/features/feature.js";
+import { ReviewServicesFeature } from "~/review/feature.js";
 import { WorkflowStatePresenterFeature } from "~/presentation/workflowState/feature.js";
```

```diff
             <RegisterFeature feature={WorkflowsFeature} />
+            <RegisterFeature feature={ReviewServicesFeature} />
             <RegisterFeature feature={WorkflowStatePresenterFeature} />
```

Both stay inside the existing `if (!featureFlags.isEnabled("advancedPublishingWorkflow")) { return null; }` gate, so without the flag nothing is registered.

- [ ] **Step 4: Run the tests and expect pass**

```bash
yarn test packages/app-workflows/src/review/events/ReviewChangedEvent.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/cache/ReviewCacheSyncHandler.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/activity/ReviewActivity.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/toasts/getReviewToastText.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/toasts/ReviewToasts.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/notifications/ReviewNotificationService.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/feature.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -50
```

Expected: all PASS. If `app.test.tsx` fails at import time inside `@webiny/app-admin` (the real barrel does not load in jsdom), replace `importOriginal` by narrower mocks of the modules `app.tsx` pulls in (`~/features/permissions/feature.js`, `~/features/feature.js`, the four presentation `feature.js` files) and a hand-written `RegisterFeature` mock that calls `feature.register(container)` with the test container from `DiContainerProvider`; record which variant was needed in the commit body. If `container.resolve(...)` for an unregistered token does not throw in this DI version, assert on `container.resolveAll(ReviewActivity)` being empty instead.

- [ ] **Step 5: Existing tests and type check**

The old `WorkflowsAdminApp` registrations are unchanged and the package has no other tests besides Tasks 8 and 9, so run those two guards for the shared domain these services use, then the build, which is the type check of the co-located tests (R-e: `check:test:types` reports only `__tests__/` errors):

```bash
yarn test packages/app-workflows/src/review/domain/toSystemWorkflow.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts 2>&1 | tail -50
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: PASS, no type errors (`FakeNotifications` is assignable to `Notifications.Interface` once Task 7's `error` method exists), the package builds. Also confirm Task 7's A70 note is in its commit (this task relies on the stack defaults but changes none).

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): add the review activity bus, cache sync handler, toasts and notification service" -m "ReviewChangedEvent replaces WorkflowStateChangedEvent and the shared ReviewCacheSyncHandler hands toSystemWorkflow(review) to the app cache writer. ReviewActivity is the refetch signal bus, ReviewToasts shows the QBZ-93 texts bottom right for 8 seconds with a close button, ReviewNotificationService turns incoming notifications into a toast plus a remote signal. WorkflowsAdminApp registers ReviewServicesFeature inside the feature flag gate." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step fails and you fix something, rerun the chain from the top. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`. Never push or amend.

**Contract notes**

- verify: the real `@webiny/app-admin` barrel loads under jsdom in `app.test.tsx` (Step 4 gives the fallback); `Container.resolve` of an unregistered token throws "No registration found" (checked in the installed `@webiny/di`, `resolveInternal`).
- Size: large (about 25 files) but every part is small and independent; one test cycle, one review gate.
