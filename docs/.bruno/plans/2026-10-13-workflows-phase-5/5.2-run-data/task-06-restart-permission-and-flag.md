### Task 6: `canRestartByPermission` and the real `canRestart` flag

Spec 5.1, 5.3, 8; D8, D34, D54, D82, D112; R33, R41, R153; A54. Failed steps now exist (Task 5), so the viewer flag stops being a constant:

- `canRestartByPermission(review, viewer)` (`domain/review/canRestartByPermission.ts`): permission only (R41). True for a viewer with `reassign` (full access included) or for the requesting user; same body as `canCancelByPermission`, written out in its own file (no shared helper: the two rules may diverge, and one rule per file). AI and automation actors carry the requester's id (D58) but are not the requester, so they never restart. The review's state is not read: the engine reports state errors (`Workflows/Review/InvalidState`, transition `"restart"`), and the wrappers (Tasks 16, 17) authorize with this predicate, so the flag and the wrapper's check cannot drift.
- `getReviewViewerFlags` sets `canRestart: review.checkRestart({ stepId }).isOk() && canRestartByPermission(data, viewer)` on the actionable step. `Review.actionableStepId` is the first step that is not approved, so a failed step is already returned (Task 5 keeps a failed step current), and it needs no change. Without an actionable step (every step approved) `canRestart` stays `false`. A `rejected` step is never restartable: `checkRestart` refuses it (D10). The app wrappers AND their target read access into the flag through `applyTargetAccess` like every other flag (R33); `applyTargetAccess` already zeroes `canRestart` and needs no change.
- The comments that say `canRestart` is "always false until phase 5" (`ReviewViewerFlags.canRestart` in `types.ts`, the `getReviewViewerFlags` doc comment) are updated.
- The phase 3 failed steps list (`matchesReviewList`, `failedSteps`) already matches `currentStepState: "failed"` with `currentStepType` `ai` or `automation`; one test proves it on a review failed through the real transition instead of a hand-built row.

**Files:**
- Create: `packages/api-workflows/src/domain/review/canRestartByPermission.ts`
- Modify: `packages/api-workflows/src/domain/review/getReviewViewerFlags.ts`
- Modify: `packages/api-workflows/src/domain/review/types.ts`
- Modify: `packages/api-workflows/__tests__/domain/reviewPermissionPredicates.test.ts`
- Modify: `packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts`
- Create: `packages/api-workflows/__tests__/domain/failedReviewList.test.ts`

**Interfaces:**
- Consumes:
  - Task 5: `Review.checkRestart(params: ReviewStepParams): Result<void, ReviewRestartError>`, `Review.fail`, `Review.reachRun`; test helpers `createFailedAutomationReview`, `createRunningAutomationReview`, `automationActor`, `AUTOMATION_STEP_ID` (`~tests/__helpers/stepRunReviews.js`).
  - Existing: `Review.fromData`, `Review.isRequestedBy`, `Review.actionableStepId`, `ReviewData`, `ReviewPermissionViewer`, `ReviewViewer`, `ReviewViewerFlags` (`~/domain/review/types.js`), `canCancelByPermission`, `canReassignByPermission`, `applyTargetAccess`, `matchesReviewList` (`~/domain/review/matchesReviewList.js`), test helpers `toSaveData`, `viewerOf`-style locals in the two predicate and flag test files.
- Produces:
  - `canRestartByPermission(review: ReviewData, viewer: ReviewPermissionViewer): boolean` (`~/domain/review/canRestartByPermission.js`).
  - `getReviewViewerFlags(...).canRestart` real (`review.checkRestart({ stepId }).isOk() && canRestartByPermission(data, viewer)`).
  - Consumed by Tasks 16, 17.

- [ ] **Step 1: Write the failing tests**

In `packages/api-workflows/__tests__/domain/reviewPermissionPredicates.test.ts`, add the import after the `canReassignByPermission` import:

```ts
import { canRestartByPermission } from "~/domain/review/canRestartByPermission.js";
```

the helper import after the `~tests/__helpers/fixtures.js` import block:

```ts
import {
    automationActor,
    createFailedAutomationReview,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
```

and, at the end of the file, a new `describe`:

```ts
describe("canRestartByPermission", () => {
    const failedReview = (): ReviewData => toSaveData(createFailedAutomationReview());

    it("lets the requesting user restart (D34)", () => {
        expect(canRestartByPermission(failedReview(), viewerOf(requester))).toBe(true);
    });

    it("lets reassign holders and full access restart any review (D34, D54)", () => {
        expect(canRestartByPermission(failedReview(), viewerOf(reviewer, REASSIGN))).toBe(true);
        expect(canRestartByPermission(failedReview(), viewerOf(reviewer, FULL_ACCESS))).toBe(
            true
        );
    });

    it("refuses other users, editors, and AI or automation actors carrying the requester's id (D58)", () => {
        expect(canRestartByPermission(failedReview(), viewerOf(reviewer))).toBe(false);
        expect(canRestartByPermission(failedReview(), viewerOf(reviewer, EDITOR))).toBe(false);
        expect(canRestartByPermission(failedReview(), viewerOf(aiActor))).toBe(false);
        expect(canRestartByPermission(failedReview(), viewerOf(automationActor))).toBe(false);
    });

    it("ignores the review state, which the engine reports (R41)", () => {
        const running = toSaveData(createRunningAutomationReview());

        expect(canRestartByPermission(running, viewerOf(requester))).toBe(true);
        expect(canRestartByPermission(cancelledReview(), viewerOf(requester))).toBe(true);
    });

    it("does not change the review it reads", () => {
        const data = failedReview();
        const copy = structuredClone(data);

        canRestartByPermission(data, viewerOf(requester));

        expect(data).toEqual(copy);
    });
});
```

In `packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts`, add the helper import after the fixtures import block:

```ts
import {
    AUTOMATION_STEP_ID,
    createFailedAutomationReview,
    createPendingAutomationReview,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
```

add these builders after `cancelledReview`:

```ts
/** The automation step failed; the review is still in progress (D8). */
const failedReview = (): ReviewData => toSaveData(createFailedAutomationReview());

/** The automation step is `inReview`, owned by the automation actor. */
const runningAutomationReview = (): ReviewData => toSaveData(createRunningAutomationReview());

/** The automation step failed while still `pending`: it never started a task. */
const failedBeforeStartReview = (): ReviewData => {
    const review = createPendingAutomationReview();
    expectOk(
        review.fail({
            stepId: AUTOMATION_STEP_ID,
            reason: 'The automation "test-automation" is not available.',
            now: LATER
        })
    );
    return toSaveData(review);
};

/** The automation rejected its step: the review is rejected and final (D10). */
const rejectedAutomationReview = (): ReviewData => {
    const review = createRunningAutomationReview();
    expectOk(
        review.reject({
            stepId: AUTOMATION_STEP_ID,
            actor: automationActor,
            actorTeamIds: [],
            comment: "Does not meet the policy.",
            now: LATER
        })
    );
    return toSaveData(review);
};
```

This file already defines a local `automationActor` constant (type `automation`, the requester's id); keep it and do not import the helper file's `automationActor`. The reject transition matches the step owner by type and id only, so the local constant can reject the step the helper's actor owns.

Add these tests inside `describe("getReviewViewerFlags", ...)`, after `"offers no step action while the next step is still pending"`:

```ts
    it("lets the requester restart a failed step, and cancel the review (D34)", () => {
        expect(getReviewViewerFlags(failedReview(), viewerOf(requester))).toEqual({
            ...NO_FLAGS,
            canCancel: true,
            canRestart: true
        });
    });

    it("lets reassign holders and full access restart a failed step (D34, D54)", () => {
        const expected = { ...NO_FLAGS, canCancel: true, canRestart: true };

        expect(getReviewViewerFlags(failedReview(), outsiderOf(REASSIGN))).toEqual(expected);
        expect(getReviewViewerFlags(failedReview(), outsiderOf(FULL_ACCESS))).toEqual(expected);
    });

    it("offers a failed step to nobody else, whatever their teams", () => {
        const data = failedReview();

        expect(getReviewViewerFlags(data, viewerOf(reviewer))).toEqual(NO_FLAGS);
        expect(getReviewViewerFlags(data, viewerOf(otherReviewer))).toEqual(NO_FLAGS);
        expect(getReviewViewerFlags(data, outsiderOf())).toEqual(NO_FLAGS);
        // The automation actor carries the requester's id (D58) but is not the requester.
        expect(getReviewViewerFlags(data, viewerOf(automationActor))).toEqual(NO_FLAGS);
        expect(getReviewViewerFlags(data, viewerOf(aiActor))).toEqual(NO_FLAGS);
    });

    it("offers no start, take over, approve, reject or reassign on a failed step", () => {
        expect(
            getReviewViewerFlags(failedReview(), viewerOf(requester, { permissions: FULL_ACCESS }))
        ).toEqual({ ...NO_FLAGS, canCancel: true, canRestart: true });
    });

    it("lets the requester restart a step that failed before it started", () => {
        expect(getReviewViewerFlags(failedBeforeStartReview(), viewerOf(requester))).toEqual({
            ...NO_FLAGS,
            canCancel: true,
            canRestart: true
        });
    });

    it("offers no restart while the automation step is still running", () => {
        const data = runningAutomationReview();

        expect(getReviewViewerFlags(data, viewerOf(requester))).toEqual({
            ...NO_FLAGS,
            canCancel: true
        });
        expect(
            getReviewViewerFlags(data, outsiderOf(FULL_ACCESS)).canRestart
        ).toBe(false);
    });

    it("never offers restart on a rejected step: reject is final (D10)", () => {
        const data = rejectedAutomationReview();

        expect(
            getReviewViewerFlags(data, viewerOf(requester, { permissions: FULL_ACCESS }))
        ).toEqual(NO_FLAGS);
    });

    it("offers no restart on a cancelled review with a failed step", () => {
        const review = createFailedAutomationReview();
        expectOk(review.cancel({ actor: requester, now: LATER }));
        const data = toSaveData(review);

        expect(
            getReviewViewerFlags(data, viewerOf(requester, { permissions: FULL_ACCESS }))
        ).toEqual(NO_FLAGS);
    });

    it("agrees with the restart check and the permission predicate for every viewer", () => {
        const reviews = [
            failedReview(),
            failedBeforeStartReview(),
            runningAutomationReview(),
            rejectedAutomationReview(),
            awaitingReview(),
            approvedReview(),
            cancelledReview()
        ];
        const viewers = [
            viewerOf(requester),
            viewerOf(reviewer),
            viewerOf(aiActor),
            viewerOf(automationActor),
            outsiderOf(REASSIGN),
            outsiderOf(FULL_ACCESS)
        ];

        for (const data of reviews) {
            const review = Review.fromData(data);
            for (const viewer of viewers) {
                const stepId = review.actionableStepId;
                const expected =
                    stepId !== null &&
                    review.checkRestart({ stepId }).isOk() &&
                    canRestartByPermission(data, viewer);
                expect(getReviewViewerFlags(data, viewer).canRestart).toBe(expected);
            }
        }
    });
```

and add the predicate import to that file, after the `getReviewViewerFlags` import:

```ts
import { canRestartByPermission } from "~/domain/review/canRestartByPermission.js";
```

Also add the failed review to the existing `"agrees with the transitions for every review and viewer"` list (the four transition flags must stay `false` on a failed step): in its `reviews` array, add after `cancelledReview()`:

```ts
            cancelledReview(),
            failedReview(),
            runningAutomationReview()
```

Create `packages/api-workflows/__tests__/domain/failedReviewList.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { matchesReviewList } from "~/domain/review/matchesReviewList.js";
import type { ReviewData, ReviewListKind } from "~/domain/review/types.js";
import { ARTICLE_MODEL, requester, REVIEW_TEAM_ID, toSaveData } from "~tests/__helpers/fixtures.js";
import {
    createFailedAutomationReview,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";

const matches = (review: ReviewData, list: ReviewListKind, viewerUserId: string): boolean => {
    return matchesReviewList(review, {
        list,
        viewerUserId,
        viewerTeamIds: [REVIEW_TEAM_ID],
        models: [ARTICLE_MODEL],
        where: {}
    });
};

describe("review lists with a step failed through Review.fail (D112)", () => {
    it("lists the failed automation step in failedSteps, and in no other list but the requester's", () => {
        const review = toSaveData(createFailedAutomationReview());

        expect(review).toMatchObject({
            currentStepState: "failed",
            currentStepType: "automation"
        });
        expect(matches(review, "failedSteps", "user-viewer")).toBe(true);
        expect(matches(review, "assignedToMe", requester.id)).toBe(false);
        expect(matches(review, "pool", "user-viewer")).toBe(false);
        expect(matches(review, "teamInReview", "user-viewer")).toBe(false);
        expect(matches(review, "myRequests", requester.id)).toBe(true);
        expect(matches(review, "myRequests", "user-viewer")).toBe(false);
    });

    it("filters the requester's own requests by the failed step state", () => {
        const review = toSaveData(createFailedAutomationReview());

        const failed = matchesReviewList(review, {
            list: "myRequests",
            viewerUserId: requester.id,
            viewerTeamIds: [],
            models: [ARTICLE_MODEL],
            where: { stepState: "failed" }
        });
        const inReview = matchesReviewList(review, {
            list: "myRequests",
            viewerUserId: requester.id,
            viewerTeamIds: [],
            models: [ARTICLE_MODEL],
            where: { stepState: "inReview" }
        });

        expect(failed).toBe(true);
        expect(inReview).toBe(false);
    });

    it("does not list a running automation step in failedSteps", () => {
        const review = toSaveData(createRunningAutomationReview());

        expect(matches(review, "failedSteps", "user-viewer")).toBe(false);
        // The automation actor owns it: nobody's assigned-to-me list shows it (A54).
        expect(matches(review, "assignedToMe", requester.id)).toBe(false);
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/domain/reviewPermissionPredicates.test.ts packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts packages/api-workflows/__tests__/domain/failedReviewList.test.ts 2>&1 | tail -50`
Expected: FAIL. Both predicate and flag test files cannot resolve `~/domain/review/canRestartByPermission.js`, so every test in them fails at import. `failedReviewList.test.ts` already passes (the list rule exists); it pins the behaviour and is the "phase 3 failed-list tests still green with real failed steps" proof.

- [ ] **Step 3: The predicate and the flag**

Create `packages/api-workflows/src/domain/review/canRestartByPermission.ts`:

```ts
import { Review } from "./Review.js";
import type { ReviewData, ReviewPermissionViewer } from "./types.js";

/**
 * Who may restart a failed step (spec 5.1, D34, R153): the requesting user, or a viewer with
 * `reassign` (full access included). Permission only (R41): the review's state is not read. App
 * wrappers authorize restart with it and leave state errors (`Workflows/Review/InvalidState`,
 * transition `"restart"`) to the engine; `getReviewViewerFlags` ANDs it with `Review.checkRestart`.
 * AI and automation actors carry the requester's id (D58) but are not the requester.
 */
export const canRestartByPermission = (
    review: ReviewData,
    viewer: ReviewPermissionViewer
): boolean => {
    if (viewer.permissions.reassign) {
        return true;
    }
    return Review.fromData(review).isRequestedBy(viewer.actor);
};
```

In `packages/api-workflows/src/domain/review/getReviewViewerFlags.ts`, add the import after `canReassignByPermission`:

```ts
import { canRestartByPermission } from "./canRestartByPermission.js";
```

replace the doc comment's last paragraph and the final return so the file reads:

```ts
/**
 * Viewer flags for one review and one reading user (spec 5.3, D5, D54). Pure.
 *
 * Start, take over, approve, reject, the reassign step rule and the restart step rule ask the
 * aggregate's own checks (R31), so a flag is true exactly when the transition would pass its
 * domain rules. Cancel, reassign and restart add the permission-only predicates (R41) the app
 * wrappers also authorize with, so the flag and the wrapper's check cannot drift. The wrappers
 * AND their target read access into every flag (R33, D133 point 7), through `applyTargetAccess`.
 *
 * `canRestart` is "the current step failed, and requester or `reassign`" (D34, R153): a rejected
 * step is final (D10) and `checkRestart` refuses it.
 */
export const getReviewViewerFlags = (data: ReviewData, viewer: ReviewViewer): ReviewViewerFlags => {
    const review = Review.fromData(data);
    const canCancel = review.checkCancel().isOk() && canCancelByPermission(data, viewer);

    const stepId = review.actionableStepId;
    if (!stepId) {
        // Every step is approved: nothing is left to act on.
        return {
            canStart: false,
            canTakeOver: false,
            canApprove: false,
            canReject: false,
            canCancel,
            canReassign: false,
            canRestart: false
        };
    }

    const params: ReviewActorCheckParams = {
        stepId,
        actor: viewer.actor,
        actorTeamIds: viewer.teamIds
    };
    return {
        canStart: review.checkStart(params).isOk(),
        canTakeOver: review.checkTakeOver(params).isOk(),
        canApprove: review.checkApprove(params).isOk(),
        canReject: review.checkReject(params).isOk(),
        canCancel,
        canReassign: canReassignByPermission(viewer) && review.checkReassign({ stepId }).isOk(),
        canRestart: canRestartByPermission(data, viewer) && review.checkRestart({ stepId }).isOk()
    };
};
```

In `packages/api-workflows/src/domain/review/types.ts`, in `ReviewViewerFlags`, replace the `canRestart` comment:

```ts
    /** The current step failed, and the viewer is the requester or holds `reassign` (D34, R153). */
    canRestart: boolean;
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/domain/reviewPermissionPredicates.test.ts packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts packages/api-workflows/__tests__/domain/failedReviewList.test.ts packages/api-workflows/__tests__/domain/applyTargetAccess.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time; these files are domain-only, so the run proves the OS test setup still loads them):
`yarn test:os packages/api-workflows/__tests__/domain/reviewPermissionPredicates.test.ts packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts packages/api-workflows/__tests__/domain/failedReviewList.test.ts packages/api-workflows/__tests__/domain/applyTargetAccess.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 5: Run the existing tests that cover the changed code**

Run: `yarn test packages/api-workflows/__tests__/review/matchesReviewList.test.ts packages/api-workflows/__tests__/review/ListReviews.test.ts packages/api-workflows/__tests__/review/ReviewRepositoryList.test.ts packages/api-workflows/__tests__/domain/wrapperBuildingBlocks.test.ts packages/api-workflows/__tests__/domain/Review.stepRun.test.ts 2>&1 | tail -50`, then the same files with `yarn test:os` (one run at a time). Expected: PASS (the phase 3 failed steps list tests stay green with real failed steps).

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows|background-tasks" | head`
Expected: no output.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the restart permission predicate and a real canRestart flag

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
