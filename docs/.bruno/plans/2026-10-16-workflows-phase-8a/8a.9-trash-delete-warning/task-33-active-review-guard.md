### Task 33: `ActiveReviewBlockCollector` and `ActiveReviewGuard` (`app-workflows`)

R205, R228, D157, A71 (guard side); Review Focus 10 and 19. The one shared piece that turns the server refusal into the warning flow, so the CMS and WB packages only forward to it (Tasks 35-36, Review Focus 17). Two services and three pure functions, no UI (the dialog is Task 34).

- **`ActiveReviewGuard.run`** wraps one delete-like action (trash, delete revision, permanent delete).
  - Runs `action()`. A thrown `GraphQLOperationError` with code `Workflows/Review/ActiveReviewOnTrash` and well-formed data is the refusal; everything else (other errors, other codes, malformed data) is rethrown unchanged.
  - If `collector.collects(data)` (an active bulk run owns one of the refused targets) the refusal is recorded with `collector.add(data)` and the guard resolves **`false`** (no rethrow, no dialog; controller ruling, R211-safe). The bulk presenter's per-item code treats `false` as "not deleted" and reports the item as failed, so non-workflow error behaviour of the presenters is unchanged.
  - Otherwise it opens the warning dialog through `Confirmation.confirm(ACTIVE_REVIEW_WARNING_DIALOG, { reviews, action }, execute)`. `execute` runs only after the user confirms: `useCases.cancelForDelete({ namespace: review.model, targetId, targetRevisionId: revisionId, action })` **once per distinct (`model`, `targetId`)**, then `action()` **once more**, no second confirm. Dismiss resolves `false`.
  - `execute` never throws. `Confirmation.confirm` (`packages/app-admin/src/features/confirmation/Confirmation.ts`) resolves its promise only after `execute` returns; a throwing `execute` would leave that promise pending forever. `execute` therefore catches and returns a small outcome (`{ failed: false, value }` or `{ failed: true, error }`), and the guard rethrows the error after `confirm` resolves. Effect: a second refusal or a failing cancel propagates to the original caller exactly as R205 says, the dialog closes, and no promise hangs.
- **`ActiveReviewGuard.runBulk`** wraps a series of per-item deletes run by a bulk presenter.
  - `begin(items' target ids)` opens a collect run, `run(items, false)` runs the presenter's normal series; the run is ended (`end`) and drained (`drain`) in a `finally`, so nothing leaks when `run` rejects (the rejection propagates).
  - Nothing collected: return. Otherwise one dialog lists every collected review; on confirm it cancels each distinct target once (`revisionId: null`) and then runs **only the blocked items** again (`run(blocked, true)`); dismiss does nothing more (the first pass already reported the blocked items as failed, which is truthful; if the user confirms, the results dialog of the caller then shows only the retried items, R228, noted for Task 38).
  - The retry runs inside its own collect run so a second refusal during the retry is recorded (the guard returns `false`, the presenter reports the item as failed) instead of opening a nested dialog (the drained data is discarded).
  - **First-pass summary (Q27, Q28, R228, controller addition):** when the first pass collected refusals, the guard itself shows one warning notification through `Notifications.warning` before it opens the dialog, so no app decorator repeats it: ONE string, user-approved in Q28, as the title `{done} of {total} items done. {refused} still need your confirmation.` with no description and no singular variant; `total` is `items.length`, `refused` the number of items whose target id is blocked, `done` the rest. The call also passes `position: REVIEW_TOAST_POSITION`, `duration: REVIEW_TOAST_DURATION` (`~/review/toasts/constants.js`, Task 10) and `dismissible: true` (R207, Q6), like every workflows toast. Nothing is shown when nothing was refused. The all-selected background-task path does not go through `runBulk`.
  - `runBulk` resolves only after the dialog flow has ended, so a caller that shows its results dialog after `await execute(...)` shows no failure summary before the warning.
- **`ActiveReviewBlockCollector`** records refusals per bulk run. `collects(data)` is true only while an **active** run's target ids include a `targetId` of one of the refusal's reviews, and `add` stores, per matching active run, only the reviews whose `targetId` that run owns, so an unrelated delete that overlaps a bulk run is not captured (R228, Review Focus 19). `end(runId)` stops collecting but keeps the data until `drain(runId)` returns and removes it (the contract's order is `end` in `finally`, then `drain`).
- **Pure functions** (one per file): `parseActiveReviewOnTrash(error)` (the typed refusal data or `null`), `distinctReviewTargets(reviews)` (first review per (`model`, `targetId`)), `mergeBlockingReviews(collected)` (every review once by `reviewId`, in order).
- **Dialog params** are a `type` alias, not an interface: `Confirmation.confirm` and `useNamedConfirmationDialog` constrain params to `Record<string, unknown>`, which an interface does not satisfy.

**Files:**
- Create: `packages/app-workflows/src/review/trash/constants.ts`
- Create: `packages/app-workflows/src/review/trash/parseActiveReviewOnTrash.ts`
- Create: `packages/app-workflows/src/review/trash/distinctReviewTargets.ts`
- Create: `packages/app-workflows/src/review/trash/mergeBlockingReviews.ts`
- Create: `packages/app-workflows/src/review/trash/ActiveReviewBlockCollector.ts` (token, one abstraction per file)
- Create: `packages/app-workflows/src/review/trash/ActiveReviewBlockCollectorImpl.ts`
- Create: `packages/app-workflows/src/review/trash/ActiveReviewGuard.ts` (token, its params types and the dialog params type)
- Create: `packages/app-workflows/src/review/trash/ActiveReviewGuardImpl.ts`
- Create: `packages/app-workflows/src/review/trash/parseActiveReviewOnTrash.test.ts`
- Create: `packages/app-workflows/src/review/trash/distinctReviewTargets.test.ts`
- Create: `packages/app-workflows/src/review/trash/mergeBlockingReviews.test.ts`
- Create: `packages/app-workflows/src/review/trash/ActiveReviewBlockCollector.test.ts`
- Create: `packages/app-workflows/src/review/trash/ActiveReviewGuard.test.ts`

**Interfaces:**
- Consumes:
  - Task 8: `ActiveReviewOnTrashData`, `BlockingReview` (`~/review/domain/types.js`), `ReviewErrorCode` (`~/review/domain/ReviewErrorCode.js`, const with `ActiveReviewOnTrash: "Workflows/Review/ActiveReviewOnTrash"`), `IReviewCancelForDeleteUseCases` (`~/review/useCases/IReviewCancelForDeleteUseCases.js`: `cancelForDelete(params: CancelForDeleteParams): Promise<Review[]>`), `CancelForDeleteParams { namespace; targetId; targetRevisionId: string | null; action: "trash" | "delete" }` (`~/review/gateway/IReviewGateway.js`). verify: the exact file names Task 8 created (one interface per file); adjust the three import paths if it named them differently.
  - Task 6: `GraphQLOperationError` (`@webiny/app/errors/index.js`).
  - Existing: `Notifications` (`@webiny/app-admin/features/notifications/abstractions.js`, `warning({ title, description?, position?, duration?, dismissible? })` (R207)), `Confirmation` (`@webiny/app-admin/features/confirmation/abstractions.js`; `confirm<TData, TParams, TResult>(name, params, execute)` resolves `TResult | false`), `createAbstraction` (`@webiny/feature/admin`), `Container` (`@webiny/di`).
- Produces (consumed by Tasks 34, 35, 36):
  - `ACTIVE_REVIEW_WARNING_DIALOG = "workflows-active-review-warning"`.
  - `ActiveReviewWarningDialogParams = { reviews: BlockingReview[]; action: "trash" | "delete" }` (the params the guard hands the dialog; declared in `ActiveReviewGuard.ts`).
  - `IActiveReviewBlockCollector { begin(targetIds: string[]): string; collects(data): boolean; add(data): void; drain(runId): ActiveReviewOnTrashData[]; end(runId): void }`, token `ActiveReviewBlockCollector` (`Workflows/ActiveReviewBlockCollector`), token file `ActiveReviewBlockCollector.ts`, implementation exported as `ActiveReviewBlockCollector` from `ActiveReviewBlockCollectorImpl.ts` (class `ActiveReviewBlockCollectorImpl`), registered singleton by Task 34.
  - `ActiveReviewGuardParams<TResult> { action: () => Promise<TResult>; useCases: IReviewCancelForDeleteUseCases; revisionId: string | null }`, `ActiveReviewBulkParams<TItem> { items: TItem[]; getTargetId: (item: TItem) => string; run: (batch: TItem[], isRetry: boolean) => Promise<void>; useCases: IReviewCancelForDeleteUseCases }`, `IActiveReviewGuard { run<TResult>(params): Promise<TResult | false>; runBulk<TItem>(params): Promise<void> }`, token `ActiveReviewGuard` (`Workflows/ActiveReviewGuard`), token file `ActiveReviewGuard.ts`, implementation exported as `ActiveReviewGuard` from `ActiveReviewGuardImpl.ts` (class `ActiveReviewGuardImpl`, dependencies `[Confirmation, ActiveReviewBlockCollector, Notifications]`), registered singleton by Task 34.
  - No barrel additions (R-k): the apps import these through deep paths (`@webiny/app-workflows/review/trash/ActiveReviewGuard.js` and so on).

- [ ] **Step 1: Write the failing tests**

`packages/app-workflows` gets its vitest setup from Task 8 (`vitest.config.ts`, jsdom; these tests need no DOM). Create `packages/app-workflows/src/review/trash/parseActiveReviewOnTrash.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import { parseActiveReviewOnTrash } from "./parseActiveReviewOnTrash.js";

const data: ActiveReviewOnTrashData = {
    model: "cms.article",
    action: "trash",
    reviews: [
        {
            reviewId: "review-1",
            model: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            title: "Launch article",
            stepPosition: 2,
            stepCount: 3,
            stepName: "Legal"
        }
    ]
};

function refusal(payload: unknown, code: string = ReviewErrorCode.ActiveReviewOnTrash) {
    return new GraphQLOperationError({ message: "Refused.", code, data: payload });
}

describe("parseActiveReviewOnTrash", () => {
    it("returns the data of an ActiveReviewOnTrash refusal", () => {
        expect(parseActiveReviewOnTrash(refusal(data))).toEqual(data);
    });

    it("accepts the delete action", () => {
        const deleteData = { ...data, action: "delete" };
        expect(parseActiveReviewOnTrash(refusal(deleteData))).toEqual(deleteData);
    });

    it("returns null for a plain Error and for non-errors", () => {
        expect(parseActiveReviewOnTrash(new Error("boom"))).toBeNull();
        expect(parseActiveReviewOnTrash("boom")).toBeNull();
        expect(parseActiveReviewOnTrash(null)).toBeNull();
        expect(parseActiveReviewOnTrash(undefined)).toBeNull();
    });

    it("returns null for a GraphQLOperationError with another code", () => {
        expect(parseActiveReviewOnTrash(refusal(data, ReviewErrorCode.NotFound))).toBeNull();
        expect(parseActiveReviewOnTrash(refusal(data, ReviewErrorCode.NotAuthorized))).toBeNull();
    });

    it("returns null for malformed data", () => {
        expect(parseActiveReviewOnTrash(refusal(null))).toBeNull();
        expect(parseActiveReviewOnTrash(refusal("text"))).toBeNull();
        expect(parseActiveReviewOnTrash(refusal({ ...data, reviews: "none" }))).toBeNull();
        expect(parseActiveReviewOnTrash(refusal({ ...data, reviews: [] }))).toBeNull();
        expect(parseActiveReviewOnTrash(refusal({ ...data, action: "move" }))).toBeNull();
        expect(parseActiveReviewOnTrash(refusal({ ...data, model: 5 }))).toBeNull();
        expect(
            parseActiveReviewOnTrash(refusal({ ...data, reviews: [{ reviewId: "review-1" }] }))
        ).toBeNull();
        const withoutRevision = { ...data.reviews[0], targetRevisionId: undefined };
        expect(
            parseActiveReviewOnTrash(refusal({ ...data, reviews: [withoutRevision] }))
        ).toBeNull();
    });
});
```

Create `packages/app-workflows/src/review/trash/distinctReviewTargets.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { BlockingReview } from "~/review/domain/types.js";
import { distinctReviewTargets } from "./distinctReviewTargets.js";

function review(overrides: Partial<BlockingReview>): BlockingReview {
    return {
        reviewId: "review-1",
        model: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "Launch article",
        stepPosition: 1,
        stepCount: 2,
        stepName: "Editor",
        ...overrides
    };
}

describe("distinctReviewTargets", () => {
    it("keeps the first review of every (model, targetId) in order", () => {
        const first = review({ reviewId: "r1" });
        const sameTarget = review({ reviewId: "r2", targetRevisionId: "entry-1#0002" });
        const otherEntry = review({ reviewId: "r3", targetId: "entry-2" });
        const otherModel = review({ reviewId: "r4", model: "cms.page" });

        const result = distinctReviewTargets([first, sameTarget, otherEntry, otherModel]);

        expect(result.map(item => item.reviewId)).toEqual(["r1", "r3", "r4"]);
    });

    it("returns an empty list for no reviews", () => {
        expect(distinctReviewTargets([])).toEqual([]);
    });
});
```

Create `packages/app-workflows/src/review/trash/mergeBlockingReviews.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import type { BlockingReview } from "~/review/domain/types.js";
import { mergeBlockingReviews } from "./mergeBlockingReviews.js";

function review(reviewId: string, targetId: string): BlockingReview {
    return {
        reviewId,
        model: "cms.article",
        targetId,
        targetRevisionId: `${targetId}#0001`,
        title: `Title ${reviewId}`,
        stepPosition: 1,
        stepCount: 2,
        stepName: "Editor"
    };
}

function data(reviews: BlockingReview[]): ActiveReviewOnTrashData {
    return { model: "cms.article", action: "trash", reviews };
}

describe("mergeBlockingReviews", () => {
    it("concatenates the reviews of every collected refusal in order", () => {
        const result = mergeBlockingReviews([
            data([review("r1", "e1")]),
            data([review("r2", "e2"), review("r3", "e2")])
        ]);

        expect(result.map(item => item.reviewId)).toEqual(["r1", "r2", "r3"]);
    });

    it("lists a review that was collected twice only once", () => {
        const result = mergeBlockingReviews([
            data([review("r1", "e1")]),
            data([review("r1", "e1"), review("r2", "e2")])
        ]);

        expect(result.map(item => item.reviewId)).toEqual(["r1", "r2"]);
    });

    it("returns an empty list for nothing collected", () => {
        expect(mergeBlockingReviews([])).toEqual([]);
    });
});
```

Create `packages/app-workflows/src/review/trash/ActiveReviewBlockCollector.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import type { BlockingReview } from "~/review/domain/types.js";
import { ActiveReviewBlockCollector as Abstraction } from "./ActiveReviewBlockCollector.js";
import { ActiveReviewBlockCollector } from "./ActiveReviewBlockCollectorImpl.js";

function review(reviewId: string, targetId: string): BlockingReview {
    return {
        reviewId,
        model: "cms.article",
        targetId,
        targetRevisionId: `${targetId}#0001`,
        title: `Title ${reviewId}`,
        stepPosition: 1,
        stepCount: 2,
        stepName: "Editor"
    };
}

function data(...reviews: BlockingReview[]): ActiveReviewOnTrashData {
    return { model: "cms.article", action: "trash", reviews };
}

describe("ActiveReviewBlockCollector", () => {
    let collector: Abstraction.Interface;

    beforeEach(() => {
        const container = new Container();
        container.register(ActiveReviewBlockCollector).inSingletonScope();
        collector = container.resolve(Abstraction);
    });

    it("collects nothing without an active run", () => {
        expect(collector.collects(data(review("r1", "e1")))).toBe(false);
    });

    it("collects a refusal whose target belongs to an active run", () => {
        collector.begin(["e1", "e2"]);

        expect(collector.collects(data(review("r1", "e2")))).toBe(true);
    });

    it("does not collect a refusal of an unrelated target", () => {
        collector.begin(["e1"]);

        expect(collector.collects(data(review("r9", "e9")))).toBe(false);
    });

    it("stores only the reviews of the run's own targets", () => {
        const runId = collector.begin(["e1"]);

        collector.add(data(review("r1", "e1"), review("r9", "e9")));
        collector.end(runId);

        const collected = collector.drain(runId);
        expect(collected).toHaveLength(1);
        expect(collected[0].reviews.map(item => item.reviewId)).toEqual(["r1"]);
        expect(collected[0].action).toBe("trash");
    });

    it("does not store a refusal that matches no run", () => {
        const runId = collector.begin(["e1"]);

        collector.add(data(review("r9", "e9")));
        collector.end(runId);

        expect(collector.drain(runId)).toEqual([]);
    });

    it("keeps overlapping runs apart", () => {
        const runA = collector.begin(["e1"]);
        const runB = collector.begin(["e2"]);

        collector.add(data(review("r1", "e1")));
        collector.add(data(review("r2", "e2")));
        collector.add(data(review("r3", "e1"), review("r4", "e2")));
        collector.end(runA);
        collector.end(runB);

        const forA = collector.drain(runA);
        const forB = collector.drain(runB);
        expect(forA.flatMap(item => item.reviews.map(r => r.reviewId))).toEqual(["r1", "r3"]);
        expect(forB.flatMap(item => item.reviews.map(r => r.reviewId))).toEqual(["r2", "r4"]);
    });

    it("stops collecting when a run ends but keeps its data until drained", () => {
        const runId = collector.begin(["e1"]);
        collector.add(data(review("r1", "e1")));

        collector.end(runId);

        expect(collector.collects(data(review("r2", "e1")))).toBe(false);
        collector.add(data(review("r2", "e1")));
        const collected = collector.drain(runId);
        expect(collected.flatMap(item => item.reviews.map(r => r.reviewId))).toEqual(["r1"]);
    });

    it("removes a run when it is drained", () => {
        const runId = collector.begin(["e1"]);
        collector.add(data(review("r1", "e1")));
        collector.end(runId);

        expect(collector.drain(runId)).toHaveLength(1);
        expect(collector.drain(runId)).toEqual([]);
    });

    it("returns an empty list for an unknown run id", () => {
        expect(collector.drain("unknown-run")).toEqual([]);
        collector.end("unknown-run");
    });

    it("gives every run its own id", () => {
        const first = collector.begin(["e1"]);
        const second = collector.begin(["e1"]);

        expect(first).not.toBe(second);
    });
});
```

Create `packages/app-workflows/src/review/trash/ActiveReviewGuard.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import type { BlockingReview } from "~/review/domain/types.js";
import type { Review } from "~/review/domain/types.js";
import type { CancelForDeleteParams } from "~/review/gateway/IReviewGateway.js";
import { REVIEW_TOAST_DURATION } from "~/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "~/review/toasts/constants.js";
import { ActiveReviewBlockCollector as CollectorAbstraction } from "./ActiveReviewBlockCollector.js";
import { ActiveReviewBlockCollector } from "./ActiveReviewBlockCollectorImpl.js";
import { ActiveReviewGuard as GuardAbstraction } from "./ActiveReviewGuard.js";
import type { ActiveReviewWarningDialogParams } from "./ActiveReviewGuard.js";
import { ActiveReviewGuard } from "./ActiveReviewGuardImpl.js";
import { ACTIVE_REVIEW_WARNING_DIALOG } from "./constants.js";

interface Item {
    entryId: string;
}

type ConfirmExecute = (data: unknown) => Promise<unknown>;

function createReview(overrides: Partial<BlockingReview> = {}): BlockingReview {
    return {
        reviewId: "review-1",
        model: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "Launch article",
        stepPosition: 2,
        stepCount: 3,
        stepName: "Legal",
        ...overrides
    };
}

function createRefusal(reviews: BlockingReview[], action: "trash" | "delete" = "trash") {
    const data: ActiveReviewOnTrashData = { model: reviews[0].model, action, reviews };
    return new GraphQLOperationError({
        message: "This content has a review in progress.",
        code: ReviewErrorCode.ActiveReviewOnTrash,
        data
    });
}

function createUseCases() {
    return {
        cancelForDelete: vi.fn(async (_params: CancelForDeleteParams): Promise<Review[]> => [])
    };
}

function createConfirmation(decision: "confirm" | "dismiss") {
    const confirm = vi.fn(async (_name: string, _params: unknown, execute?: ConfirmExecute) => {
        if (decision === "dismiss") {
            return false;
        }
        return execute ? execute(undefined) : undefined;
    });
    return { confirm, confirmation: { confirm } as unknown as Confirmation.Interface };
}

function createDeferredConfirmation() {
    let release: () => void = () => undefined;
    const gate = new Promise<void>(resolve => {
        release = resolve;
    });
    const confirm = vi.fn(async (_name: string, _params: unknown, execute?: ConfirmExecute) => {
        await gate;
        return execute ? execute(undefined) : undefined;
    });
    return {
        confirm,
        release,
        confirmation: { confirm } as unknown as Confirmation.Interface
    };
}

function setup(confirmation: Confirmation.Interface) {
    const container = new Container();
    const notifications = {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    };
    container.registerInstance(Confirmation, confirmation);
    container.registerInstance(Notifications, notifications);
    container.register(ActiveReviewBlockCollector).inSingletonScope();
    container.register(ActiveReviewGuard).inSingletonScope();
    return {
        guard: container.resolve(GuardAbstraction),
        collector: container.resolve(CollectorAbstraction),
        notifications
    };
}

describe("ActiveReviewGuard.run", () => {
    let useCases: ReturnType<typeof createUseCases>;

    beforeEach(() => {
        useCases = createUseCases();
    });

    it("returns the action result and opens nothing when the action succeeds", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);

        const result = await guard.run({
            action: async () => "trashed",
            useCases,
            revisionId: null
        });

        expect(result).toBe("trashed");
        expect(confirm).not.toHaveBeenCalled();
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
    });

    it("on confirm cancels each distinct target once, then repeats the action once", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        const reviews = [
            createReview({ reviewId: "r1", targetId: "entry-1" }),
            createReview({ reviewId: "r2", targetId: "entry-1", targetRevisionId: "entry-1#0002" }),
            createReview({ reviewId: "r3", targetId: "entry-2", model: "cms.page" })
        ];
        let blocked = true;
        const action = vi.fn(async () => {
            if (blocked) {
                throw createRefusal(reviews, "trash");
            }
            return "trashed";
        });
        useCases.cancelForDelete.mockImplementation(async () => {
            blocked = false;
            return [];
        });

        const result = await guard.run({ action, useCases, revisionId: null });

        expect(result).toBe("trashed");
        expect(confirm).toHaveBeenCalledTimes(1);
        expect(confirm.mock.calls[0][0]).toBe(ACTIVE_REVIEW_WARNING_DIALOG);
        expect(confirm.mock.calls[0][1]).toEqual({ reviews, action: "trash" });
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(2);
        expect(useCases.cancelForDelete).toHaveBeenNthCalledWith(1, {
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: null,
            action: "trash"
        });
        expect(useCases.cancelForDelete).toHaveBeenNthCalledWith(2, {
            namespace: "cms.page",
            targetId: "entry-2",
            targetRevisionId: null,
            action: "trash"
        });
        expect(action).toHaveBeenCalledTimes(2);
        const lastCancel = Math.max(...useCases.cancelForDelete.mock.invocationCallOrder);
        expect(lastCancel).toBeLessThan(action.mock.invocationCallOrder[1]);
    });

    it("passes the revision id to the cancel for a revision delete and the delete action", async () => {
        const { confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        const reviews = [createReview({ targetRevisionId: "entry-1#0002" })];
        let blocked = true;
        const action = vi.fn(async () => {
            if (blocked) {
                throw createRefusal(reviews, "delete");
            }
            return true;
        });
        useCases.cancelForDelete.mockImplementation(async () => {
            blocked = false;
            return [];
        });

        await guard.run({ action, useCases, revisionId: "entry-1#0002" });

        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(1);
        expect(useCases.cancelForDelete).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0002",
            action: "delete"
        });
    });

    it("resolves false on dismiss without cancelling or repeating", async () => {
        const { confirmation } = createConfirmation("dismiss");
        const { guard } = setup(confirmation);
        const action = vi.fn(async () => {
            throw createRefusal([createReview()]);
        });

        const result = await guard.run({ action, useCases, revisionId: null });

        expect(result).toBe(false);
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
        expect(action).toHaveBeenCalledTimes(1);
    });

    it("rethrows a plain error unchanged and opens nothing", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        const failure = new Error("Network down");

        const error = await guard
            .run({
                action: async () => {
                    throw failure;
                },
                useCases,
                revisionId: null
            })
            .catch(e => e);

        expect(error).toBe(failure);
        expect(confirm).not.toHaveBeenCalled();
    });

    it("rethrows a GraphQLOperationError with another code unchanged", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        const failure = new GraphQLOperationError({
            message: "Not authorized.",
            code: ReviewErrorCode.NotAuthorized,
            data: null
        });

        const error = await guard
            .run({
                action: async () => {
                    throw failure;
                },
                useCases,
                revisionId: null
            })
            .catch(e => e);

        expect(error).toBe(failure);
        expect(confirm).not.toHaveBeenCalled();
    });

    it("rethrows an ActiveReviewOnTrash error with malformed data unchanged", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        const failure = new GraphQLOperationError({
            message: "Refused.",
            code: ReviewErrorCode.ActiveReviewOnTrash,
            data: { reviews: "none" }
        });

        const error = await guard
            .run({
                action: async () => {
                    throw failure;
                },
                useCases,
                revisionId: null
            })
            .catch(e => e);

        expect(error).toBe(failure);
        expect(confirm).not.toHaveBeenCalled();
    });

    it("propagates a second refusal after the repeat, with no second dialog", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        const second = createRefusal([createReview({ reviewId: "r2" })]);
        const action = vi
            .fn()
            .mockRejectedValueOnce(createRefusal([createReview()]))
            .mockRejectedValueOnce(second);

        const error = await guard.run({ action, useCases, revisionId: null }).catch(e => e);

        expect(error).toBe(second);
        expect(confirm).toHaveBeenCalledTimes(1);
        expect(action).toHaveBeenCalledTimes(2);
    });

    it("propagates a failing cancel and does not repeat the action", async () => {
        const { confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        const failure = new Error("Could not cancel");
        useCases.cancelForDelete.mockRejectedValue(failure);
        const action = vi.fn(async () => {
            throw createRefusal([createReview()]);
        });

        const error = await guard.run({ action, useCases, revisionId: null }).catch(e => e);

        expect(error).toBe(failure);
        expect(action).toHaveBeenCalledTimes(1);
    });

    it("records a refusal of a target that an active bulk run owns and returns false, without a dialog", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard, collector } = setup(confirmation);
        const runId = collector.begin(["entry-1"]);
        const refusal = createRefusal([createReview({ targetId: "entry-1" })]);

        const result = await guard.run({
            action: async () => {
                throw refusal;
            },
            useCases,
            revisionId: null
        });

        expect(result).toBe(false);
        expect(confirm).not.toHaveBeenCalled();
        collector.end(runId);
        expect(collector.drain(runId)).toHaveLength(1);
    });

    it("does not collect the refusal of an unrelated target while a bulk run is active", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard, collector } = setup(confirmation);
        const runId = collector.begin(["entry-1"]);
        const reviews = [createReview({ reviewId: "r9", targetId: "entry-9" })];
        let blocked = true;
        useCases.cancelForDelete.mockImplementation(async () => {
            blocked = false;
            return [];
        });

        await guard.run({
            action: async () => {
                if (blocked) {
                    throw createRefusal(reviews);
                }
                return "trashed";
            },
            useCases,
            revisionId: null
        });

        expect(confirm).toHaveBeenCalledTimes(1);
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(1);
        collector.end(runId);
        expect(collector.drain(runId)).toEqual([]);
    });
});

describe("ActiveReviewGuard.runBulk", () => {
    let useCases: ReturnType<typeof createUseCases>;

    beforeEach(() => {
        useCases = createUseCases();
    });

    interface BulkSetup {
        run: ReturnType<typeof vi.fn>;
        failed: string[];
        blocked: Set<string>;
    }

    function createRun(
        guard: GuardAbstraction.Interface,
        blocked: Set<string>,
        cases: ReturnType<typeof createUseCases>
    ): BulkSetup {
        const failed: string[] = [];
        const run = vi.fn(async (batch: Item[], _isRetry: boolean) => {
            for (const item of batch) {
                // Like the presenters: a false result is "not deleted", reported as failed.
                const result = await guard.run({
                    action: async () => {
                        if (blocked.has(item.entryId)) {
                            const review = createReview({
                                reviewId: `review-${item.entryId}`,
                                targetId: item.entryId,
                                targetRevisionId: `${item.entryId}#0001`
                            });
                            throw createRefusal([review]);
                        }
                        return true;
                    },
                    useCases: cases,
                    revisionId: null
                });

                if (result === false) {
                    failed.push(item.entryId);
                }
            }
        });
        return { run, failed, blocked };
    }

    const items: Item[] = [{ entryId: "e1" }, { entryId: "e2" }, { entryId: "e3" }];

    it("shows the first-pass summary once when some items were refused (Q27)", async () => {
        const { confirmation } = createConfirmation("dismiss");
        const { guard, notifications } = setup(confirmation);
        const { run } = createRun(guard, new Set(["e2", "e3"]), useCases);

        await guard.runBulk({ items, getTargetId: item => item.entryId, run, useCases });

        expect(notifications.warning).toHaveBeenCalledTimes(1);
        expect(notifications.warning).toHaveBeenCalledWith({
            title: "1 of 3 items done. 2 still need your confirmation.",
            position: REVIEW_TOAST_POSITION,
            duration: REVIEW_TOAST_DURATION,
            dismissible: true
        });
    });

    it("uses the one string with the count as is, also for one refused item (Q28)", async () => {
        const { confirmation } = createConfirmation("dismiss");
        const { guard, notifications } = setup(confirmation);
        const { run } = createRun(guard, new Set(["e1"]), useCases);

        await guard.runBulk({ items, getTargetId: item => item.entryId, run, useCases });

        expect(notifications.warning).toHaveBeenCalledWith({
            title: "2 of 3 items done. 1 still need your confirmation.",
            position: REVIEW_TOAST_POSITION,
            duration: REVIEW_TOAST_DURATION,
            dismissible: true
        });
    });

    it("shows no summary when nothing was refused", async () => {
        const { confirmation } = createConfirmation("confirm");
        const { guard, notifications } = setup(confirmation);
        const { run } = createRun(guard, new Set(), useCases);

        await guard.runBulk({ items, getTargetId: item => item.entryId, run, useCases });

        expect(notifications.warning).not.toHaveBeenCalled();
    });

    it("runs once and opens nothing when no item is blocked", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        const { run } = createRun(guard, new Set(), useCases);

        await guard.runBulk({
            items,
            getTargetId: item => item.entryId,
            run,
            useCases
        });

        expect(run).toHaveBeenCalledTimes(1);
        expect(run).toHaveBeenCalledWith(items, false);
        expect(confirm).not.toHaveBeenCalled();
    });

    it("opens one dialog with every blocked review and retries only the blocked items after confirm", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        const blocked = new Set(["e1", "e3"]);
        const { run, failed } = createRun(guard, blocked, useCases);
        useCases.cancelForDelete.mockImplementation(async params => {
            blocked.delete(params.targetId);
            return [];
        });

        await guard.runBulk({
            items,
            getTargetId: item => item.entryId,
            run,
            useCases
        });

        expect(confirm).toHaveBeenCalledTimes(1);
        expect(confirm.mock.calls[0][0]).toBe(ACTIVE_REVIEW_WARNING_DIALOG);
        const dialogParams = confirm.mock.calls[0][1] as ActiveReviewWarningDialogParams;
        expect(dialogParams.action).toBe("trash");
        expect(dialogParams.reviews.map(review => review.reviewId)).toEqual([
            "review-e1",
            "review-e3"
        ]);
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(2);
        expect(useCases.cancelForDelete).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetId: "e1",
            targetRevisionId: null,
            action: "trash"
        });
        expect(run).toHaveBeenCalledTimes(2);
        expect(run).toHaveBeenNthCalledWith(1, items, false);
        expect(run).toHaveBeenNthCalledWith(2, [{ entryId: "e1" }, { entryId: "e3" }], true);
        expect(failed).toEqual(["e1", "e3"]);
    });

    it("does nothing more on dismiss", async () => {
        const { confirmation } = createConfirmation("dismiss");
        const { guard } = setup(confirmation);
        const { run, failed } = createRun(guard, new Set(["e2"]), useCases);

        await guard.runBulk({
            items,
            getTargetId: item => item.entryId,
            run,
            useCases
        });

        expect(run).toHaveBeenCalledTimes(1);
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
        expect(failed).toEqual(["e2"]);
    });

    it("resolves only after the warning flow has ended", async () => {
        const { confirm, release, confirmation } = createDeferredConfirmation();
        const { guard } = setup(confirmation);
        const blocked = new Set(["e1"]);
        const { run } = createRun(guard, blocked, useCases);
        useCases.cancelForDelete.mockImplementation(async params => {
            blocked.delete(params.targetId);
            return [];
        });
        const settled = vi.fn();

        const promise = guard
            .runBulk({
                items,
                getTargetId: item => item.entryId,
                run,
                useCases
            })
            .then(settled);

        await vi.waitFor(() => expect(confirm).toHaveBeenCalled());
        expect(settled).not.toHaveBeenCalled();
        release();
        await promise;

        expect(settled).toHaveBeenCalledTimes(1);
        expect(run).toHaveBeenCalledTimes(2);
    });

    it("reports a second refusal during the retry as a failure, without a nested dialog", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        const { run, failed } = createRun(guard, new Set(["e1"]), useCases);

        await guard.runBulk({
            items,
            getTargetId: item => item.entryId,
            run,
            useCases
        });

        expect(confirm).toHaveBeenCalledTimes(1);
        expect(run).toHaveBeenCalledTimes(2);
        expect(failed).toEqual(["e1", "e1"]);
    });

    it("does not capture an unrelated delete that overlaps the run", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        let sideBlocked = true;
        useCases.cancelForDelete.mockImplementation(async () => {
            sideBlocked = false;
            return [];
        });
        const run = vi.fn(async (_batch: Item[], _isRetry: boolean) => {
            await guard.run({
                action: async () => {
                    if (sideBlocked) {
                        throw createRefusal([
                            createReview({ reviewId: "r9", targetId: "entry-9" })
                        ]);
                    }
                },
                useCases,
                revisionId: null
            });
        });

        await guard.runBulk({
            items,
            getTargetId: item => item.entryId,
            run,
            useCases
        });

        expect(confirm).toHaveBeenCalledTimes(1);
        const dialogParams = confirm.mock.calls[0][1] as ActiveReviewWarningDialogParams;
        expect(dialogParams.reviews.map(review => review.targetId)).toEqual(["entry-9"]);
        expect(run).toHaveBeenCalledTimes(1);
    });

    it("propagates a rejection of run and ends the collect run", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard, collector } = setup(confirmation);
        const failure = new Error("Network down");
        const run = vi.fn(async () => {
            throw failure;
        });

        const error = await guard
            .runBulk({
                items,
                getTargetId: item => item.entryId,
                run,
                useCases
            })
            .catch(e => e);

        expect(error).toBe(failure);
        expect(confirm).not.toHaveBeenCalled();
        const refusal: ActiveReviewOnTrashData = {
            model: "cms.article",
            action: "trash",
            reviews: [createReview({ targetId: "e1" })]
        };
        expect(collector.collects(refusal)).toBe(false);
    });

    it("propagates a failing cancel after the dialog and does not retry", async () => {
        const { confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        const { run } = createRun(guard, new Set(["e1"]), useCases);
        const failure = new Error("Could not cancel");
        useCases.cancelForDelete.mockRejectedValue(failure);

        const error = await guard
            .runBulk({
                items,
                getTargetId: item => item.entryId,
                run,
                useCases
            })
            .catch(e => e);

        expect(error).toBe(failure);
        expect(run).toHaveBeenCalledTimes(1);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

`packages/app-workflows` is an admin package: `yarn test <path>` only (the storage legs are for the API packages of 8a.1).

```bash
yarn build -p @webiny/app --no-cache 2>&1 | tail -30
yarn test packages/app-workflows/src/review/trash/parseActiveReviewOnTrash.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/distinctReviewTargets.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/mergeBlockingReviews.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/ActiveReviewBlockCollector.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/ActiveReviewGuard.test.ts 2>&1 | tail -50
```

Expected: FAIL for all five files with `Failed to resolve import "./parseActiveReviewOnTrash.js"` (and the other new modules); the sources do not exist yet. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/review/trash/constants.ts`:

```ts
/**
 * Name of the named dialog (`AdminConfig.Dialog`) that warns about the review in progress when a
 * trash or delete is refused by the server (R205, D157).
 */
export const ACTIVE_REVIEW_WARNING_DIALOG = "workflows-active-review-warning";
```

Create `packages/app-workflows/src/review/trash/ActiveReviewBlockCollector.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";

export interface IActiveReviewBlockCollector {
    /**
     * Opens a collect run for the target ids of one bulk run and returns its id.
     */
    begin(targetIds: string[]): string;
    /**
     * True only while an active run owns a target of one of the refusal's reviews.
     */
    collects(data: ActiveReviewOnTrashData): boolean;
    /**
     * Stores the refusal, reduced to the reviews each matching active run owns.
     */
    add(data: ActiveReviewOnTrashData): void;
    /**
     * Returns what the run collected and forgets the run.
     */
    drain(runId: string): ActiveReviewOnTrashData[];
    /**
     * Stops the run from collecting; its data stays until it is drained.
     */
    end(runId: string): void;
}

export const ActiveReviewBlockCollector = createAbstraction<IActiveReviewBlockCollector>(
    "Workflows/ActiveReviewBlockCollector"
);

export namespace ActiveReviewBlockCollector {
    export type Interface = IActiveReviewBlockCollector;
}
```

Create `packages/app-workflows/src/review/trash/ActiveReviewGuard.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import type { BlockingReview } from "~/review/domain/types.js";
import type { IReviewCancelForDeleteUseCases } from "~/review/useCases/IReviewCancelForDeleteUseCases.js";

/**
 * Params of the warning dialog, handed over by the guard. A type alias on purpose:
 * `Confirmation.confirm` and `useNamedConfirmationDialog` constrain params to
 * `Record<string, unknown>`, which an interface does not satisfy.
 */
export type ActiveReviewWarningDialogParams = {
    reviews: BlockingReview[];
    action: ActiveReviewOnTrashData["action"];
};

export interface ActiveReviewGuardParams<TResult> {
    action: () => Promise<TResult>;
    useCases: IReviewCancelForDeleteUseCases;
    /**
     * The revision id of a single-revision delete, `null` for a trash or a whole-entry delete.
     */
    revisionId: string | null;
}

export interface ActiveReviewBulkParams<TItem> {
    items: TItem[];
    /**
     * The entry id (CMS) or page id (WB); equal to `BlockingReview.targetId`.
     */
    getTargetId: (item: TItem) => string;
    /**
     * Runs the presenter's series for a batch; `isRetry` is true for the second run.
     */
    run: (batch: TItem[], isRetry: boolean) => Promise<void>;
    useCases: IReviewCancelForDeleteUseCases;
}

export interface IActiveReviewGuard {
    /**
     * Runs the action; on the server refusal opens the warning, cancels on confirm and repeats
     * the action once. Resolves `false` when the warning is dismissed, and also when an active
     * bulk run owns the refused target (the refusal is then recorded for `runBulk`).
     */
    run<TResult>(params: ActiveReviewGuardParams<TResult>): Promise<TResult | false>;
    /**
     * Runs a bulk series, collects the refusals of its own targets, warns once and retries only
     * the blocked items. Resolves after the warning flow has ended.
     */
    runBulk<TItem>(params: ActiveReviewBulkParams<TItem>): Promise<void>;
}

export const ActiveReviewGuard = createAbstraction<IActiveReviewGuard>("Workflows/ActiveReviewGuard");

export namespace ActiveReviewGuard {
    export type Interface = IActiveReviewGuard;
    export type Params<TResult> = ActiveReviewGuardParams<TResult>;
    export type BulkParams<TItem> = ActiveReviewBulkParams<TItem>;
    export type DialogParams = ActiveReviewWarningDialogParams;
}
```

Create `packages/app-workflows/src/review/trash/parseActiveReviewOnTrash.ts`:

```ts
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isBlockingReview(value: unknown): boolean {
    if (!isRecord(value)) {
        return false;
    }

    const hasStrings = ["reviewId", "model", "targetId", "targetRevisionId", "title", "stepName"].every(
        key => typeof value[key] === "string"
    );
    const hasNumbers = ["stepPosition", "stepCount"].every(key => typeof value[key] === "number");

    return hasStrings && hasNumbers;
}

function isActiveReviewOnTrashData(value: unknown): value is ActiveReviewOnTrashData {
    if (!isRecord(value)) {
        return false;
    }
    if (typeof value.model !== "string") {
        return false;
    }
    if (value.action !== "trash" && value.action !== "delete") {
        return false;
    }
    if (!Array.isArray(value.reviews) || value.reviews.length === 0) {
        return false;
    }

    return value.reviews.every(isBlockingReview);
}

/**
 * Returns the data of the server refusal `Workflows/Review/ActiveReviewOnTrash`, or `null` for any
 * other error, any other code and malformed data (R205: those are rethrown unchanged). Pure.
 */
export const parseActiveReviewOnTrash = (error: unknown): ActiveReviewOnTrashData | null => {
    if (!(error instanceof GraphQLOperationError)) {
        return null;
    }
    if (error.code !== ReviewErrorCode.ActiveReviewOnTrash) {
        return null;
    }
    if (!isActiveReviewOnTrashData(error.data)) {
        return null;
    }

    return error.data;
};
```

Create `packages/app-workflows/src/review/trash/distinctReviewTargets.ts`:

```ts
import type { BlockingReview } from "~/review/domain/types.js";

/**
 * The first review of every distinct (`model`, `targetId`), in order. The cancel-for-delete call
 * works per target, so one call is made per entry in this list (R205). Pure.
 */
export const distinctReviewTargets = (reviews: BlockingReview[]): BlockingReview[] => {
    const seen = new Set<string>();
    const targets: BlockingReview[] = [];

    for (const review of reviews) {
        const key = `${review.model}::${review.targetId}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        targets.push(review);
    }

    return targets;
};
```

Create `packages/app-workflows/src/review/trash/mergeBlockingReviews.ts`:

```ts
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import type { BlockingReview } from "~/review/domain/types.js";

/**
 * Every review of the collected refusals, once by `reviewId`, in order. Pure.
 */
export const mergeBlockingReviews = (collected: ActiveReviewOnTrashData[]): BlockingReview[] => {
    const seen = new Set<string>();
    const reviews: BlockingReview[] = [];

    for (const data of collected) {
        for (const review of data.reviews) {
            if (seen.has(review.reviewId)) {
                continue;
            }
            seen.add(review.reviewId);
            reviews.push(review);
        }
    }

    return reviews;
};
```

Create `packages/app-workflows/src/review/trash/ActiveReviewBlockCollectorImpl.ts`:

```ts
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import { ActiveReviewBlockCollector as Abstraction } from "./ActiveReviewBlockCollector.js";

interface CollectorRun {
    targetIds: Set<string>;
    active: boolean;
    collected: ActiveReviewOnTrashData[];
}

function ownsTarget(run: CollectorRun, data: ActiveReviewOnTrashData): boolean {
    return data.reviews.some(review => run.targetIds.has(review.targetId));
}

class ActiveReviewBlockCollectorImpl implements Abstraction.Interface {
    private runs = new Map<string, CollectorRun>();
    private counter = 0;

    begin(targetIds: string[]): string {
        this.counter += 1;
        const runId = `active-review-run-${this.counter}`;
        this.runs.set(runId, { targetIds: new Set(targetIds), active: true, collected: [] });
        return runId;
    }

    collects(data: ActiveReviewOnTrashData): boolean {
        for (const run of this.runs.values()) {
            if (run.active && ownsTarget(run, data)) {
                return true;
            }
        }

        return false;
    }

    add(data: ActiveReviewOnTrashData): void {
        for (const run of this.runs.values()) {
            if (!run.active) {
                continue;
            }

            const reviews = data.reviews.filter(review => run.targetIds.has(review.targetId));
            if (reviews.length === 0) {
                continue;
            }

            run.collected.push({ ...data, reviews });
        }
    }

    drain(runId: string): ActiveReviewOnTrashData[] {
        const run = this.runs.get(runId);
        if (!run) {
            return [];
        }

        this.runs.delete(runId);
        return run.collected;
    }

    end(runId: string): void {
        const run = this.runs.get(runId);
        if (run) {
            run.active = false;
        }
    }
}

export const ActiveReviewBlockCollector = Abstraction.createImplementation({
    implementation: ActiveReviewBlockCollectorImpl,
    dependencies: []
});
```

Create `packages/app-workflows/src/review/trash/ActiveReviewGuardImpl.ts`:

```ts
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import { ActiveReviewBlockCollector } from "./ActiveReviewBlockCollector.js";
import { ActiveReviewGuard as Abstraction } from "./ActiveReviewGuard.js";
import type { ActiveReviewBulkParams } from "./ActiveReviewGuard.js";
import type { ActiveReviewGuardParams } from "./ActiveReviewGuard.js";
import type { ActiveReviewWarningDialogParams } from "./ActiveReviewGuard.js";
import { ACTIVE_REVIEW_WARNING_DIALOG } from "./constants.js";
import { distinctReviewTargets } from "./distinctReviewTargets.js";
import { mergeBlockingReviews } from "./mergeBlockingReviews.js";
import { parseActiveReviewOnTrash } from "./parseActiveReviewOnTrash.js";
import { REVIEW_TOAST_DURATION } from "~/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "~/review/toasts/constants.js";

/**
 * What the dialog's `execute` hands back. `Confirmation.confirm` resolves only after `execute`
 * returns, so `execute` never throws: it reports a failure here and the guard rethrows it once
 * `confirm` has resolved.
 */
interface RetrySucceeded<TResult> {
    failed: false;
    value: TResult;
}

interface RetryFailed {
    failed: true;
    error: unknown;
}

type RetryOutcome<TResult> = RetrySucceeded<TResult> | RetryFailed;

class ActiveReviewGuardImpl implements Abstraction.Interface {
    constructor(
        private confirmation: Confirmation.Interface,
        private collector: ActiveReviewBlockCollector.Interface,
        private notifications: Notifications.Interface
    ) {}

    async run<TResult>(params: ActiveReviewGuardParams<TResult>): Promise<TResult | false> {
        const { action, useCases, revisionId } = params;

        try {
            return await action();
        } catch (error) {
            const data = parseActiveReviewOnTrash(error);
            if (!data) {
                throw error;
            }

            if (this.collector.collects(data)) {
                // An active bulk run owns this target: record it for `runBulk` and report "not done".
                this.collector.add(data);
                return false;
            }

            const dialogParams: ActiveReviewWarningDialogParams = {
                reviews: data.reviews,
                action: data.action
            };
            const targets = distinctReviewTargets(data.reviews);

            const outcome = await this.confirmation.confirm<
                void,
                ActiveReviewWarningDialogParams,
                RetryOutcome<TResult>
            >(ACTIVE_REVIEW_WARNING_DIALOG, dialogParams, async () => {
                try {
                    for (const target of targets) {
                        await useCases.cancelForDelete({
                            namespace: target.model,
                            targetId: target.targetId,
                            targetRevisionId: revisionId,
                            action: data.action
                        });
                    }

                    const value = await action();
                    return { failed: false, value };
                } catch (retryError) {
                    return { failed: true, error: retryError };
                }
            });

            if (outcome === false) {
                return false;
            }
            if (outcome.failed) {
                throw outcome.error;
            }

            return outcome.value;
        }
    }

    async runBulk<TItem>(params: ActiveReviewBulkParams<TItem>): Promise<void> {
        const { items, getTargetId, run, useCases } = params;

        const targetIds = items.map(getTargetId);
        const runId = this.collector.begin(targetIds);
        let collected: ActiveReviewOnTrashData[] = [];

        try {
            await run(items, false);
        } finally {
            this.collector.end(runId);
            collected = this.collector.drain(runId);
        }

        if (collected.length === 0) {
            return;
        }

        const reviews = mergeBlockingReviews(collected);
        const action = collected[0].action;
        const blockedIds = reviews.map(review => review.targetId);
        const blockedTargetIds = new Set(blockedIds);
        const retryItems = items.filter(item => {
            const targetId = getTargetId(item);
            return blockedTargetIds.has(targetId);
        });
        const retryTargetIds = retryItems.map(getTargetId);
        const refused = retryItems.length;
        const done = items.length - refused;
        this.notifications.warning({
            title: `${done} of ${items.length} items done. ${refused} still need your confirmation.`,
            position: REVIEW_TOAST_POSITION,
            duration: REVIEW_TOAST_DURATION,
            dismissible: true
        });
        const targets = distinctReviewTargets(reviews);
        const dialogParams: ActiveReviewWarningDialogParams = { reviews, action };

        const outcome = await this.confirmation.confirm<
            void,
            ActiveReviewWarningDialogParams,
            RetryOutcome<void>
        >(ACTIVE_REVIEW_WARNING_DIALOG, dialogParams, async () => {
            try {
                for (const target of targets) {
                    await useCases.cancelForDelete({
                        namespace: target.model,
                        targetId: target.targetId,
                        targetRevisionId: null,
                        action
                    });
                }

                const retryRunId = this.collector.begin(retryTargetIds);
                try {
                    await run(retryItems, true);
                } finally {
                    this.collector.end(retryRunId);
                    this.collector.drain(retryRunId);
                }

                return { failed: false, value: undefined };
            } catch (retryError) {
                return { failed: true, error: retryError };
            }
        });

        if (outcome === false) {
            return;
        }
        if (outcome.failed) {
            throw outcome.error;
        }
    }
}

export const ActiveReviewGuard = Abstraction.createImplementation({
    implementation: ActiveReviewGuardImpl,
    dependencies: [Confirmation, ActiveReviewBlockCollector, Notifications]
});
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/trash/parseActiveReviewOnTrash.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/distinctReviewTargets.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/mergeBlockingReviews.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/ActiveReviewBlockCollector.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/ActiveReviewGuard.test.ts 2>&1 | tail -50
```

Expected: PASS (5 files).

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

```bash
yarn test packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts 2>&1 | tail -50
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: PASS and no type errors. (`ReviewUseCases.test.ts` from Task 9 exercises the use cases whose `IReviewCancelForDeleteUseCases` shape the guard depends on; if that file is named differently, run the Task 9 test file.)

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(app-workflows): add the active review block collector and guard" -m "The guard turns the ActiveReviewOnTrash refusal into one warning, cancels each distinct target once on confirm and repeats the action once. Bulk runs collect only the refusals of their own targets and retry only the blocked items; the collector keeps overlapping runs apart." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.

**Contract notes:**
- One token per file (`ActiveReviewBlockCollector.ts`, `ActiveReviewGuard.ts`), implementations in `<Token>Impl.ts` exported under the token, per the controller rule; the contract's single `abstractions.ts` is dropped. The guard params types and `ActiveReviewWarningDialogParams` sit next to the guard token.
- Three pure-function files and `ActiveReviewWarningDialogParams` are additions to the contract's file list; none renames a contract name.
- The contract says `end(runId)` in `finally`, then `drain(runId)`; for that order to return data, `end` stops collecting but keeps the data and `drain` removes the run. The collector test pins it.
- `execute` returns an outcome instead of throwing (see the first section). The contract's "a second refusal propagates" holds from the caller's side; the dialog does not show it.
- The retry of `runBulk` runs inside its own collect run (contract: "run(blocked, true) once"), so that a second refusal on the retry is a reported failure and never a nested dialog. The retry is still one call of `run`.
- R228 conflict, resolved by the controller (R211-safe): R228 says collect mode rethrows and the runner reports the item as failed, but `BulkActionRunner`/`Worker.processChunk` (`packages/app-admin/src/components/BulkActions/`) has no per-item error handling, so a rethrow would reject the whole `run`. Collect mode therefore records the refusal and resolves `false`; the two base `BulkDeletePresenter.deleteItem` methods (Tasks 35-36) only add `if (deleted === false) report.error(...)`, with no try/catch, so non-workflow error behaviour is unchanged. For Task 38: a bulk retry's results dialog shows only the retried items (R228).
- The first-pass summary of Q27 lives in `runBulk` (controller addition); the CMS and WB bulk decorators (Tasks 35, 36) only forward `execute` and add no count message. Its copy is the single string approved in Q28.
- verify: `IReviewCancelForDeleteUseCases` and `CancelForDeleteParams` file names (Task 8), see Interfaces.
