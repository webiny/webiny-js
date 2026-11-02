### Task 3: Viewer flags and the pick predicate

**Files:**
- Create: `packages/api-workflows/src/domain/workflow/canPickReviewer.ts`
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Modify: `packages/api-workflows/src/domain/review/types.ts`
- Create: `packages/api-workflows/src/domain/review/canCancelByPermission.ts`
- Create: `packages/api-workflows/src/domain/review/canReassignByPermission.ts`
- Create: `packages/api-workflows/src/domain/review/getReviewViewerFlags.ts`
- Create: `packages/api-workflows/__tests__/domain/canPickReviewer.test.ts`
- Create: `packages/api-workflows/__tests__/domain/reviewPermissionPredicates.test.ts`
- Create: `packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts`

**Interfaces:**
- Consumes: Task 1 `WorkflowsPermissionSet`; Task 2 `Review.checkStart`, `checkTakeOver`, `checkApprove`, `checkReject`, `checkCancel`, `checkReassign`, `actionableStepId`, `isRequestedBy`, `ReviewActorCheckParams`; `parseReviewStepConfig`, `REVIEW_STEP_TYPE` (`domain/workflow/WorkflowValidator.ts`); fixtures (`createReviewStep`, `createRequestedReview`, `createStartedReview`, `createWorkflow`, `toSaveData`, `poolResolution`, actors, team ids, `targetContext`, `ARTICLE_MODEL`, `NOW`, `expectOk`).
- Produces:
  - `canPickReviewer(step: WorkflowStep): boolean` — `canPick` per step at submit (spec 5.3, D22), computed from the workflow alone; `Review.request` uses it for its pick check, so the request and the flag cannot drift.
  - `interface ReviewPermissionViewer { actor: Actor; permissions: WorkflowsPermissionSet }` and `interface ReviewViewer extends ReviewPermissionViewer { teamIds: string[] }`.
  - Permission-only predicates (R41), used by `getReviewViewerFlags` and by the app wrappers: `canCancelByPermission(review: ReviewData, viewer: ReviewPermissionViewer): boolean` (requesting user, or `reassign` / full access; D25, D54) and `canReassignByPermission(viewer: ReviewPermissionViewer): boolean` (`reassign` / full access; D33). Neither reads the review's state: the engine reports state errors.
  - `interface ReviewViewerFlags { canStart: boolean; canTakeOver: boolean; canApprove: boolean; canReject: boolean; canCancel: boolean; canReassign: boolean; canRestart: boolean }`.
  - `getReviewViewerFlags(review: ReviewData, viewer: ReviewViewer): ReviewViewerFlags` — pure; reads a copy (`Review.fromData`), never changes the input.
  - Rules (R31, R33, R34, R41): start, take over, approve, reject = the aggregate's checks on the current step; `canCancel` = `checkCancel` and `canCancelByPermission`; `canReassign` = `canReassignByPermission` and `checkReassign`; `canRestart` = `false` until phase 5. Target access is not part of any flag (R33).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/domain/canPickReviewer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canPickReviewer } from "~/domain/workflow/canPickReviewer.js";
import { createReviewStep } from "~tests/__helpers/fixtures.js";

describe("canPickReviewer", () => {
    it("is true for a review step that allows a manual pick", () => {
        const step = createReviewStep({ id: "legal", title: "Legal", allowManualPick: true });

        expect(canPickReviewer(step)).toBe(true);
    });

    it("is false when the step does not allow a pick", () => {
        const step = createReviewStep({ id: "legal", title: "Legal", allowManualPick: false });

        expect(canPickReviewer(step)).toBe(false);
    });

    it("is false when the config is not a review config", () => {
        const step = {
            ...createReviewStep({ id: "legal", title: "Legal", allowManualPick: true }),
            config: { teams: "team-reviewers" }
        };

        expect(canPickReviewer(step)).toBe(false);
    });

    it("is false for a step that is not a review step", () => {
        const step = {
            ...createReviewStep({ id: "legal", title: "Legal", allowManualPick: true }),
            type: "automation"
        };

        expect(canPickReviewer(step)).toBe(false);
    });
});
```

Create `packages/api-workflows/__tests__/domain/reviewPermissionPredicates.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canCancelByPermission } from "~/domain/review/canCancelByPermission.js";
import { canReassignByPermission } from "~/domain/review/canReassignByPermission.js";
import type { Actor, ReviewData, ReviewPermissionViewer } from "~/domain/review/types.js";
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import {
    aiActor,
    createRequestedReview,
    createStartedReview,
    expectOk,
    requester,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

const NO_PERMISSIONS: WorkflowsPermissionSet = {
    fullAccess: false,
    editor: false,
    reassign: false
};
const EDITOR: WorkflowsPermissionSet = { fullAccess: false, editor: true, reassign: false };
const REASSIGN: WorkflowsPermissionSet = { fullAccess: false, editor: false, reassign: true };
const FULL_ACCESS: WorkflowsPermissionSet = { fullAccess: true, editor: true, reassign: true };

const viewerOf = (
    actor: Actor,
    permissions: WorkflowsPermissionSet = NO_PERMISSIONS
): ReviewPermissionViewer => {
    return { actor, permissions };
};

const requestedReview = (): ReviewData => toSaveData(createRequestedReview());

const cancelledReview = (): ReviewData => {
    const review = createStartedReview();
    expectOk(review.cancel({ actor: requester, now: LATER }));
    return toSaveData(review);
};

describe("canCancelByPermission", () => {
    it("lets the requesting user cancel (D25)", () => {
        expect(canCancelByPermission(requestedReview(), viewerOf(requester))).toBe(true);
    });

    it("lets reassign holders and full access cancel any review (D54)", () => {
        expect(canCancelByPermission(requestedReview(), viewerOf(reviewer, REASSIGN))).toBe(true);
        expect(canCancelByPermission(requestedReview(), viewerOf(reviewer, FULL_ACCESS))).toBe(
            true
        );
    });

    it("refuses other users, editors and AI actors carrying the requester's id (D58)", () => {
        expect(canCancelByPermission(requestedReview(), viewerOf(reviewer))).toBe(false);
        expect(canCancelByPermission(requestedReview(), viewerOf(reviewer, EDITOR))).toBe(false);
        expect(canCancelByPermission(requestedReview(), viewerOf(aiActor))).toBe(false);
    });

    it("ignores the review state, which the engine reports (R41)", () => {
        expect(canCancelByPermission(cancelledReview(), viewerOf(requester))).toBe(true);
    });
});

describe("canReassignByPermission", () => {
    it("grants reassign only with reassign or full access (D33)", () => {
        expect(canReassignByPermission(viewerOf(reviewer, REASSIGN))).toBe(true);
        expect(canReassignByPermission(viewerOf(reviewer, FULL_ACCESS))).toBe(true);
        expect(canReassignByPermission(viewerOf(reviewer, EDITOR))).toBe(false);
        expect(canReassignByPermission(viewerOf(requester))).toBe(false);
    });
});
```

Create `packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Review } from "~/domain/review/Review.js";
import { getReviewViewerFlags } from "~/domain/review/getReviewViewerFlags.js";
import type {
    Actor,
    ReviewData,
    ReviewViewer,
    ReviewViewerFlags
} from "~/domain/review/types.js";
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import {
    aiActor,
    ARTICLE_MODEL,
    createRequestedReview,
    createStartedReview,
    createWorkflow,
    expectOk,
    NOW,
    OTHER_TEAM_ID,
    otherReviewer,
    poolResolution,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    targetContext,
    toSaveData
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

const NO_PERMISSIONS: WorkflowsPermissionSet = {
    fullAccess: false,
    editor: false,
    reassign: false
};
const REASSIGN: WorkflowsPermissionSet = { fullAccess: false, editor: false, reassign: true };
const FULL_ACCESS: WorkflowsPermissionSet = { fullAccess: true, editor: true, reassign: true };

const NO_FLAGS: ReviewViewerFlags = {
    canStart: false,
    canTakeOver: false,
    canApprove: false,
    canReject: false,
    canCancel: false,
    canReassign: false,
    canRestart: false
};

interface ViewerOverrides {
    teamIds?: string[];
    permissions?: WorkflowsPermissionSet;
}

const viewerOf = (actor: Actor, overrides: ViewerOverrides = {}): ReviewViewer => {
    return {
        actor,
        teamIds: overrides.teamIds ?? [REVIEW_TEAM_ID],
        permissions: overrides.permissions ?? NO_PERMISSIONS
    };
};

/** A user outside the step's teams. */
const outsiderOf = (permissions: WorkflowsPermissionSet = NO_PERMISSIONS): ReviewViewer => {
    return viewerOf(otherReviewer, { teamIds: [OTHER_TEAM_ID], permissions });
};

const legal = (actor: Actor) => {
    return { stepId: "legal", actor, actorTeamIds: [REVIEW_TEAM_ID], now: LATER };
};

/** "legal" is `awaiting` in the pool. */
const awaitingReview = (): ReviewData => toSaveData(createRequestedReview());

/** "legal" is `inReview`, held by `reviewer`. */
const inReviewReview = (): ReviewData => toSaveData(createStartedReview());

/** "legal" is `inReview`, held by an AI actor. */
const aiOwnedReview = (): ReviewData => {
    const review = expectOk(
        Review.request({
            id: "review-1",
            workflow: createWorkflow(),
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article 1",
            targetContext,
            picks: [],
            requester,
            now: NOW
        })
    );
    expectOk(
        review.reach({
            resolution: {
                owner: aiActor,
                candidateTeamIds: [REVIEW_TEAM_ID],
                assignment: { source: "strategy" }
            },
            actor: requester,
            now: NOW
        })
    );
    return toSaveData(review);
};

const approvedReview = (): ReviewData => {
    const review = createStartedReview();
    expectOk(review.approve({ ...legal(reviewer), comment: null }));
    expectOk(review.reach({ resolution: poolResolution(), actor: reviewer, now: LATER }));
    expectOk(review.start({ ...legal(reviewer), stepId: "editorial" }));
    expectOk(review.approve({ ...legal(reviewer), stepId: "editorial", comment: null }));
    return toSaveData(review);
};

const rejectedReview = (): ReviewData => {
    const review = createStartedReview();
    expectOk(review.reject({ ...legal(reviewer), comment: "Needs sources." }));
    return toSaveData(review);
};

const cancelledReview = (): ReviewData => {
    const review = createStartedReview();
    expectOk(review.cancel({ actor: requester, now: LATER }));
    return toSaveData(review);
};

/** What the transitions themselves allow for the viewer on the current step. */
const transitionResults = (data: ReviewData, viewer: ReviewViewer) => {
    const params = {
        stepId: data.currentStepId ?? data.steps[0].id,
        actor: viewer.actor,
        actorTeamIds: viewer.teamIds,
        now: LATER
    };
    return {
        canStart: Review.fromData(data).start(params).isOk(),
        canTakeOver: Review.fromData(data).takeOver(params).isOk(),
        canApprove: Review.fromData(data).approve({ ...params, comment: null }).isOk(),
        canReject: Review.fromData(data).reject({ ...params, comment: null }).isOk()
    };
};

describe("getReviewViewerFlags", () => {
    it("lets a candidate start an awaiting step", () => {
        expect(getReviewViewerFlags(awaitingReview(), viewerOf(reviewer))).toEqual({
            ...NO_FLAGS,
            canStart: true
        });
    });

    it("lets the requester cancel, but not start, their own review (D25)", () => {
        expect(getReviewViewerFlags(awaitingReview(), viewerOf(requester))).toEqual({
            ...NO_FLAGS,
            canCancel: true
        });
    });

    it("gives a user outside the step's teams nothing", () => {
        expect(getReviewViewerFlags(awaitingReview(), outsiderOf())).toEqual(NO_FLAGS);
    });

    it("lets reassign holders cancel and reassign (D33, D54)", () => {
        expect(getReviewViewerFlags(awaitingReview(), outsiderOf(REASSIGN))).toEqual({
            ...NO_FLAGS,
            canCancel: true,
            canReassign: true
        });
    });

    it("treats full access like reassign", () => {
        expect(getReviewViewerFlags(inReviewReview(), outsiderOf(FULL_ACCESS))).toEqual({
            ...NO_FLAGS,
            canCancel: true,
            canReassign: true
        });
    });

    it("lets the owner approve or reject, and another candidate take over (D32)", () => {
        const data = inReviewReview();

        expect(getReviewViewerFlags(data, viewerOf(reviewer))).toEqual({
            ...NO_FLAGS,
            canApprove: true,
            canReject: true
        });
        expect(getReviewViewerFlags(data, viewerOf(otherReviewer))).toEqual({
            ...NO_FLAGS,
            canTakeOver: true
        });
    });

    it("offers no take over or reassign on an AI step (D9, D33)", () => {
        const data = aiOwnedReview();

        expect(
            getReviewViewerFlags(data, viewerOf(otherReviewer, { permissions: REASSIGN }))
        ).toEqual({ ...NO_FLAGS, canCancel: true });
        // The AI owner carries the requester's id (D58); the requester still cannot decide.
        expect(getReviewViewerFlags(data, viewerOf(requester))).toEqual({
            ...NO_FLAGS,
            canCancel: true
        });
    });

    it.each([
        ["approved", approvedReview],
        ["rejected", rejectedReview],
        ["cancelled", cancelledReview]
    ])("offers nothing on a %s review, not even restart", (_state, createData) => {
        const data = createData();

        expect(
            getReviewViewerFlags(data, viewerOf(requester, { permissions: FULL_ACCESS }))
        ).toEqual(NO_FLAGS);
        expect(getReviewViewerFlags(data, viewerOf(reviewer))).toEqual(NO_FLAGS);
    });

    it("agrees with the transitions for every review and viewer", () => {
        const reviews = [
            awaitingReview(),
            inReviewReview(),
            aiOwnedReview(),
            approvedReview(),
            rejectedReview(),
            cancelledReview()
        ];
        const viewers = [
            viewerOf(requester),
            viewerOf(reviewer),
            viewerOf(otherReviewer),
            viewerOf(aiActor),
            outsiderOf(FULL_ACCESS)
        ];

        for (const data of reviews) {
            for (const viewer of viewers) {
                expect(getReviewViewerFlags(data, viewer)).toMatchObject(
                    transitionResults(data, viewer)
                );
            }
        }
    });

    it("does not change the review it reads", () => {
        const data = inReviewReview();
        const copy = structuredClone(data);

        getReviewViewerFlags(data, viewerOf(otherReviewer, { permissions: FULL_ACCESS }));

        expect(data).toEqual(copy);
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/domain/canPickReviewer.test.ts packages/api-workflows/__tests__/domain/reviewPermissionPredicates.test.ts packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/workflow/canPickReviewer.js`, `~/domain/review/canCancelByPermission.js`, `~/domain/review/canReassignByPermission.js` and `~/domain/review/getReviewViewerFlags.js`.

- [ ] **Step 3: Add the pick predicate and use it in request**

Create `packages/api-workflows/src/domain/workflow/canPickReviewer.ts`:

```ts
import type { WorkflowStep } from "./types.js";
import { parseReviewStepConfig } from "./reviewStepConfigSchema.js";
import { REVIEW_STEP_TYPE } from "./WorkflowValidator.js";

/**
 * `canPick` for one step at submit (spec 5.3, D22): a review step whose config allows a manual
 * pick. Computed from the workflow alone. The request-time conditions (write access to the
 * target, D77; which users may be picked, D33/D61) belong to the app wrapper (phase 2) and to
 * routing (phase 4).
 */
export const canPickReviewer = (step: WorkflowStep): boolean => {
    if (step.type !== REVIEW_STEP_TYPE) {
        return false;
    }
    const config = parseReviewStepConfig(step.config);
    return config?.assignment.allowManualPick === true;
};
```

In `packages/api-workflows/src/domain/review/Review.ts`, replace the import

```ts
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
```

with

```ts
import { canPickReviewer } from "~/domain/workflow/canPickReviewer.js";
```

and in `request`, replace

```ts
            const config = parseReviewStepConfig(step.config);
            if (!config || !config.assignment.allowManualPick) {
```

with

```ts
            if (!canPickReviewer(step)) {
```

- [ ] **Step 4: Add the viewer types**

In `packages/api-workflows/src/domain/review/types.ts`, add at the top

```ts
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
```

and append at the end of the file:

```ts

/**
 * The permission side of a reading user (spec 8): who acts and what the `workflows` permission
 * grants. Enough for the permission-only predicates (R41); no team lookup needed.
 */
export interface ReviewPermissionViewer {
    actor: Actor;
    permissions: WorkflowsPermissionSet;
}

/**
 * The reading user (spec 5.3). Built by the app wrapper from the identity (D132), e.g. through
 * `CurrentReviewViewer`; AI and automation callers never need one.
 */
export interface ReviewViewer extends ReviewPermissionViewer {
    teamIds: string[];
}

/**
 * Per-viewer flags for one review (spec 5.3, D5, D54). Domain rules and workflows permissions
 * only: the app wrapper ANDs its target access check (read for start, take over, approve, reject;
 * spec 5.1) before showing or allowing an action (R33).
 */
export interface ReviewViewerFlags {
    canStart: boolean;
    canTakeOver: boolean;
    canApprove: boolean;
    canReject: boolean;
    canCancel: boolean;
    canReassign: boolean;
    /** Always `false` until phase 5 adds failed steps (D34). */
    canRestart: boolean;
}
```

- [ ] **Step 5: Add the permission-only predicates and the flag computation**

Create `packages/api-workflows/src/domain/review/canCancelByPermission.ts`:

```ts
import { Review } from "./Review.js";
import type { ReviewData, ReviewPermissionViewer } from "./types.js";

/**
 * Who may cancel a review (D25, D54): the requesting user, or a viewer with `reassign` (full
 * access included). Permission only (R41): the review's state is not read. App wrappers authorize
 * cancel with it and leave state errors (`Workflows/Review/InvalidState`) to the engine;
 * `getReviewViewerFlags` ANDs it with `Review.checkCancel`. AI and automation actors carry the
 * requester's id (D58) but are not the requester.
 */
export const canCancelByPermission = (
    review: ReviewData,
    viewer: ReviewPermissionViewer
): boolean => {
    if (viewer.permissions.reassign) {
        return true;
    }
    return Review.fromData(review).isRequestedBy(viewer.actor);
};
```

Create `packages/api-workflows/src/domain/review/canReassignByPermission.ts`:

```ts
import type { ReviewPermissionViewer } from "./types.js";

/**
 * Who may reassign (D33): a viewer with `reassign` (full access included). Permission only (R41):
 * whether the step can be reassigned is the engine's `checkReassign` / reassign transition, which
 * reports its own state errors.
 */
export const canReassignByPermission = (viewer: ReviewPermissionViewer): boolean => {
    return viewer.permissions.reassign;
};
```

Create `packages/api-workflows/src/domain/review/getReviewViewerFlags.ts`:

```ts
import { Review, type ReviewActorCheckParams } from "./Review.js";
import { canCancelByPermission } from "./canCancelByPermission.js";
import { canReassignByPermission } from "./canReassignByPermission.js";
import type { ReviewData, ReviewViewer, ReviewViewerFlags } from "./types.js";

/**
 * Viewer flags for one review and one reading user (spec 5.3, D5, D54). Pure.
 *
 * Start, take over, approve, reject and the reassign step rule ask the aggregate's own checks
 * (R31), so a flag is true exactly when the transition would pass its domain rules. Cancel and
 * reassign add the permission-only predicates (R41) the app wrappers also authorize with, so the
 * flag and the wrapper's check cannot drift. The wrappers AND their target access check into
 * every flag (R33).
 *
 * `canRestart` stays `false` until phase 5 adds failed steps; then it is "current step failed,
 * and requester or `reassign`" (D34).
 */
export const getReviewViewerFlags = (
    data: ReviewData,
    viewer: ReviewViewer
): ReviewViewerFlags => {
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
        canRestart: false
    };
};
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/domain 2>&1 | tail -50`
Expected: PASS (`canPickReviewer.test.ts` 4 tests, `reviewPermissionPredicates.test.ts` 5 tests, `getReviewViewerFlags.test.ts` 12 tests incl. the 3 `it.each` cases, and the 1a `Review.request` pick tests unchanged).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: not runnable locally (A9); record "not run" and leave it to CI.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): compute review viewer flags and permission predicates

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
