### Task 13: `TargetReviewPresenter` and the message tables

R202, R212, R216, R217, R225, R226 (as amended by R-h), R232, R234, R-a, R-c, R-e, R-f, R-i, R-k, R-l; D5, D54, D75, D79, D80, D85, D107, D121, D126; QBZ-1, QBZ-36, QBZ-52, QBZ-53, QBZ-58, QBZ-59, QBZ-64, QBZ-79, QBZ-83, QBZ-96; Review Focus 1, 3, 4, 5, 12. The state behind the review bar of one open editor: it asks the app's use cases whether the namespace has a workflow and whether the revision has a review, turns the answer into one render-ready view model (R234), and owns the rules that lock the editor (R226). Everything is app-neutral: the presenter knows no gateway and no app, only the `IReviewUseCases` passed to `init`.

- **Presenter** (`TargetReviewPresenterImpl`, registered transient, dependencies `[EventPublisher, ReviewActivity, IdentityContext]`; the viewer's team ids come from `IdentityContext.getIdentity().teams`, R232, R247):
  - `init(params)` resets to `loading` and loads; `refresh()` loads again **without leaving the current view** (status stays, `vm.busy` is true) so the bar does not flash; both run `getBoundWorkflow(namespace)` (`null` -> `noWorkflow`, no review call) then `getTargetReview(target)` (`null` or a `cancelled` review -> `none`, a review -> `active`, D75).
  - A `GraphQLOperationError` with code `ReviewErrorCode.NotAuthorized` is `failed` with `failureKind: "noAccess"`; any other error is `failed` with `failureKind: "error"` (R225). A failed load publishes no event (an unknown state must not overwrite the list cache).
  - After every **settled successful** load the presenter publishes `ReviewChangedEvent({ namespace, targetId, targetRevisionId, review })` (`review: null` for `noWorkflow` and `none`); `targetId` is the review's own, or the part of the revision id before `#` when there is no review. A publisher that rejects (a failing cache writer) is swallowed after the state is applied: the bar must not break because a list cache could not be updated.
  - Every load takes a token; a response of an older load or of an old target (after `dispose` or a second `init`) is ignored (Review Focus 5).
  - `actionDone()` closes the open action, calls `refresh()` and then `ReviewActivity.notify({ namespace, source: "own" })` (the dialog shows its own toast, Task 15). `openAction(kind, stepId)` / `closeAction()` hold the action the bar opens; `dispose()` resets everything to the initial state (R212, a presenter instance belongs to one view, and the editor session singleton of Task 19 reuses one instance, so `dispose` must reset).
  - `setContext({ targetTitle, canRequest, isPublished, isUnpublished })` replaces the four context values after `init` without reloading (the editors call it when the form's save state or the publish state changes; additive to the contract, see Contract notes). `isUnpublished` is true for a revision that was published before and is not published now (R-h).
- **View model** (render-ready only, R234): built by the pure `buildTargetReviewViewModel` from the presenter's private state, so the rules are tested without MobX. The status is `loading | failed | noWorkflow | none | active`; `reviewKind` (R-a) is `none | inProgress | approved | rejected`; `targetTitle`, `namespace` and `targetRevisionId` (R-f) let `ReviewBar` and the request dialog read the target from the presenter instead of taking props.
- **Pure files** (one function each, all in `.../targetReview/`):
  - `getReviewMessage` (README 6 table; R225 loading and failure texts; the shared QBZ-59 no-access sentence `NO_ACCESS_MESSAGE` (R-i, `presentation/noAccessMessage.ts`, also used by Tasks 15 and 18); "Waiting in the {names} team pool", names being the viewer's own teams among the step's `candidateTeams` joined " and " (QBZ-25, R232, R247; `viewerTeamIds` is a parameter), else all the step's `candidateTeams` joined ", ", none resolved "Waiting in the team pool"; owner is the viewer = `flags.canApprove` ("You are reviewing this step"; the client never learns the viewer's id, approving is owner-only on the server); someone else "{Name} is reviewing"; AI and automation owners by the step title (R216, QBZ-79); approved and published "Approved and published", approved, not published and `isUnpublished` "Approved and unpublished. Publishing again needs no new review.", otherwise "Approved, ready to publish" (R226 as amended by R-h); rejected through `getRejectionText`; a `running` or `failed` step falls back to the generic "{Name} is reviewing" (R203)).
  - `getRejectionText` (R216: "Rejected at {step}: “{comment}”", the comment cut to 80 characters with "…"; no comment "Rejected at {step}.").
  - `getStepOwnerLabel` (user name, "A user" when blank; AI and automation: the step title; no owner on an awaiting step: "Team pool ({names})" or "Team pool"; a pending step "Not reached yet").
  - `getReviewStateTag` ("Review: In progress | Approved | Rejected", QBZ-52; Rejected is `neutral-dark`, only Failed is destructive, Q30), `getStepStateTag` (labels and variants of the six step states, used by the popover here and the drawer in Task 18; `failed` is `destructive` (red), `rejected` is `neutral-dark`, no other step state is red, R239, Q24).
  - `getReviewActions` (README 6 labels and icons, ordered ghost -> tertiary -> secondary -> primary, only what the server `flags` allow; "Request review" only without an active review and with `canRequest`, R217; no Restart, 8b), `getEditorRules` (R226, R240; switches on `status`, `reviewKind` and `isUnpublished`; an unpublished revision with no review may publish (Q19, `publishDisabledReason` null); a revision with no review: "Publishing needs an approved review. Request a review first.", a rejected one: "This revision was rejected. Create a new revision, then request a new review.", in review: "This revision is in review. Publishing is allowed once every step approves."), `getReviewKind`, `getReviewProgress`, `getDisplayStep` (the step the bar describes: the current step, else the rejecting step, else the last), `getTargetIdFromRevisionId`, `getTeamNames`.

**Files:**
- Create: `packages/app-workflows/src/review/presentation/targetReview/abstractions.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getTeamNames.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getStepOwnerLabel.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getRejectionText.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getReviewStateTag.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getStepStateTag.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getDisplayStep.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getReviewMessage.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getReviewActions.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/moveBlockedInReview.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getEditorRules.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getReviewProgress.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getTargetIdFromRevisionId.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/feature.ts`
- Create: `packages/app-workflows/src/review/presentation/noAccessMessage.ts`
- Create: `packages/app-workflows/src/review/testing/reviewTarget.ts`, `createActor.ts`, `createStep.ts`, `createFlags.ts`, `createWorkflow.ts` (pure builders, one per file; `createReview` and `createReviewWithFlags` stay in Task 8's `reviewFixtures.ts`, R243)
- Create: `packages/app-workflows/src/review/testing/fakeReviewUseCases.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getReviewKind.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getReviewMessage.test.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getEditorRules.test.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getReviewActions.test.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/stepLabels.test.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts`
- Modify: `packages/app-workflows/src/app.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx` (Task 10's file)

**Interfaces:**
- Consumes:
  - Task 8 (`~/review/...`, all under `packages/app-workflows/src/review/`): `domain/types.js` (`Review`, `ReviewStep`, `ReviewWithFlags`, `ReviewViewerFlags`, `ReviewTarget`, `ReviewActor`, `ReviewWorkflow` with `assignedAutomatically` on its steps), `testing/reviewFixtures.js` (`createReview(overrides)` and `createReviewWithFlags(review, flags)`, positional; the tests assume Task 8's defaults: one awaiting step "Editorial check" with id `step-1`, no teams, title "Spring campaign", id `review-1`, namespace `cms.article`, requester "Maja Kos"), `domain/ReviewState.js` (`ReviewState`, `ReviewStateValue`), `domain/StepState.js` (`StepState`, `StepStateValue`), `domain/ReviewErrorCode.js` (`ReviewErrorCode`), `useCases/IReviewUseCases.js` (`IReviewUseCases`). verify: the const objects expose `ReviewState.InProgress | Approved | Rejected | Cancelled` and `StepState.Pending | Awaiting | InReview | Approved | Rejected | Failed` with the server values `"inProgress"`, `"awaiting"`, `"inReview"` etc., and `IReviewUseCases` has the fourteen methods (`getBoundWorkflow`, `getTargetReview`, `getReview`, `listStepCandidates`, `listReviewStepCandidates`, `requestReview`, `startStep`, `takeOverStep`, `reassignStep`, `approveStep`, `rejectStep`, `cancelReview`, `listReviews`, `cancelForDelete`).
  - Task 10: `ReviewActivity` (`~/review/activity/abstractions.js`, `IReviewActivity.notify(signal)`), `ReviewChangedEvent` (`~/review/events/ReviewChangedEvent.js`, `new ReviewChangedEvent(payload)`).
  - Task 6: `GraphQLOperationError` (`@webiny/app/errors/index.js`, input `{ message, code?, data? }`).
  - Existing (verified): `EventPublisher` (`@webiny/app/features/eventPublisher/abstractions.js`, `publish(event): Promise<void>`), `createAbstraction`, `createFeature` (`@webiny/feature/admin`), `Abstraction.createImplementation({ implementation, dependencies })` (as `packages/app-workflows/src/presentation/workflowState/WorkflowStatePresenter.ts`), `Container` (`@webiny/di`, `register` is transient by default, `registerInstance`), mobx 7 `makeAutoObservable` and the `observableRef` annotation (mobx 7.0.3 has no `observable.ref`).
- Produces (consumed by Tasks 14, 15, 18, 19, 20, 22, 23, 25):
  - `abstractions.ts`: `TargetReviewStatus`, `TargetReviewFailureKind`, `TargetReviewKind`, `TargetReviewActionKind` (`"request" | "start" | "takeOver" | "reassign" | "approve" | "reject" | "cancel"`), `TargetReviewActionIcon`, `TargetReviewEmphasis`, `TargetReviewTagVariant`, `TargetReviewTile`, `TargetReviewTag`, `TargetReviewActionVm`, `TargetReviewSegmentVm`, `TargetReviewProgressVm`, `TargetReviewOpenAction`, `ITargetReviewViewModel`, `TargetReviewContext`, `TargetReviewInitParams`, `ITargetReviewPresenter`, token `TargetReviewPresenter` (`"Workflows/TargetReviewPresenter"`) with namespace `Interface` and `ViewModel`.
  - `TargetReviewPresenterFeature` (`resolve` -> `{ presenter }`), registered by `WorkflowsAdminApp` inside the gate.
  - `MOVE_BLOCKED_IN_REVIEW` (`targetReview/moveBlockedInReview.ts`, "Can’t move while this revision is in review."), exported for Task 21's CMS list Move gate.
  - Pure functions as above; `getReviewActions({ flags, stepId, canRequest })` and `getStepStateTag(state)` are reused by Tasks 14 and 18; `getStepOwnerLabel(step)` by Tasks 14 and 18.
  - `NO_ACCESS_MESSAGE` (`presentation/noAccessMessage.ts`), reused by Tasks 15, 17 and 18.
  - `src/review/testing/`: pure builders `createActor`, `createStep`, `createFlags`, `createWorkflow`, `TARGET` (`reviewTarget.ts`), one per file, and the vitest fake `createFakeUseCases` / `FakeReviewUseCases` (all fourteen methods) in `fakeReviewUseCases.ts`, reused by Tasks 14-19 and the later list tasks (co-located tests import `~/review/testing/<file>.js`, other packages `@webiny/app-workflows/review/testing/<file>.js`).

**Test runner note:** `packages/app-workflows` is an admin package (not `-es`/`-os`): `yarn test <path>` only, jsdom (Task 8's `vitest.config.ts`). The composition-root assertions extend Task 10's `app.test.tsx` (jsdom, classic JSX runtime).

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/review/testing/reviewTarget.ts`:

```ts
import type { ReviewTarget } from "~/review/domain/types.js";

export const TARGET: ReviewTarget = {
    namespace: "cms.article",
    targetRevisionId: "entry-1#0001"
};
```

Create `packages/app-workflows/src/review/testing/createActor.ts`:

```ts
import type { ReviewActor } from "~/review/domain/types.js";

export const createActor = (overrides: Partial<ReviewActor> = {}): ReviewActor => {
    return {
        type: "user",
        id: "user-1",
        displayName: "Maja Kos",
        identityType: null,
        ...overrides
    };
};
```

Create `packages/app-workflows/src/review/testing/createStep.ts`:

```ts
import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";

export const createStep = (overrides: Partial<ReviewStep> = {}): ReviewStep => {
    return {
        id: "step-1",
        title: "Editorial check",
        color: "#FA5723",
        description: null,
        type: "review",
        state: StepState.Pending,
        owner: null,
        comment: null,
        pickedUserId: null,
        candidateTeamIds: [],
        candidateTeams: [],
        assignmentSource: null,
        assignment: null,
        reachedOn: null,
        startedOn: null,
        finishedOn: null,
        taskId: null,
        runs: [],
        issues: [],
        assignments: null,
        ...overrides
    };
};
```

Create `packages/app-workflows/src/review/testing/createFlags.ts`:

```ts
import type { ReviewViewerFlags } from "~/review/domain/types.js";

export const createFlags = (overrides: Partial<ReviewViewerFlags> = {}): ReviewViewerFlags => {
    return {
        canStart: false,
        canTakeOver: false,
        canApprove: false,
        canReject: false,
        canCancel: false,
        canReassign: false,
        canRestart: false,
        ...overrides
    };
};
```

Create `packages/app-workflows/src/review/testing/createWorkflow.ts`:

```ts
import type { ReviewWorkflow } from "~/review/domain/types.js";
import { TARGET } from "./reviewTarget.js";

export const createWorkflow = (overrides: Partial<ReviewWorkflow> = {}): ReviewWorkflow => {
    return {
        id: "workflow-1",
        name: "Content review",
        namespaces: [TARGET.namespace],
        steps: [
            {
                id: "step-1",
                title: "Editorial check",
                color: "#FA5723",
                description: null,
                type: "review",
                allowManualPick: false,
                assignedAutomatically: false
            }
        ],
        ...overrides
    };
};
```

Create `packages/app-workflows/src/review/testing/fakeReviewUseCases.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createWorkflow } from "~/review/testing/createWorkflow.js";

export interface FakeReviewUseCases extends IReviewUseCases {
    getBoundWorkflow: Mock<IReviewUseCases["getBoundWorkflow"]>;
    getTargetReview: Mock<IReviewUseCases["getTargetReview"]>;
    getReview: Mock<IReviewUseCases["getReview"]>;
    listStepCandidates: Mock<IReviewUseCases["listStepCandidates"]>;
    listReviewStepCandidates: Mock<IReviewUseCases["listReviewStepCandidates"]>;
    requestReview: Mock<IReviewUseCases["requestReview"]>;
    startStep: Mock<IReviewUseCases["startStep"]>;
    takeOverStep: Mock<IReviewUseCases["takeOverStep"]>;
    reassignStep: Mock<IReviewUseCases["reassignStep"]>;
    approveStep: Mock<IReviewUseCases["approveStep"]>;
    rejectStep: Mock<IReviewUseCases["rejectStep"]>;
    cancelReview: Mock<IReviewUseCases["cancelReview"]>;
    listReviews: Mock<IReviewUseCases["listReviews"]>;
    cancelForDelete: Mock<IReviewUseCases["cancelForDelete"]>;
}

/**
 * Fake use cases with sensible defaults: the namespace has a workflow, the revision has no review,
 * every action resolves the default review, the list is empty and nothing is cancelled for delete
 * (all fourteen methods of `IReviewUseCases`). Tests override single methods with `mockResolvedValue`
 * or `mockRejectedValue`.
 */
export const createFakeUseCases = (): FakeReviewUseCases => {
    const review = createReview();
    const workflow = createWorkflow();
    const reviewWithFlags = createReviewWithFlags(review);
    return {
        getBoundWorkflow: vi.fn().mockResolvedValue(workflow),
        getTargetReview: vi.fn().mockResolvedValue(null),
        getReview: vi.fn().mockResolvedValue(reviewWithFlags),
        listStepCandidates: vi.fn().mockResolvedValue([]),
        listReviewStepCandidates: vi.fn().mockResolvedValue([]),
        requestReview: vi.fn().mockResolvedValue(review),
        startStep: vi.fn().mockResolvedValue(review),
        takeOverStep: vi.fn().mockResolvedValue(review),
        reassignStep: vi.fn().mockResolvedValue(review),
        approveStep: vi.fn().mockResolvedValue(review),
        rejectStep: vi.fn().mockResolvedValue(review),
        cancelReview: vi.fn().mockResolvedValue(review),
        listReviews: vi.fn().mockResolvedValue({ items: [], meta: { cursor: null, hasMoreItems: false } }),
        cancelForDelete: vi.fn().mockResolvedValue([])
    };
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/getReviewMessage.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getReviewMessage } from "./getReviewMessage.js";
import type { ReviewMessageParams } from "./getReviewMessage.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";

const LOCK_IN_REVIEW = "Editing, publishing and moving are locked while this revision is in review.";
const LOCK_APPROVED =
    "Editing is locked. To make changes, create a new revision; it needs a new review.";
const LOCK_REJECTED =
    "This revision is locked for good. Create a new revision to fix it, then request a new review.";

const params = (overrides: Partial<ReviewMessageParams> = {}): ReviewMessageParams => {
    return {
        status: "active",
        failureKind: null,
        review: null,
        flags: null,
        isPublished: false,
        isUnpublished: false,
        viewerTeamIds: [],
        ...overrides
    };
};

const inReview = (owner = createActor({ id: "user-2", displayName: "Luka Perić" })) => {
    return createReview({
        currentStepId: "step-2",
        currentStepState: StepState.InReview,
        currentOwnerId: owner.id,
        steps: [
            createStep({ id: "step-1", title: "Editorial check", state: StepState.Approved }),
            createStep({
                id: "step-2",
                title: "Legal sign-off",
                state: StepState.InReview,
                owner
            })
        ]
    });
};

describe("getReviewMessage", () => {
    it("explains the loading state", () => {
        expect(getReviewMessage(params({ status: "loading" }))).toEqual({
            message: "Loading review status…",
            lockText: null
        });
    });

    it("explains a failed load", () => {
        expect(getReviewMessage(params({ status: "failed", failureKind: "error" }))).toEqual({
            message: "Could not load the review status",
            lockText: "Editing and publishing are unavailable until it loads."
        });
    });

    it("explains a read without access and hides the lock text", () => {
        expect(getReviewMessage(params({ status: "failed", failureKind: "noAccess" }))).toEqual({
            message:
                "You don't have access to this content or its review. Ask an administrator if you need it.",
            lockText: null
        });
    });

    it("has no text without a workflow", () => {
        expect(getReviewMessage(params({ status: "noWorkflow" }))).toEqual({
            message: "",
            lockText: null
        });
    });

    it("asks for a review when there is none", () => {
        expect(getReviewMessage(params({ status: "none" }))).toEqual({
            message: "This content needs review before publishing",
            lockText: "Publishing needs an approved review."
        });
    });

    it("explains a revision published before the workflow existed", () => {
        expect(getReviewMessage(params({ status: "none", isPublished: true }))).toEqual({
            message: "This content needs review before publishing (applies to new revisions)",
            lockText:
                "This revision was published before the workflow existed. Create a new revision to change it."
        });
    });

    it("names the team pools of a step that waits for someone to start it", () => {
        const review = createReview({
            currentStepState: StepState.Awaiting,
            steps: [
                createStep({
                    state: StepState.Awaiting,
                    candidateTeams: [
                        { id: "t1", name: "Marketing" },
                        { id: "t2", name: "Compliance" }
                    ]
                })
            ]
        });
        expect(getReviewMessage(params({ review, flags: createFlags() }))).toEqual({
            message: "Waiting in the Marketing, Compliance team pool",
            lockText: LOCK_IN_REVIEW
        });
    });

    it("names the viewer's own teams among the step's teams joined with 'and' (QBZ-25, R232)", () => {
        const review = createReview({
            currentStepState: StepState.Awaiting,
            steps: [
                createStep({
                    state: StepState.Awaiting,
                    candidateTeams: [
                        { id: "t1", name: "Marketing" },
                        { id: "t2", name: "Legal" },
                        { id: "t3", name: "Compliance" }
                    ]
                })
            ]
        });
        expect(
            getReviewMessage(params({ review, flags: createFlags(), viewerTeamIds: ["t1", "t3"] }))
                .message
        ).toBe("Waiting in the Marketing and Compliance team pool");
    });

    it("names all the step's teams for a viewer outside them", () => {
        const review = createReview({
            currentStepState: StepState.Awaiting,
            steps: [
                createStep({
                    state: StepState.Awaiting,
                    candidateTeams: [
                        { id: "t1", name: "Marketing" },
                        { id: "t2", name: "Legal" }
                    ]
                })
            ]
        });
        expect(
            getReviewMessage(params({ review, flags: createFlags(), viewerTeamIds: ["other"] }))
                .message
        ).toBe("Waiting in the Marketing, Legal team pool");
    });

    it("does not invent a team name when none resolved", () => {
        const review = createReview();
        expect(getReviewMessage(params({ review, flags: createFlags() })).message).toBe(
            "Waiting in the team pool"
        );
    });

    it("tells the owner that they are reviewing", () => {
        const message = getReviewMessage(
            params({ review: inReview(), flags: createFlags({ canApprove: true, canReject: true }) })
        );
        expect(message).toEqual({
            message: "You are reviewing this step",
            lockText: LOCK_IN_REVIEW
        });
    });

    it("names someone else who is reviewing", () => {
        const message = getReviewMessage(params({ review: inReview(), flags: createFlags() }));
        expect(message.message).toBe("Luka Perić is reviewing");
    });

    it("names an AI or automation owner by the step title, never by the model", () => {
        const owner = createActor({ type: "ai", id: "user-1", displayName: "gpt-model-9" });
        const message = getReviewMessage(params({ review: inReview(owner), flags: createFlags() }));
        expect(message.message).toBe("Legal sign-off is reviewing");
    });

    it("falls back to the generic text for a failed step", () => {
        const owner = createActor({ type: "automation", displayName: "Send webhook" });
        const review = createReview({
            currentStepId: "step-1",
            currentStepState: StepState.Failed,
            steps: [createStep({ title: "Notify web team", state: StepState.Failed, owner })]
        });
        expect(getReviewMessage(params({ review, flags: createFlags() })).message).toBe(
            "Notify web team is reviewing"
        );
    });

    it("reads approved and published", () => {
        const review = createReview({
            state: ReviewState.Approved,
            currentStepId: null,
            currentStepState: null,
            steps: [createStep({ state: StepState.Approved })]
        });
        expect(getReviewMessage(params({ review, isPublished: true }))).toEqual({
            message: "Approved and published",
            lockText: LOCK_APPROVED
        });
    });

    it("reads approved and unpublished only for a revision that was published before (R-h)", () => {
        const review = createReview({
            state: ReviewState.Approved,
            currentStepId: null,
            currentStepState: null,
            steps: [createStep({ state: StepState.Approved })]
        });
        expect(getReviewMessage(params({ review, isPublished: false, isUnpublished: true }))).toEqual({
            message: "Approved and unpublished. Publishing again needs no new review.",
            lockText: LOCK_APPROVED
        });
    });

    it("reads approved, ready to publish for a revision that was never published", () => {
        const review = createReview({
            state: ReviewState.Approved,
            currentStepId: null,
            currentStepState: null,
            steps: [createStep({ state: StepState.Approved })]
        });
        expect(getReviewMessage(params({ review }))).toEqual({
            message: "Approved, ready to publish",
            lockText: LOCK_APPROVED
        });
    });

    it("reads a rejection with the comment", () => {
        const review = createReview({
            state: ReviewState.Rejected,
            currentStepId: "step-1",
            currentStepState: StepState.Rejected,
            steps: [
                createStep({
                    title: "Legal sign-off",
                    state: StepState.Rejected,
                    owner: createActor({ id: "user-2", displayName: "Ana Legal" }),
                    comment: "Missing the disclaimer."
                })
            ]
        });
        expect(getReviewMessage(params({ review }))).toEqual({
            message: "Rejected at Legal sign-off: “Missing the disclaimer.”",
            lockText: LOCK_REJECTED
        });
    });

    it("reads a rejection without a comment", () => {
        const review = createReview({
            state: ReviewState.Rejected,
            currentStepId: "step-1",
            currentStepState: StepState.Rejected,
            steps: [
                createStep({
                    title: "AI tone check",
                    state: StepState.Rejected,
                    owner: createActor({ type: "ai", displayName: "gpt-model-9" })
                })
            ]
        });
        expect(getReviewMessage(params({ review })).message).toBe("Rejected at AI tone check.");
    });
});
```

Create `packages/app-workflows/src/review/presentation/targetReview/getEditorRules.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getEditorRules } from "./getEditorRules.js";
import { MOVE_BLOCKED_IN_REVIEW } from "./moveBlockedInReview.js";

const CHECKING = "Checking review status…";
const FAILED = "The review status could not be loaded. Try again from the review bar.";
const NEEDS_REVIEW = "Publishing needs an approved review. Request a review first.";
const REJECTED = "This revision was rejected. Create a new revision, then request a new review.";
const IN_REVIEW = "This revision is in review. Publishing is allowed once every step approves.";

describe("getEditorRules", () => {
    it("locks everything while the status loads (QBZ-1)", () => {
        expect(getEditorRules({ status: "loading", reviewKind: "none", isUnpublished: false })).toEqual({
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: CHECKING,
            moveDisabledReason: CHECKING
        });
    });

    it("locks everything after a failed load", () => {
        expect(getEditorRules({ status: "failed", reviewKind: "none", isUnpublished: false })).toEqual({
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: FAILED,
            moveDisabledReason: FAILED
        });
    });

    it("changes nothing for content without a workflow", () => {
        expect(
            getEditorRules({ status: "noWorkflow", reviewKind: "none", isUnpublished: false })
        ).toEqual({
            allowsEditing: true,
            allowsPublishing: true,
            publishDisabledReason: null,
            moveDisabledReason: null
        });
    });

    it("allows editing but not publishing without a review", () => {
        expect(getEditorRules({ status: "none", reviewKind: "none", isUnpublished: false })).toEqual({
            allowsEditing: true,
            allowsPublishing: false,
            publishDisabledReason: NEEDS_REVIEW,
            moveDisabledReason: null
        });
    });

    it("allows publishing an unpublished revision with no review (Q19, R226)", () => {
        expect(getEditorRules({ status: "none", reviewKind: "none", isUnpublished: true })).toEqual({
            allowsEditing: true,
            allowsPublishing: true,
            publishDisabledReason: null,
            moveDisabledReason: null
        });
    });

    it("does not let isUnpublished override an active review", () => {
        expect(
            getEditorRules({ status: "active", reviewKind: "inProgress", isUnpublished: true })
        ).toEqual({
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: IN_REVIEW,
            moveDisabledReason: MOVE_BLOCKED_IN_REVIEW
        });
        expect(
            getEditorRules({ status: "active", reviewKind: "rejected", isUnpublished: true })
                .allowsPublishing
        ).toBe(false);
    });

    it("locks editing, publishing and moving while a review is in progress", () => {
        expect(
            getEditorRules({ status: "active", reviewKind: "inProgress", isUnpublished: false })
        ).toEqual({
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: IN_REVIEW,
            moveDisabledReason: MOVE_BLOCKED_IN_REVIEW
        });
    });

    it("allows publishing an approved revision but not editing it", () => {
        expect(
            getEditorRules({ status: "active", reviewKind: "approved", isUnpublished: false })
        ).toEqual({
            allowsEditing: false,
            allowsPublishing: true,
            publishDisabledReason: null,
            moveDisabledReason: null
        });
    });

    it("locks a rejected revision for good", () => {
        expect(
            getEditorRules({ status: "active", reviewKind: "rejected", isUnpublished: false })
        ).toEqual({
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: REJECTED,
            moveDisabledReason: null
        });
    });
});
```

Create `packages/app-workflows/src/review/presentation/targetReview/getReviewActions.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getReviewActions } from "./getReviewActions.js";
import { createFlags } from "~/review/testing/createFlags.js";

describe("getReviewActions", () => {
    it("offers Request review without an active review when the app allows it (R217)", () => {
        expect(getReviewActions({ flags: null, stepId: null, canRequest: true })).toEqual([
            { kind: "request", label: "Request review", icon: "send", stepId: null, emphasis: "primary" }
        ]);
    });

    it("offers nothing without an active review when the app does not allow a request", () => {
        expect(getReviewActions({ flags: null, stepId: null, canRequest: false })).toEqual([]);
    });

    it("never offers Request review next to an active review", () => {
        const actions = getReviewActions({
            flags: createFlags({ canStart: true }),
            stepId: "step-1",
            canRequest: true
        });
        expect(actions.map(action => action.kind)).toEqual(["start"]);
    });

    it("maps the server flags to actions with the README labels and icons", () => {
        const actions = getReviewActions({
            flags: createFlags({ canStart: true }),
            stepId: "step-2",
            canRequest: false
        });
        expect(actions).toEqual([
            { kind: "start", label: "Start", icon: "play_arrow", stepId: "step-2", emphasis: "primary" }
        ]);
    });

    it("orders every action ghost, tertiary, secondary, primary", () => {
        const actions = getReviewActions({
            flags: createFlags({
                canStart: true,
                canTakeOver: true,
                canApprove: true,
                canReject: true,
                canCancel: true,
                canReassign: true
            }),
            stepId: "step-1",
            canRequest: false
        });
        expect(actions.map(action => [action.kind, action.emphasis])).toEqual([
            ["cancel", "ghost"],
            ["reassign", "tertiary"],
            ["reject", "tertiary"],
            ["takeOver", "secondary"],
            ["start", "primary"],
            ["approve", "primary"]
        ]);
        const labels = actions.map(action => action.label);
        expect(labels).toEqual([
            "Cancel review",
            "Reassign",
            "Reject",
            "Take over",
            "Start",
            "Approve"
        ]);
        const icons = actions.map(action => action.icon);
        expect(icons).toEqual(["block", "swap_horiz", "close", "front_hand", "play_arrow", "check"]);
    });

    it("never offers Restart (8b), also when the server allows it", () => {
        const actions = getReviewActions({
            flags: createFlags({ canRestart: true }),
            stepId: "step-1",
            canRequest: false
        });
        expect(actions).toEqual([]);
    });
});
```

Create `packages/app-workflows/src/review/presentation/targetReview/stepLabels.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getDisplayStep } from "./getDisplayStep.js";
import { getRejectionText } from "./getRejectionText.js";
import { getReviewKind } from "./getReviewKind.js";
import { getReviewProgress } from "./getReviewProgress.js";
import { getReviewStateTag } from "./getReviewStateTag.js";
import { getStepOwnerLabel } from "./getStepOwnerLabel.js";
import { getStepStateTag } from "./getStepStateTag.js";
import { getTargetIdFromRevisionId } from "./getTargetIdFromRevisionId.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";

describe("getStepOwnerLabel", () => {
    it("names a user", () => {
        const step = createStep({ owner: createActor({ displayName: "Luka Perić" }) });
        expect(getStepOwnerLabel(step)).toBe("Luka Perić");
    });

    it("names a user with a blank name 'A user'", () => {
        const step = createStep({ owner: createActor({ displayName: "  " }) });
        expect(getStepOwnerLabel(step)).toBe("A user");
    });

    it("names an AI or automation owner by the step title (QBZ-79)", () => {
        const ai = createStep({
            title: "AI tone check",
            owner: createActor({ type: "ai", displayName: "gpt-model-9" })
        });
        const automation = createStep({
            title: "Notify web team",
            owner: createActor({ type: "automation", displayName: "Send webhook" })
        });
        expect(getStepOwnerLabel(ai)).toBe("AI tone check");
        expect(getStepOwnerLabel(automation)).toBe("Notify web team");
    });

    it("names the team pool with the candidate team names (R232)", () => {
        const step = createStep({
            state: StepState.Awaiting,
            candidateTeams: [
                { id: "t1", name: "Marketing" },
                { id: "t2", name: "Legal" }
            ]
        });
        expect(getStepOwnerLabel(step)).toBe("Team pool (Marketing, Legal)");
    });

    it("names the team pool without a team name when none resolved", () => {
        expect(getStepOwnerLabel(createStep({ state: StepState.Awaiting }))).toBe("Team pool");
    });

    it("says a pending step is not reached yet", () => {
        expect(getStepOwnerLabel(createStep({ state: StepState.Pending }))).toBe("Not reached yet");
    });
});

describe("getRejectionText", () => {
    it("quotes the comment", () => {
        const step = createStep({ title: "Legal sign-off", comment: "Missing the disclaimer." });
        expect(getRejectionText(step)).toBe("Rejected at Legal sign-off: “Missing the disclaimer.”");
    });

    it("omits the colon part without a comment and never says 'by'", () => {
        expect(getRejectionText(createStep({ title: "Legal sign-off", comment: null }))).toBe(
            "Rejected at Legal sign-off."
        );
        expect(getRejectionText(createStep({ title: "Legal sign-off", comment: "   " }))).toBe(
            "Rejected at Legal sign-off."
        );
    });

    it("cuts a long comment at 80 characters (QBZ-64)", () => {
        const comment = "x".repeat(100);
        expect(getRejectionText(createStep({ title: "Legal", comment }))).toBe(
            `Rejected at Legal: “${"x".repeat(80)}…”`
        );
    });

    it("keeps a comment of exactly 80 characters whole", () => {
        const comment = "y".repeat(80);
        expect(getRejectionText(createStep({ title: "Legal", comment }))).toBe(
            `Rejected at Legal: “${comment}”`
        );
    });
});

describe("tags", () => {
    it("tags the review state (QBZ-52)", () => {
        expect(getReviewStateTag(ReviewState.InProgress)).toEqual({
            label: "Review: In progress",
            variant: "accent-light"
        });
        expect(getReviewStateTag(ReviewState.Approved)).toEqual({
            label: "Review: Approved",
            variant: "success-light"
        });
        expect(getReviewStateTag(ReviewState.Rejected)).toEqual({
            label: "Review: Rejected",
            variant: "neutral-dark"
        });
    });

    it("makes only the failed step state red (R239, Q24)", () => {
        expect(getStepStateTag(StepState.Failed)).toEqual({ label: "Failed", variant: "destructive" });
        expect(getStepStateTag(StepState.Rejected).variant).toBe("neutral-dark");
        const others = [
            StepState.Pending,
            StepState.Awaiting,
            StepState.InReview,
            StepState.Approved,
            StepState.Rejected
        ].map(state => getStepStateTag(state).variant);
        expect(others).not.toContain("destructive");
    });

    it("tags all six step states with distinct labels", () => {
        const labels = [
            StepState.Pending,
            StepState.Awaiting,
            StepState.InReview,
            StepState.Approved,
            StepState.Rejected,
            StepState.Failed
        ].map(state => getStepStateTag(state).label);
        expect(labels).toEqual(["Pending", "Awaiting", "In review", "Approved", "Rejected", "Failed"]);
    });

    it("gives the six step states distinct variants", () => {
        const variants = [
            StepState.Pending,
            StepState.Awaiting,
            StepState.InReview,
            StepState.Approved,
            StepState.Rejected,
            StepState.Failed
        ].map(state => getStepStateTag(state).variant);
        expect(new Set(variants).size).toBe(6);
    });
});

describe("getReviewProgress", () => {
    it("counts approved steps and lists every step with its owner label and comment", () => {
        const review = createReview({
            steps: [
                createStep({ id: "a", title: "Editorial", state: StepState.Approved, comment: "Fine." ,
                    owner: createActor({ displayName: "Ivan Horvat" }) }),
                createStep({ id: "b", title: "Legal", state: StepState.Awaiting }),
                createStep({ id: "c", title: "Brand", state: StepState.Pending })
            ]
        });
        expect(getReviewProgress(review)).toEqual({
            approved: 1,
            total: 3,
            segments: [
                { stepId: "a", title: "Editorial", state: StepState.Approved, ownerLabel: "Ivan Horvat", comment: "Fine." },
                { stepId: "b", title: "Legal", state: StepState.Awaiting, ownerLabel: "Team pool", comment: null },
                { stepId: "c", title: "Brand", state: StepState.Pending, ownerLabel: "Not reached yet", comment: null }
            ]
        });
    });
});

describe("getDisplayStep", () => {
    it("describes the current step", () => {
        const review = createReview({
            currentStepId: "b",
            steps: [createStep({ id: "a" }), createStep({ id: "b" }), createStep({ id: "c" })]
        });
        const display = getDisplayStep(review);
        expect(display?.step.id).toBe("b");
        expect(display?.index).toBe(1);
        expect(display?.total).toBe(3);
    });

    it("describes the rejecting step of a rejected review without a current step", () => {
        const review = createReview({
            state: ReviewState.Rejected,
            currentStepId: null,
            steps: [
                createStep({ id: "a", state: StepState.Approved }),
                createStep({ id: "b", state: StepState.Rejected }),
                createStep({ id: "c", state: StepState.Pending })
            ]
        });
        expect(getDisplayStep(review)?.step.id).toBe("b");
    });

    it("describes the last step of an approved review", () => {
        const review = createReview({
            state: ReviewState.Approved,
            currentStepId: null,
            steps: [
                createStep({ id: "a", state: StepState.Approved }),
                createStep({ id: "b", state: StepState.Approved })
            ]
        });
        expect(getDisplayStep(review)?.step.id).toBe("b");
    });

    it("returns null for a review without steps", () => {
        expect(getDisplayStep(createReview({ steps: [], currentStepId: null }))).toBeNull();
    });
});

describe("getReviewKind", () => {
    it("is none unless the status is active", () => {
        const review = createReview({ state: ReviewState.Approved });
        expect(getReviewKind("none", review)).toBe("none");
        expect(getReviewKind("noWorkflow", null)).toBe("none");
        expect(getReviewKind("loading", null)).toBe("none");
        expect(getReviewKind("failed", null)).toBe("none");
        expect(getReviewKind("active", null)).toBe("none");
    });

    it("maps the review state and reads a cancelled review as none (D75)", () => {
        expect(getReviewKind("active", createReview({ state: ReviewState.InProgress }))).toBe("inProgress");
        expect(getReviewKind("active", createReview({ state: ReviewState.Approved }))).toBe("approved");
        expect(getReviewKind("active", createReview({ state: ReviewState.Rejected }))).toBe("rejected");
        expect(getReviewKind("active", createReview({ state: ReviewState.Cancelled }))).toBe("none");
    });
});

describe("getTargetIdFromRevisionId", () => {
    it("returns the part before the version", () => {
        expect(getTargetIdFromRevisionId("entry-1#0003")).toBe("entry-1");
    });

    it("returns an id without a version unchanged", () => {
        expect(getTargetIdFromRevisionId("entry-1")).toBe("entry-1");
    });
});
```

Create `packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { buildTargetReviewViewModel } from "./buildTargetReviewViewModel.js";
import type { TargetReviewViewModelInput } from "./buildTargetReviewViewModel.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";

const input = (overrides: Partial<TargetReviewViewModelInput> = {}): TargetReviewViewModelInput => {
    return {
        status: "none",
        failureKind: null,
        review: null,
        canRequest: true,
        isPublished: false,
        isUnpublished: false,
        viewerTeamIds: [],
        targetTitle: "Spring campaign",
        namespace: "cms.article",
        targetRevisionId: "entry-1#0001",
        busy: false,
        openAction: null,
        ...overrides
    };
};

describe("buildTargetReviewViewModel", () => {
    it("shows nothing for a loading status except the skeleton text and no actions", () => {
        const vm = buildTargetReviewViewModel(input({ status: "loading" }));
        expect(vm.status).toBe("loading");
        expect(vm.reviewKind).toBe("none");
        expect(vm.message).toBe("Loading review status…");
        expect(vm.actions).toEqual([]);
        expect(vm.allowsEditing).toBe(false);
        expect(vm.allowsPublishing).toBe(false);
        expect(vm.publishDisabledReason).toBe("Checking review status…");
    });

    it("shows a failed load without actions and keeps editing and publishing off", () => {
        const vm = buildTargetReviewViewModel(input({ status: "failed", failureKind: "error" }));
        expect(vm.failureKind).toBe("error");
        expect(vm.message).toBe("Could not load the review status");
        expect(vm.lockText).toBe("Editing and publishing are unavailable until it loads.");
        expect(vm.actions).toEqual([]);
        expect(vm.tile).toBe("sync_problem");
        expect(vm.allowsEditing).toBe(false);
    });

    it("hides the title and the state for a read without access (R225)", () => {
        const vm = buildTargetReviewViewModel(input({ status: "failed", failureKind: "noAccess" }));
        expect(vm.failureKind).toBe("noAccess");
        expect(vm.stateTag).toBeNull();
        expect(vm.stepMeta).toBeNull();
        expect(vm.actions).toEqual([]);
    });

    it("offers Request review for content with a workflow and no review", () => {
        const vm = buildTargetReviewViewModel(input({ status: "none" }));
        expect(vm.tile).toBe("rule");
        expect(vm.reviewKind).toBe("none");
        expect(vm.actions.map(action => action.kind)).toEqual(["request"]);
        expect(vm.allowsEditing).toBe(true);
        expect(vm.allowsPublishing).toBe(false);
    });

    it("hides Request review when the app does not allow it", () => {
        const vm = buildTargetReviewViewModel(input({ status: "none", canRequest: false }));
        expect(vm.actions).toEqual([]);
    });

    it("shows no bar content for content without a workflow", () => {
        const vm = buildTargetReviewViewModel(input({ status: "noWorkflow" }));
        expect(vm.message).toBe("");
        expect(vm.actions).toEqual([]);
        expect(vm.allowsEditing).toBe(true);
        expect(vm.allowsPublishing).toBe(true);
    });

    it("describes an in-progress review from the server flags", () => {
        const owner = createActor({ id: "user-2", displayName: "Luka Perić" });
        const review = createReview({
            currentStepId: "step-2",
            currentStepState: StepState.InReview,
            steps: [
                createStep({ id: "step-1", title: "Editorial check", state: StepState.Approved }),
                createStep({ id: "step-2", title: "Legal sign-off", state: StepState.InReview, owner })
            ]
        });
        const vm = buildTargetReviewViewModel(
            input({
                status: "active",
                review: createReviewWithFlags(review, createFlags({ canTakeOver: true })),
                canRequest: true
            })
        );
        expect(vm.reviewId).toBe("review-1");
        expect(vm.reviewKind).toBe("inProgress");
        expect(vm.tile).toBe("rate_review");
        expect(vm.message).toBe("Luka Perić is reviewing");
        expect(vm.stepMeta).toBe("Step 2 of 2: Legal sign-off");
        expect(vm.ownerMeta).toBe("Owner: Luka Perić");
        expect(vm.stateTag).toEqual({ label: "Review: In progress", variant: "accent-light" });
        expect(vm.stepStateTag).toEqual({ label: "In review", variant: "accent-light" });
        expect(vm.progress?.approved).toBe(1);
        expect(vm.progress?.total).toBe(2);
        expect(vm.actions).toEqual([
            { kind: "takeOver", label: "Take over", icon: "front_hand", stepId: "step-2", emphasis: "secondary" }
        ]);
        expect(vm.allowsEditing).toBe(false);
        expect(vm.allowsPublishing).toBe(false);
        expect(vm.moveDisabledReason).toBe("Can’t move while this revision is in review.");
    });

    it("uses the hourglass tile for a step in the team pool", () => {
        const vm = buildTargetReviewViewModel(
            input({ status: "active", review: createReviewWithFlags() })
        );
        expect(vm.tile).toBe("hourglass_empty");
        expect(vm.ownerMeta).toBe("Owner: Team pool");
    });

    it("uses the check tile and allows publishing for an approved review", () => {
        const review = createReview({
            state: ReviewState.Approved,
            currentStepId: null,
            currentStepState: null,
            steps: [createStep({ state: StepState.Approved })]
        });
        const vm = buildTargetReviewViewModel(
            input({ status: "active", review: createReviewWithFlags(review), isPublished: true })
        );
        expect(vm.reviewKind).toBe("approved");
        expect(vm.tile).toBe("check_circle");
        expect(vm.stateTag).toEqual({ label: "Review: Approved", variant: "success-light" });
        expect(vm.allowsPublishing).toBe(true);
        expect(vm.allowsEditing).toBe(false);
        expect(vm.message).toBe("Approved and published");
    });

    it("keeps the rejecting step's name and tag for a rejected review (QBZ-52)", () => {
        const review = createReview({
            state: ReviewState.Rejected,
            currentStepId: "step-1",
            currentStepState: StepState.Rejected,
            steps: [
                createStep({
                    title: "Legal sign-off",
                    state: StepState.Rejected,
                    owner: createActor({ id: "user-2", displayName: "Ana Legal" })
                })
            ]
        });
        const vm = buildTargetReviewViewModel(
            input({ status: "active", review: createReviewWithFlags(review) })
        );
        expect(vm.reviewKind).toBe("rejected");
        expect(vm.tile).toBe("cancel");
        expect(vm.stepMeta).toBe("Step 1 of 1: Legal sign-off");
        expect(vm.ownerMeta).toBe("Owner: Ana Legal");
        expect(vm.stepStateTag).toEqual({ label: "Rejected", variant: "neutral-dark" });
    });

    it("carries the target the bar belongs to (R-f)", () => {
        const vm = buildTargetReviewViewModel(input({ status: "none" }));

        expect(vm.targetTitle).toBe("Spring campaign");
        expect(vm.namespace).toBe("cms.article");
        expect(vm.targetRevisionId).toBe("entry-1#0001");
    });

    it("tells the three approved messages apart (R-h)", () => {
        const review = createReview({
            state: ReviewState.Approved,
            currentStepId: null,
            currentStepState: null,
            steps: [createStep({ state: StepState.Approved })]
        });
        const active = createReviewWithFlags(review);
        const published = buildTargetReviewViewModel(input({ status: "active", review: active, isPublished: true }));
        const unpublished = buildTargetReviewViewModel(input({ status: "active", review: active, isUnpublished: true }));
        const ready = buildTargetReviewViewModel(input({ status: "active", review: active }));

        expect(published.message).toBe("Approved and published");
        expect(unpublished.message).toBe("Approved and unpublished. Publishing again needs no new review.");
        expect(ready.message).toBe("Approved, ready to publish");
    });

    it("enables Publish for an unpublished revision with no review (Q19)", () => {
        const vm = buildTargetReviewViewModel(input({ status: "none", isUnpublished: true }));
        expect(vm.reviewKind).toBe("none");
        expect(vm.allowsPublishing).toBe(true);
        expect(vm.publishDisabledReason).toBeNull();
        expect(vm.allowsEditing).toBe(true);
    });

    it("keeps Publish disabled for a revision with no review that was never published", () => {
        const vm = buildTargetReviewViewModel(input({ status: "none", isUnpublished: false }));
        expect(vm.allowsPublishing).toBe(false);
        expect(vm.publishDisabledReason).toBe(
            "Publishing needs an approved review. Request a review first."
        );
    });

    it("names the viewer's own teams in the pool message (QBZ-25)", () => {
        const review = createReview({
            steps: [
                createStep({
                    state: StepState.Awaiting,
                    candidateTeams: [
                        { id: "t1", name: "Marketing" },
                        { id: "t2", name: "Legal" }
                    ]
                })
            ]
        });
        const vm = buildTargetReviewViewModel(
            input({
                status: "active",
                review: createReviewWithFlags(review),
                viewerTeamIds: ["t2"]
            })
        );
        expect(vm.message).toBe("Waiting in the Legal team pool");
        expect(vm.ownerMeta).toBe("Owner: Team pool (Marketing, Legal)");
    });

    it("carries the open action and the busy flag", () => {
        const vm = buildTargetReviewViewModel(
            input({ status: "none", busy: true, openAction: { kind: "request", stepId: null } })
        );
        expect(vm.busy).toBe(true);
        expect(vm.openAction).toEqual({ kind: "request", stepId: null });
    });

    it("is render-ready: plain data only (R234)", () => {
        const vm = buildTargetReviewViewModel(
            input({ status: "active", review: createReviewWithFlags() })
        );
        expect(JSON.parse(JSON.stringify(vm))).toEqual(vm);
    });
});
```

Create `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/abstractions.js";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import type { ITeam } from "@webiny/app-admin/domain/Identity.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewChangedEvent } from "~/review/events/ReviewChangedEvent.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { TargetReviewPresenterFeature } from "./feature.js";
import type { TargetReviewInitParams } from "./abstractions.js";
import { TARGET } from "~/review/testing/reviewTarget.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import type { FakeReviewUseCases } from "~/review/testing/fakeReviewUseCases.js";

interface Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
}

const createDeferred = <T>(): Deferred<T> => {
    let resolve: (value: T) => void = () => undefined;
    const promise = new Promise<T>(res => {
        resolve = res;
    });
    return { promise, resolve };
};

const createParams = (
    useCases: FakeReviewUseCases,
    overrides: Partial<TargetReviewInitParams> = {}
): TargetReviewInitParams => {
    return {
        useCases,
        target: TARGET,
        targetTitle: "Spring campaign",
        canRequest: true,
        isPublished: false,
        isUnpublished: false,
        ...overrides
    };
};

const createIdentityContext = (teams: ITeam[]): IdentityContext.Interface => {
    const identity = { teams } as unknown as Identity;
    return { getIdentity: () => identity, setIdentity: vi.fn(), clear: vi.fn() };
};

const createSetup = (teams: ITeam[] = []) => {
    const container = new Container();
    const publisher = { publish: vi.fn().mockResolvedValue(undefined) };
    const activity = { subscribe: vi.fn(), notify: vi.fn() };
    container.registerInstance(EventPublisher, publisher);
    container.registerInstance(ReviewActivity, activity);
    container.registerInstance(IdentityContext, createIdentityContext(teams));
    TargetReviewPresenterFeature.register(container);
    const { presenter } = TargetReviewPresenterFeature.resolve(container);
    return { container, presenter, publisher, activity };
};

const publishedPayloads = (publisher: { publish: ReturnType<typeof vi.fn> }) => {
    return publisher.publish.mock.calls.map(call => (call[0] as ReviewChangedEvent).payload);
};

describe("TargetReviewPresenter", () => {
    let setup: ReturnType<typeof createSetup>;
    let useCases: FakeReviewUseCases;

    beforeEach(() => {
        setup = createSetup();
        useCases = createFakeUseCases();
    });

    it("names the viewer's own teams in the pool message (QBZ-25, R247)", async () => {
        setup = createSetup([{ id: "t2", slug: "legal", name: "Legal" }]);
        const base = createReview();
        const review = createReview({
            steps: [
                {
                    ...base.steps[0],
                    candidateTeams: [
                        { id: "t1", name: "Marketing" },
                        { id: "t2", name: "Legal" }
                    ]
                }
            ]
        });
        useCases.getTargetReview.mockResolvedValue(createReviewWithFlags(review));

        await setup.presenter.init(createParams(useCases));

        expect(setup.presenter.vm.message).toBe("Waiting in the Legal team pool");
    });

    it("starts in the loading status before init", () => {
        expect(setup.presenter.vm.status).toBe("loading");
        expect(setup.presenter.vm.allowsEditing).toBe(false);
    });

    it("is loading while init waits for the workflow", async () => {
        const workflow = createDeferred<null>();
        useCases.getBoundWorkflow.mockReturnValue(workflow.promise);

        const pending = setup.presenter.init(createParams(useCases));

        expect(setup.presenter.vm.status).toBe("loading");
        workflow.resolve(null);
        await pending;
        expect(setup.presenter.vm.status).toBe("noWorkflow");
    });

    it("is noWorkflow when the namespace has no workflow and asks for no review", async () => {
        useCases.getBoundWorkflow.mockResolvedValue(null);

        await setup.presenter.init(createParams(useCases));

        expect(useCases.getBoundWorkflow).toHaveBeenCalledWith(TARGET.namespace);
        expect(useCases.getTargetReview).not.toHaveBeenCalled();
        expect(setup.presenter.vm.status).toBe("noWorkflow");
        expect(setup.presenter.vm.allowsEditing).toBe(true);
        expect(setup.presenter.vm.allowsPublishing).toBe(true);
        expect(publishedPayloads(setup.publisher)).toEqual([
            {
                namespace: TARGET.namespace,
                targetId: "entry-1",
                targetRevisionId: TARGET.targetRevisionId,
                review: null
            }
        ]);
    });

    it("is none when the revision has no review and publishes review null", async () => {
        await setup.presenter.init(createParams(useCases));

        expect(useCases.getTargetReview).toHaveBeenCalledWith(TARGET);
        expect(setup.presenter.vm.status).toBe("none");
        expect(setup.presenter.vm.actions.map(action => action.kind)).toEqual(["request"]);
        expect(publishedPayloads(setup.publisher)[0].review).toBeNull();
    });

    it("hides the request action when the app passes canRequest false", async () => {
        await setup.presenter.init(createParams(useCases, { canRequest: false }));

        expect(setup.presenter.vm.status).toBe("none");
        expect(setup.presenter.vm.actions).toEqual([]);
    });

    it("treats a cancelled review as none (D75)", async () => {
        const cancelled = createReviewWithFlags(createReview({ state: ReviewState.Cancelled, isActive: false }));
        useCases.getTargetReview.mockResolvedValue(cancelled);

        await setup.presenter.init(createParams(useCases));

        expect(setup.presenter.vm.status).toBe("none");
        expect(setup.presenter.vm.allowsEditing).toBe(true);
    });

    it("is active with actions from the server flags only", async () => {
        const flags = createFlags({ canStart: true, canReassign: true });
        useCases.getTargetReview.mockResolvedValue(createReviewWithFlags(createReview(), flags));

        await setup.presenter.init(createParams(useCases));

        const { vm } = setup.presenter;
        expect(vm.status).toBe("active");
        expect(vm.reviewId).toBe("review-1");
        expect(vm.actions.map(action => action.kind)).toEqual(["reassign", "start"]);
        expect(vm.allowsEditing).toBe(false);
        const payload = publishedPayloads(setup.publisher)[0];
        expect(payload.review?.id).toBe("review-1");
        expect(payload.targetId).toBe("entry-1");
    });

    it("fails with noAccess when the read is not authorized (R225)", async () => {
        useCases.getTargetReview.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );

        await setup.presenter.init(createParams(useCases));

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.failureKind).toBe("noAccess");
        expect(setup.presenter.vm.allowsEditing).toBe(false);
        expect(setup.publisher.publish).not.toHaveBeenCalled();
    });

    it("fails with error on any other error, also a transport error and a workflow error", async () => {
        useCases.getTargetReview.mockRejectedValue(new Error("Network."));
        await setup.presenter.init(createParams(useCases));
        expect(setup.presenter.vm.failureKind).toBe("error");

        useCases.getBoundWorkflow.mockRejectedValue(
            new GraphQLOperationError({ message: "Other.", code: ReviewErrorCode.Validation })
        );
        await setup.presenter.refresh();
        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.failureKind).toBe("error");
        expect(setup.presenter.vm.allowsPublishing).toBe(false);
        expect(setup.publisher.publish).not.toHaveBeenCalled();
    });

    it("recovers from a failed load with refresh", async () => {
        useCases.getTargetReview.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.init(createParams(useCases));
        expect(setup.presenter.vm.status).toBe("failed");

        await setup.presenter.refresh();

        expect(setup.presenter.vm.status).toBe("none");
    });

    it("keeps the current view and reports busy while refresh loads", async () => {
        useCases.getTargetReview.mockResolvedValue(createReviewWithFlags());
        await setup.presenter.init(createParams(useCases));
        const next = createDeferred<ReviewWithFlags | null>();
        useCases.getTargetReview.mockReturnValue(next.promise);

        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(useCases.getTargetReview).toHaveBeenCalledTimes(2));

        expect(setup.presenter.vm.status).toBe("active");
        expect(setup.presenter.vm.busy).toBe(true);
        next.resolve(null);
        await pending;
        expect(setup.presenter.vm.status).toBe("none");
        expect(setup.presenter.vm.busy).toBe(false);
    });

    it("publishes an event after every settled load", async () => {
        await setup.presenter.init(createParams(useCases));
        await setup.presenter.refresh();

        expect(setup.publisher.publish).toHaveBeenCalledTimes(2);
        expect(setup.publisher.publish.mock.calls[0][0]).toBeInstanceOf(ReviewChangedEvent);
    });

    it("keeps its state when the event publisher rejects", async () => {
        setup.publisher.publish.mockRejectedValue(new Error("Cache writer failed."));

        await setup.presenter.init(createParams(useCases));

        expect(setup.presenter.vm.status).toBe("none");
    });

    it("ignores the response of an old target after a second init (Review Focus 5)", async () => {
        const oldReview = createDeferred<ReviewWithFlags | null>();
        const oldUseCases = createFakeUseCases();
        oldUseCases.getTargetReview.mockReturnValue(oldReview.promise);
        const pending = setup.presenter.init(createParams(oldUseCases));
        await vi.waitFor(() => expect(oldUseCases.getTargetReview).toHaveBeenCalled());

        const newUseCases = createFakeUseCases();
        newUseCases.getTargetReview.mockResolvedValue(null);
        await setup.presenter.init(
            createParams(newUseCases, {
                target: { namespace: TARGET.namespace, targetRevisionId: "entry-2#0001" }
            })
        );
        oldReview.resolve(createReviewWithFlags());
        await pending;

        expect(setup.presenter.vm.status).toBe("none");
        expect(setup.publisher.publish).toHaveBeenCalledTimes(1);
        expect(publishedPayloads(setup.publisher)[0].targetRevisionId).toBe("entry-2#0001");
    });

    it("ignores a response that arrives after dispose", async () => {
        const late = createDeferred<ReviewWithFlags | null>();
        useCases.getTargetReview.mockReturnValue(late.promise);
        const pending = setup.presenter.init(createParams(useCases));
        await vi.waitFor(() => expect(useCases.getTargetReview).toHaveBeenCalled());

        setup.presenter.dispose();
        late.resolve(createReviewWithFlags());
        await pending;

        expect(setup.presenter.vm.status).toBe("loading");
        expect(setup.publisher.publish).not.toHaveBeenCalled();
    });

    it("keeps two presenters with two use cases independent (Review Focus 1)", async () => {
        const second = TargetReviewPresenterFeature.resolve(setup.container).presenter;
        const otherUseCases = createFakeUseCases();
        otherUseCases.getBoundWorkflow.mockResolvedValue(null);

        await setup.presenter.init(createParams(useCases));
        await second.init(createParams(otherUseCases));

        expect(second).not.toBe(setup.presenter);
        expect(setup.presenter.vm.status).toBe("none");
        expect(second.vm.status).toBe("noWorkflow");
        expect(useCases.getBoundWorkflow).toHaveBeenCalledTimes(1);
        expect(otherUseCases.getBoundWorkflow).toHaveBeenCalledTimes(1);
    });

    it("opens and closes an action", async () => {
        await setup.presenter.init(createParams(useCases));

        setup.presenter.openAction("request", null);
        expect(setup.presenter.vm.openAction).toEqual({ kind: "request", stepId: null });

        setup.presenter.closeAction();
        expect(setup.presenter.vm.openAction).toBeNull();
    });

    it("refreshes, closes the action and notifies the activity bus on actionDone", async () => {
        await setup.presenter.init(createParams(useCases));
        setup.presenter.openAction("request", null);
        useCases.getTargetReview.mockResolvedValue(createReviewWithFlags());

        await setup.presenter.actionDone();

        expect(setup.presenter.vm.openAction).toBeNull();
        expect(setup.presenter.vm.status).toBe("active");
        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: TARGET.namespace,
            source: "own"
        });
    });

    it("replaces the context without reloading", async () => {
        useCases.getTargetReview.mockResolvedValue(
            createReviewWithFlags(createReview({ state: ReviewState.Approved }))
        );
        await setup.presenter.init(createParams(useCases));
        expect(setup.presenter.vm.message).toBe("Approved, ready to publish");

        setup.presenter.setContext({
            targetTitle: "New title",
            canRequest: false,
            isPublished: false,
            isUnpublished: true
        });
        expect(setup.presenter.vm.message).toBe(
            "Approved and unpublished. Publishing again needs no new review."
        );
        expect(setup.presenter.vm.targetTitle).toBe("New title");

        setup.presenter.setContext({
            targetTitle: "New title",
            canRequest: false,
            isPublished: true,
            isUnpublished: false
        });
        expect(setup.presenter.vm.message).toBe("Approved and published");
        expect(useCases.getTargetReview).toHaveBeenCalledTimes(1);
    });

    it("exposes the target it was initialised with (R-f)", async () => {
        await setup.presenter.init(createParams(useCases));

        expect(setup.presenter.vm.namespace).toBe(TARGET.namespace);
        expect(setup.presenter.vm.targetRevisionId).toBe(TARGET.targetRevisionId);
        expect(setup.presenter.vm.targetTitle).toBe("Spring campaign");
    });

    it("resets everything on dispose (R212)", async () => {
        useCases.getTargetReview.mockResolvedValue(createReviewWithFlags());
        await setup.presenter.init(createParams(useCases));
        setup.presenter.openAction("approve", "step-1");

        setup.presenter.dispose();

        const { vm } = setup.presenter;
        expect(vm.status).toBe("loading");
        expect(vm.reviewId).toBeNull();
        expect(vm.openAction).toBeNull();
        expect(vm.actions).toEqual([]);
        expect(vm.busy).toBe(false);
    });

    it("is transient: every resolve is a new instance (R212)", () => {
        const first = TargetReviewPresenterFeature.resolve(setup.container).presenter;
        const second = TargetReviewPresenterFeature.resolve(setup.container).presenter;
        expect(first).not.toBe(second);
    });
});
```

Modify Task 10's `packages/app-workflows/src/app.test.tsx` (the `WorkflowsAdminApp` flag test): the presenters depend on `EventPublisher`, which the test container must provide, and a new `describe` asserts them from the composition root. Add the imports:

```tsx
import { EventPublisher } from "@webiny/app/features/eventPublisher/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";
```

In `mount`, register an event publisher and an identity context next to the `Notifications` instance (the real ones come from the admin; the presenter only reads the identity when its view model is built):

```tsx
    container.registerInstance(EventPublisher, { publish: vi.fn().mockResolvedValue(undefined) });
    container.registerInstance(IdentityContext, {
        getIdentity: vi.fn(),
        setIdentity: vi.fn(),
        clear: vi.fn()
    });
```

Append a `describe` (Tasks 15-18 add their presenter tokens to the three tests the same way: one `expect` line each):

```tsx
describe("WorkflowsAdminApp review view", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the review view presenters when the flag is on", () => {
        const container = mount(true);

        expect(container.resolve(TargetReviewPresenter)).toBeDefined();
    });

    it("registers the presenters transient: every resolve is a new instance (R212)", () => {
        const container = mount(true);

        const first = container.resolve(TargetReviewPresenter);
        const second = container.resolve(TargetReviewPresenter);
        expect(first).not.toBe(second);
    });

    it("registers no review view presenter when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(TargetReviewPresenter)).toThrow();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview/getReviewMessage.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/getEditorRules.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/getReviewActions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/stepLabels.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: each fails with `Failed to resolve import "./<module>.js"` (the sources do not exist yet); the `app.test.tsx` cases added in Step 1 fail at import because `~/review/presentation/targetReview/abstractions.js` cannot be resolved. Record the RED output before Step 3.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/review/presentation/targetReview/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { StepStateValue } from "~/review/domain/StepState.js";

export type TargetReviewStatus = "loading" | "failed" | "noWorkflow" | "none" | "active";

export type TargetReviewFailureKind = "noAccess" | "error";

/** What the review is, once the status is `active` or `none` (cancelled reads as none, D75). */
export type TargetReviewKind = "none" | "inProgress" | "approved" | "rejected";

export type TargetReviewActionKind =
    | "request"
    | "start"
    | "takeOver"
    | "reassign"
    | "approve"
    | "reject"
    | "cancel";

export type TargetReviewActionIcon =
    | "send"
    | "play_arrow"
    | "check"
    | "close"
    | "front_hand"
    | "swap_horiz"
    | "block";

export type TargetReviewEmphasis = "ghost" | "tertiary" | "secondary" | "primary";

/** The admin-ui `Tag` variants the review view uses. */
export type TargetReviewTagVariant =
    | "accent-light"
    | "success-light"
    | "destructive"
    | "warning"
    | "neutral-base-outline"
    | "neutral-dark";

/** The state tile of the bar (README 6): the Material icon name that names it. */
export type TargetReviewTile =
    | "rule"
    | "rate_review"
    | "hourglass_empty"
    | "sync_problem"
    | "check_circle"
    | "cancel";

export interface TargetReviewTag {
    label: string;
    variant: TargetReviewTagVariant;
}

export interface TargetReviewActionVm {
    kind: TargetReviewActionKind;
    label: string;
    icon: TargetReviewActionIcon;
    stepId: string | null;
    emphasis: TargetReviewEmphasis;
}

export interface TargetReviewSegmentVm {
    stepId: string;
    title: string;
    state: StepStateValue;
    ownerLabel: string;
    comment: string | null;
}

export interface TargetReviewProgressVm {
    approved: number;
    total: number;
    segments: TargetReviewSegmentVm[];
}

export interface TargetReviewOpenAction {
    kind: TargetReviewActionKind;
    stepId: string | null;
}

/** Render-ready values only (R234): no domain object, no presenter, no callback. */
export interface ITargetReviewViewModel {
    status: TargetReviewStatus;
    failureKind: TargetReviewFailureKind | null;
    reviewKind: TargetReviewKind;
    targetTitle: string;
    namespace: string;
    targetRevisionId: string;
    message: string;
    lockText: string | null;
    tile: TargetReviewTile;
    stateTag: TargetReviewTag | null;
    stepStateTag: TargetReviewTag | null;
    stepMeta: string | null;
    ownerMeta: string | null;
    progress: TargetReviewProgressVm | null;
    actions: TargetReviewActionVm[];
    allowsEditing: boolean;
    allowsPublishing: boolean;
    publishDisabledReason: string | null;
    moveDisabledReason: string | null;
    reviewId: string | null;
    openAction: TargetReviewOpenAction | null;
    busy: boolean;
}

/** What the editor knows about the content and may change while the editor is open. */
export interface TargetReviewContext {
    targetTitle: string;
    canRequest: boolean;
    isPublished: boolean;
    /** The revision was published before and is unpublished now (R226, R-h). */
    isUnpublished: boolean;
}

export interface TargetReviewInitParams extends TargetReviewContext {
    useCases: IReviewUseCases;
    target: ReviewTarget;
}

export interface ITargetReviewPresenter {
    readonly vm: ITargetReviewViewModel;
    init(params: TargetReviewInitParams): Promise<void>;
    setContext(context: TargetReviewContext): void;
    refresh(): Promise<void>;
    actionDone(): Promise<void>;
    openAction(kind: TargetReviewActionKind, stepId: string | null): void;
    closeAction(): void;
    dispose(): void;
}

export const TargetReviewPresenter = createAbstraction<ITargetReviewPresenter>(
    "Workflows/TargetReviewPresenter"
);

export namespace TargetReviewPresenter {
    export type Interface = ITargetReviewPresenter;
    export type ViewModel = ITargetReviewViewModel;
}
```

Create `packages/app-workflows/src/review/presentation/noAccessMessage.ts`:

```ts
/**
 * The one sentence for "the viewer may not read this review" (QBZ-59), shared by the bar, the
 * action dialogs and the details drawer.
 */
export const NO_ACCESS_MESSAGE =
    "You don't have access to this content or its review. Ask an administrator if you need it.";
```

Create `packages/app-workflows/src/review/presentation/targetReview/getTeamNames.ts`:

```ts
import type { ReviewStep } from "~/review/domain/types.js";

/** The names of the step's candidate teams joined with ", "; empty when none resolved (R232). */
export const getTeamNames = (step: ReviewStep): string => {
    return step.candidateTeams.map(team => team.name).join(", ");
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/getStepOwnerLabel.ts`:

```ts
import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import { getTeamNames } from "./getTeamNames.js";

/**
 * Who holds a step, as the bar, the popover and the drawer name them. AI and automation owners
 * are named by the step title, never by a model or an automation (R216, QBZ-79).
 */
export const getStepOwnerLabel = (step: ReviewStep): string => {
    const owner = step.owner;
    if (owner) {
        if (owner.type !== "user") {
            return step.title;
        }
        const name = owner.displayName.trim();
        if (name === "") {
            return "A user";
        }
        return name;
    }

    if (step.state === StepState.Pending) {
        return "Not reached yet";
    }

    const names = getTeamNames(step);
    if (names === "") {
        return "Team pool";
    }
    return `Team pool (${names})`;
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/getRejectionText.ts`:

```ts
import type { ReviewStep } from "~/review/domain/types.js";

const COMMENT_LIMIT = 80;

/**
 * "Rejected at {step}: “{comment}”", the comment cut to 80 characters (QBZ-64); without a comment
 * "Rejected at {step}." and never a "by" (R216, QBZ-83 as ruled).
 */
export const getRejectionText = (step: ReviewStep): string => {
    const comment = step.comment ? step.comment.trim() : "";
    if (comment === "") {
        return `Rejected at ${step.title}.`;
    }

    let shown = comment;
    if (comment.length > COMMENT_LIMIT) {
        shown = `${comment.slice(0, COMMENT_LIMIT).trimEnd()}…`;
    }
    return `Rejected at ${step.title}: “${shown}”`;
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/getReviewStateTag.ts`:

```ts
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { TargetReviewTag } from "./abstractions.js";

/** The review state tag before the message (QBZ-52). */
export const getReviewStateTag = (state: ReviewStateValue): TargetReviewTag | null => {
    switch (state) {
        case ReviewState.InProgress:
            return { label: "Review: In progress", variant: "accent-light" };
        case ReviewState.Approved:
            return { label: "Review: Approved", variant: "success-light" };
        case ReviewState.Rejected:
            return { label: "Review: Rejected", variant: "neutral-dark" };
        default:
            return null;
    }
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/getStepStateTag.ts`:

```ts
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { TargetReviewTag } from "./abstractions.js";

/**
 * The six step states, each visibly distinct (README 1, UI-13). Only `failed` is red (R239, Q24);
 * a rejected step is the dark neutral tag.
 */
export const getStepStateTag = (state: StepStateValue): TargetReviewTag => {
    switch (state) {
        case StepState.Awaiting:
            return { label: "Awaiting", variant: "warning" };
        case StepState.InReview:
            return { label: "In review", variant: "accent-light" };
        case StepState.Approved:
            return { label: "Approved", variant: "success-light" };
        case StepState.Rejected:
            return { label: "Rejected", variant: "neutral-dark" };
        case StepState.Failed:
            return { label: "Failed", variant: "destructive" };
        default:
            return { label: "Pending", variant: "neutral-base-outline" };
    }
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/getDisplayStep.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import type { ReviewStep } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";

export interface DisplayStep {
    step: ReviewStep;
    index: number;
    total: number;
}

/**
 * The step the bar describes: the current step; for a finished review the rejecting step or the
 * last step (QBZ-52, QBZ-70).
 */
export const getDisplayStep = (review: Review): DisplayStep | null => {
    const steps = review.steps;
    if (steps.length === 0) {
        return null;
    }

    let index = -1;
    if (review.currentStepId !== null) {
        index = steps.findIndex(step => step.id === review.currentStepId);
    }
    if (index === -1 && review.state === ReviewState.Rejected) {
        index = steps.findIndex(step => step.state === StepState.Rejected);
    }
    if (index === -1 && review.state === ReviewState.Approved) {
        index = steps.length - 1;
    }
    if (index === -1) {
        index = steps.findIndex(step => step.state !== StepState.Approved);
    }
    if (index === -1) {
        index = steps.length - 1;
    }

    return { step: steps[index], index, total: steps.length };
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/getReviewMessage.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import type { ReviewStep } from "~/review/domain/types.js";
import type { ReviewViewerFlags } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import type { TargetReviewFailureKind } from "./abstractions.js";
import type { TargetReviewStatus } from "./abstractions.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import { getDisplayStep } from "./getDisplayStep.js";
import { getRejectionText } from "./getRejectionText.js";
import { getStepOwnerLabel } from "./getStepOwnerLabel.js";
import { getTeamNames } from "./getTeamNames.js";

export interface ReviewMessageParams {
    status: TargetReviewStatus;
    failureKind: TargetReviewFailureKind | null;
    review: Review | null;
    flags: ReviewViewerFlags | null;
    isPublished: boolean;
    isUnpublished: boolean;
    /** The ids of the viewer's own teams (`Identity.teams`), for the QBZ-25 wording (R232, R247). */
    viewerTeamIds: string[];
}

export interface ReviewMessage {
    message: string;
    lockText: string | null;
}

const NO_REVIEW: ReviewMessage = {
    message: "This content needs review before publishing",
    lockText: "Publishing needs an approved review."
};

const LEGACY_PUBLISHED: ReviewMessage = {
    message: "This content needs review before publishing (applies to new revisions)",
    lockText:
        "This revision was published before the workflow existed. Create a new revision to change it."
};

const LOCK_IN_REVIEW = "Editing, publishing and moving are locked while this revision is in review.";

const LOCK_APPROVED =
    "Editing is locked. To make changes, create a new revision; it needs a new review.";

const LOCK_REJECTED =
    "This revision is locked for good. Create a new revision to fix it, then request a new review.";

/**
 * The viewer's own teams among the step's candidate teams joined with " and " (QBZ-25); a viewer
 * outside them gets every candidate team joined with ", " (R232).
 */
const getPoolNames = (step: ReviewStep, viewerTeamIds: string[]): string => {
    const own = step.candidateTeams.filter(team => viewerTeamIds.includes(team.id));
    if (own.length > 0) {
        return own.map(team => team.name).join(" and ");
    }
    return getTeamNames(step);
};

const getInProgressMessage = (
    review: Review,
    flags: ReviewViewerFlags | null,
    viewerTeamIds: string[]
): ReviewMessage => {
    const display = getDisplayStep(review);
    if (!display) {
        return { message: "Review in progress", lockText: LOCK_IN_REVIEW };
    }

    const step = display.step;
    if (step.state === StepState.Awaiting && step.owner === null) {
        const names = getPoolNames(step, viewerTeamIds);
        if (names === "") {
            return { message: "Waiting in the team pool", lockText: LOCK_IN_REVIEW };
        }
        return { message: `Waiting in the ${names} team pool`, lockText: LOCK_IN_REVIEW };
    }

    if (step.owner === null) {
        return { message: "Review in progress", lockText: LOCK_IN_REVIEW };
    }

    // Approving is owner-only on the server, so the flag tells us the viewer owns the step.
    if (flags && flags.canApprove) {
        return { message: "You are reviewing this step", lockText: LOCK_IN_REVIEW };
    }

    return { message: `${getStepOwnerLabel(step)} is reviewing`, lockText: LOCK_IN_REVIEW };
};

/**
 * The bar's message and lock text (README 6, R225, R226, R232). Pure. A running or failed step
 * reads like an in-review step here (R203, 8b adds their own messages).
 */
export const getReviewMessage = (params: ReviewMessageParams): ReviewMessage => {
    const { status, failureKind, review, flags, isPublished, isUnpublished, viewerTeamIds } = params;

    if (status === "loading") {
        return { message: "Loading review status…", lockText: null };
    }

    if (status === "failed") {
        if (failureKind === "noAccess") {
            return { message: NO_ACCESS_MESSAGE, lockText: null };
        }
        return {
            message: "Could not load the review status",
            lockText: "Editing and publishing are unavailable until it loads."
        };
    }

    if (status === "noWorkflow") {
        return { message: "", lockText: null };
    }

    if (status === "none" || review === null || review.state === ReviewState.Cancelled) {
        if (isPublished) {
            return LEGACY_PUBLISHED;
        }
        return NO_REVIEW;
    }

    if (review.state === ReviewState.Approved) {
        if (isPublished) {
            return { message: "Approved and published", lockText: LOCK_APPROVED };
        }
        if (isUnpublished) {
            return {
                message: "Approved and unpublished. Publishing again needs no new review.",
                lockText: LOCK_APPROVED
            };
        }
        return { message: "Approved, ready to publish", lockText: LOCK_APPROVED };
    }

    if (review.state === ReviewState.Rejected) {
        const display = getDisplayStep(review);
        if (!display) {
            return { message: "Rejected", lockText: LOCK_REJECTED };
        }
        return { message: getRejectionText(display.step), lockText: LOCK_REJECTED };
    }

    return getInProgressMessage(review, flags, viewerTeamIds);
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/getReviewActions.ts`:

```ts
import type { ReviewViewerFlags } from "~/review/domain/types.js";
import type { TargetReviewActionVm } from "./abstractions.js";

export interface ReviewActionsParams {
    /** `null` when there is no active review. */
    flags: ReviewViewerFlags | null;
    /** The current step of the review; `null` for Request review. */
    stepId: string | null;
    canRequest: boolean;
}

/**
 * The actions of the bar and the drawer footer: README 6 labels and icons, ordered ghost,
 * tertiary, secondary, primary. Only server flags decide what is offered (D5, D54); Restart is 8b.
 */
export const getReviewActions = (params: ReviewActionsParams): TargetReviewActionVm[] => {
    const { flags, stepId, canRequest } = params;
    const actions: TargetReviewActionVm[] = [];

    if (flags === null) {
        if (canRequest) {
            actions.push({
                kind: "request",
                label: "Request review",
                icon: "send",
                stepId: null,
                emphasis: "primary"
            });
        }
        return actions;
    }

    if (flags.canCancel) {
        actions.push({
            kind: "cancel",
            label: "Cancel review",
            icon: "block",
            stepId,
            emphasis: "ghost"
        });
    }
    if (flags.canReassign) {
        actions.push({
            kind: "reassign",
            label: "Reassign",
            icon: "swap_horiz",
            stepId,
            emphasis: "tertiary"
        });
    }
    if (flags.canReject) {
        actions.push({
            kind: "reject",
            label: "Reject",
            icon: "close",
            stepId,
            emphasis: "tertiary"
        });
    }
    if (flags.canTakeOver) {
        actions.push({
            kind: "takeOver",
            label: "Take over",
            icon: "front_hand",
            stepId,
            emphasis: "secondary"
        });
    }
    if (flags.canStart) {
        actions.push({
            kind: "start",
            label: "Start",
            icon: "play_arrow",
            stepId,
            emphasis: "primary"
        });
    }
    if (flags.canApprove) {
        actions.push({
            kind: "approve",
            label: "Approve",
            icon: "check",
            stepId,
            emphasis: "primary"
        });
    }

    return actions;
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/getReviewKind.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { TargetReviewKind } from "./abstractions.js";
import type { TargetReviewStatus } from "./abstractions.js";

/**
 * The review's kind for the editor rules, tags and app glue (they switch on `status` and
 * `reviewKind`, never on label text). Everything that is not an active review is "none";
 * a cancelled review is "none" (D75). Pure.
 */
export const getReviewKind = (status: TargetReviewStatus, review: Review | null): TargetReviewKind => {
    if (status !== "active" || review === null) {
        return "none";
    }
    if (review.state === ReviewState.Approved) {
        return "approved";
    }
    if (review.state === ReviewState.Rejected) {
        return "rejected";
    }
    if (review.state === ReviewState.InProgress) {
        return "inProgress";
    }
    return "none";
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/moveBlockedInReview.ts`:

```ts
/** The reason the app's Move control shows while a revision is in review (QBZ-58). */
export const MOVE_BLOCKED_IN_REVIEW = "Can’t move while this revision is in review.";
```

Create `packages/app-workflows/src/review/presentation/targetReview/getEditorRules.ts`:

```ts
import { MOVE_BLOCKED_IN_REVIEW } from "./moveBlockedInReview.js";
import type { TargetReviewKind } from "./abstractions.js";
import type { TargetReviewStatus } from "./abstractions.js";

export interface EditorRulesParams {
    status: TargetReviewStatus;
    reviewKind: TargetReviewKind;
    /** The revision was published before and is not published now (R226, Q19). */
    isUnpublished: boolean;
}

export interface EditorRules {
    allowsEditing: boolean;
    allowsPublishing: boolean;
    publishDisabledReason: string | null;
    moveDisabledReason: string | null;
}

const CHECKING = "Checking review status…";
const FAILED = "The review status could not be loaded. Try again from the review bar.";
const NEEDS_REVIEW = "Publishing needs an approved review. Request a review first.";
const REJECTED = "This revision was rejected. Create a new revision, then request a new review.";
const IN_REVIEW = "This revision is in review. Publishing is allowed once every step approves.";

/**
 * Who may edit, publish and move (R226, D79, D80, D85, D121). Unknown status locks everything
 * (QBZ-1); no active review (including a cancelled one) unlocks editing (D75). A revision with no
 * review that was published before and is unpublished now may publish again (Q19: it was reviewed
 * before it was published). Switches on `status`, `reviewKind` and `isUnpublished` only. Pure.
 */
export const getEditorRules = (params: EditorRulesParams): EditorRules => {
    const { status, reviewKind, isUnpublished } = params;

    if (status === "loading") {
        return {
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: CHECKING,
            moveDisabledReason: CHECKING
        };
    }

    if (status === "failed") {
        return {
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: FAILED,
            moveDisabledReason: FAILED
        };
    }

    if (status === "noWorkflow") {
        return {
            allowsEditing: true,
            allowsPublishing: true,
            publishDisabledReason: null,
            moveDisabledReason: null
        };
    }

    if (reviewKind === "none" && isUnpublished) {
        return {
            allowsEditing: true,
            allowsPublishing: true,
            publishDisabledReason: null,
            moveDisabledReason: null
        };
    }

    if (reviewKind === "none") {
        return {
            allowsEditing: true,
            allowsPublishing: false,
            publishDisabledReason: NEEDS_REVIEW,
            moveDisabledReason: null
        };
    }

    if (reviewKind === "approved") {
        return {
            allowsEditing: false,
            allowsPublishing: true,
            publishDisabledReason: null,
            moveDisabledReason: null
        };
    }

    if (reviewKind === "rejected") {
        return {
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: REJECTED,
            moveDisabledReason: null
        };
    }

    return {
        allowsEditing: false,
        allowsPublishing: false,
        publishDisabledReason: IN_REVIEW,
        moveDisabledReason: MOVE_BLOCKED_IN_REVIEW
    };
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/getReviewProgress.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import type { TargetReviewProgressVm } from "./abstractions.js";
import type { TargetReviewSegmentVm } from "./abstractions.js";
import { getStepOwnerLabel } from "./getStepOwnerLabel.js";

/** "n of N steps approved" and the segments of the popover (README 6). */
export const getReviewProgress = (review: Review): TargetReviewProgressVm => {
    const segments: TargetReviewSegmentVm[] = review.steps.map(step => {
        return {
            stepId: step.id,
            title: step.title,
            state: step.state,
            ownerLabel: getStepOwnerLabel(step),
            comment: step.comment
        };
    });
    const approved = review.steps.filter(step => step.state === StepState.Approved).length;

    return { approved, total: review.steps.length, segments };
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/getTargetIdFromRevisionId.ts`:

```ts
/** CMS and Website Builder revision ids are `<id>#<version>`; the target id is the part before. */
export const getTargetIdFromRevisionId = (revisionId: string): string => {
    const index = revisionId.indexOf("#");
    if (index === -1) {
        return revisionId;
    }
    return revisionId.slice(0, index);
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.ts`:

```ts
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import type { TargetReviewFailureKind } from "./abstractions.js";
import type { TargetReviewOpenAction } from "./abstractions.js";
import type { TargetReviewStatus } from "./abstractions.js";
import type { TargetReviewTag } from "./abstractions.js";
import type { TargetReviewTile } from "./abstractions.js";
import { getDisplayStep } from "./getDisplayStep.js";
import { getEditorRules } from "./getEditorRules.js";
import { getReviewKind } from "./getReviewKind.js";
import { getReviewActions } from "./getReviewActions.js";
import { getReviewMessage } from "./getReviewMessage.js";
import { getReviewProgress } from "./getReviewProgress.js";
import { getReviewStateTag } from "./getReviewStateTag.js";
import { getStepOwnerLabel } from "./getStepOwnerLabel.js";
import { getStepStateTag } from "./getStepStateTag.js";
import type { TargetReviewPresenter } from "./abstractions.js";

export interface TargetReviewViewModelInput {
    status: TargetReviewStatus;
    failureKind: TargetReviewFailureKind | null;
    review: ReviewWithFlags | null;
    canRequest: boolean;
    isPublished: boolean;
    isUnpublished: boolean;
    viewerTeamIds: string[];
    targetTitle: string;
    namespace: string;
    targetRevisionId: string;
    busy: boolean;
    openAction: TargetReviewOpenAction | null;
}

const getTile = (input: TargetReviewViewModelInput): TargetReviewTile => {
    if (input.status === "failed") {
        return "sync_problem";
    }
    if (input.status !== "active" || input.review === null) {
        return "rule";
    }

    const review = input.review.review;
    if (review.state === ReviewState.Approved) {
        return "check_circle";
    }
    if (review.state === ReviewState.Rejected) {
        return "cancel";
    }

    const display = getDisplayStep(review);
    if (display && display.step.state === StepState.Awaiting) {
        return "hourglass_empty";
    }
    if (display && display.step.state === StepState.Failed) {
        return "sync_problem";
    }
    return "rate_review";
};

/**
 * Builds the render-ready view model of the bar from the presenter's private state (R234). Pure:
 * every rule lives in the small functions it calls, so the presenter only holds state.
 */
export const buildTargetReviewViewModel = (
    input: TargetReviewViewModelInput
): TargetReviewPresenter.ViewModel => {
    const withFlags = input.status === "active" ? input.review : null;
    const review = withFlags ? withFlags.review : null;
    const flags = withFlags ? withFlags.flags : null;
    const display = review ? getDisplayStep(review) : null;

    const text = getReviewMessage({
        status: input.status,
        failureKind: input.failureKind,
        review,
        flags,
        isPublished: input.isPublished,
        isUnpublished: input.isUnpublished,
        viewerTeamIds: input.viewerTeamIds
    });
    const reviewKind = getReviewKind(input.status, review);
    const rules = getEditorRules({
        status: input.status,
        reviewKind,
        isUnpublished: input.isUnpublished
    });

    let actions = getReviewActions({ flags, stepId: null, canRequest: false });
    if (input.status === "none") {
        actions = getReviewActions({ flags: null, stepId: null, canRequest: input.canRequest });
    }
    if (review) {
        const stepId = display ? display.step.id : null;
        actions = getReviewActions({ flags, stepId, canRequest: false });
    }

    let stepMeta: string | null = null;
    let ownerMeta: string | null = null;
    let stepStateTag: TargetReviewTag | null = null;
    if (display) {
        stepMeta = `Step ${display.index + 1} of ${display.total}: ${display.step.title}`;
        ownerMeta = `Owner: ${getStepOwnerLabel(display.step)}`;
        stepStateTag = getStepStateTag(display.step.state);
    }

    return {
        status: input.status,
        failureKind: input.failureKind,
        reviewKind,
        targetTitle: input.targetTitle,
        namespace: input.namespace,
        targetRevisionId: input.targetRevisionId,
        message: text.message,
        lockText: text.lockText,
        tile: getTile(input),
        stateTag: review ? getReviewStateTag(review.state) : null,
        stepStateTag,
        stepMeta,
        ownerMeta,
        progress: review ? getReviewProgress(review) : null,
        actions,
        allowsEditing: rules.allowsEditing,
        allowsPublishing: rules.allowsPublishing,
        publishDisabledReason: rules.publishDisabledReason,
        moveDisabledReason: rules.moveDisabledReason,
        reviewId: review ? review.id : null,
        openAction: input.openAction,
        busy: input.busy
    };
};
```

Note on `getTile`: it is a module-local pure helper (unexported helpers stay in the file, code-style one-exported-function rule).

Create `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewChangedEvent } from "~/review/events/ReviewChangedEvent.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { TargetReviewPresenter as Abstraction } from "./abstractions.js";
import type { TargetReviewActionKind } from "./abstractions.js";
import type { TargetReviewContext } from "./abstractions.js";
import type { TargetReviewFailureKind } from "./abstractions.js";
import type { TargetReviewInitParams } from "./abstractions.js";
import type { TargetReviewOpenAction } from "./abstractions.js";
import type { TargetReviewStatus } from "./abstractions.js";
import { buildTargetReviewViewModel } from "./buildTargetReviewViewModel.js";
import { getTargetIdFromRevisionId } from "./getTargetIdFromRevisionId.js";

class TargetReviewPresenterImpl implements Abstraction.Interface {
    private params: TargetReviewInitParams | null = null;
    private status: TargetReviewStatus = "loading";
    private failureKind: TargetReviewFailureKind | null = null;
    private review: ReviewWithFlags | null = null;
    private busy = false;
    private action: TargetReviewOpenAction | null = null;
    private loadToken = 0;

    constructor(
        private eventPublisher: EventPublisher.Interface,
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            TargetReviewPresenterImpl,
            "eventPublisher" | "activity" | "identityContext" | "loadToken" | "params" | "review"
        >(this, {
            eventPublisher: false,
            activity: false,
            identityContext: false,
            loadToken: false,
            params: observableRef,
            review: observableRef
        });
    }

    get vm(): Abstraction.ViewModel {
        const params = this.params;
        const teams = this.identityContext.getIdentity().teams;
        return buildTargetReviewViewModel({
            status: this.status,
            failureKind: this.failureKind,
            review: this.review,
            canRequest: params ? params.canRequest : false,
            isPublished: params ? params.isPublished : false,
            isUnpublished: params ? params.isUnpublished : false,
            viewerTeamIds: teams.map(team => team.id),
            targetTitle: params ? params.targetTitle : "",
            namespace: params ? params.target.namespace : "",
            targetRevisionId: params ? params.target.targetRevisionId : "",
            busy: this.busy,
            openAction: this.action
        });
    }

    async init(params: TargetReviewInitParams): Promise<void> {
        this.begin(params);
        await this.refresh();
    }

    setContext(context: TargetReviewContext): void {
        if (!this.params) {
            return;
        }
        this.params = {
            ...this.params,
            targetTitle: context.targetTitle,
            canRequest: context.canRequest,
            isPublished: context.isPublished,
            isUnpublished: context.isUnpublished
        };
    }

    async refresh(): Promise<void> {
        const params = this.params;
        if (!params) {
            return;
        }

        const token = this.startLoad();
        let review: ReviewWithFlags | null = null;
        let hasWorkflow = false;

        try {
            const workflow = await params.useCases.getBoundWorkflow(params.target.namespace);
            if (token !== this.loadToken) {
                return;
            }
            hasWorkflow = workflow !== null;
            if (hasWorkflow) {
                review = await params.useCases.getTargetReview(params.target);
                if (token !== this.loadToken) {
                    return;
                }
            }
        } catch (error) {
            if (token !== this.loadToken) {
                return;
            }
            this.applyFailure(error);
            return;
        }

        this.applyLoaded(hasWorkflow, review);

        const current = this.review;
        let targetId = getTargetIdFromRevisionId(params.target.targetRevisionId);
        if (current) {
            targetId = current.review.targetId;
        }
        const event = new ReviewChangedEvent({
            namespace: params.target.namespace,
            targetId,
            targetRevisionId: params.target.targetRevisionId,
            review: current ? current.review : null
        });

        try {
            await this.eventPublisher.publish(event);
        } catch {
            // A failing cache writer must not break the bar; the state above is already applied.
        }
    }

    async actionDone(): Promise<void> {
        const params = this.params;
        if (!params) {
            return;
        }

        this.closeAction();
        await this.refresh();
        this.activity.notify({ namespace: params.target.namespace, source: "own" });
    }

    openAction(kind: TargetReviewActionKind, stepId: string | null): void {
        this.action = { kind, stepId };
    }

    closeAction(): void {
        this.action = null;
    }

    dispose(): void {
        this.loadToken += 1;
        this.params = null;
        this.status = "loading";
        this.failureKind = null;
        this.review = null;
        this.busy = false;
        this.action = null;
    }

    private begin(params: TargetReviewInitParams): void {
        this.loadToken += 1;
        this.params = params;
        this.status = "loading";
        this.failureKind = null;
        this.review = null;
        this.busy = false;
        this.action = null;
    }

    private startLoad(): number {
        this.loadToken += 1;
        this.busy = true;
        return this.loadToken;
    }

    private applyLoaded(hasWorkflow: boolean, review: ReviewWithFlags | null): void {
        this.busy = false;
        this.failureKind = null;

        if (!hasWorkflow) {
            this.review = null;
            this.status = "noWorkflow";
            return;
        }
        if (review === null || review.review.state === ReviewState.Cancelled) {
            this.review = null;
            this.status = "none";
            return;
        }
        this.review = review;
        this.status = "active";
    }

    private applyFailure(error: unknown): void {
        this.busy = false;
        this.review = null;
        this.status = "failed";
        this.failureKind = "error";
        if (error instanceof GraphQLOperationError && error.code === ReviewErrorCode.NotAuthorized) {
            this.failureKind = "noAccess";
        }
    }
}

export const TargetReviewPresenter = Abstraction.createImplementation({
    implementation: TargetReviewPresenterImpl,
    dependencies: [EventPublisher, ReviewActivity, IdentityContext]
});
```

Create `packages/app-workflows/src/review/presentation/targetReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { TargetReviewPresenter as Abstraction } from "./abstractions.js";
import { TargetReviewPresenter } from "./TargetReviewPresenter.js";

export const TargetReviewPresenterFeature = createFeature({
    name: "Workflows/TargetReviewPresenter",
    register(container) {
        // Transient (R212): every `useFeature` resolve is a new instance, one per view.
        container.register(TargetReviewPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
```

Modify `packages/app-workflows/src/app.tsx`. Add the import after the existing `WorkflowsFeature` import and the registration inside the gate after the last `RegisterFeature` line (Task 10 has already added `ReviewServicesFeature` there; keep its line, add this one after it; verify: the file still has the lines shown):

```tsx
// before
import { WorkflowsFeature } from "~/features/feature.js";
// after
import { WorkflowsFeature } from "~/features/feature.js";
import { TargetReviewPresenterFeature } from "~/review/presentation/targetReview/feature.js";
```

```tsx
// before
            <RegisterFeature feature={WorkflowsEditorPresenterFeature} />
            <SecurityPermissions />
// after
            <RegisterFeature feature={WorkflowsEditorPresenterFeature} />
            <RegisterFeature feature={TargetReviewPresenterFeature} />
            <SecurityPermissions />
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview/getReviewMessage.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/getEditorRules.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/getReviewActions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/stepLabels.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: PASS in every file. If the presenter test reports `Cannot read properties of undefined` for `ReviewState` or `StepState`, the Task 8 const objects use other key names: fix the imports in this task only after reading `~/review/domain/*.ts`, and keep the contract names.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview/getReviewMessage.test.ts packages/app-workflows/src/review/presentation/targetReview/getEditorRules.test.ts packages/app-workflows/src/review/presentation/targetReview/getReviewActions.test.ts packages/app-workflows/src/review/presentation/targetReview/stepLabels.test.ts packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: this task's test files (by path) all pass. The build prints no TypeScript errors. **Type check (R-e):** `yarn build -p @webiny/app-workflows` is the type check. `yarn check:test:types` does not cover co-located tests (the script only finds packages with `__tests__/**.test.ts` files and reports only errors inside `__tests__/`; `app-workflows` tests are co-located under `src/`). `packages/app-workflows/tsconfig.build.json` includes `src`, so `yarn build` type-checks every co-located `*.test.ts(x)` and the fixtures with `rootDir: ./src`; that is why the fixtures live in `src/review/testing/` and not in `__tests__/` (an import from outside `rootDir` fails the build with TS6059). Build `@webiny/app` first (`yarn build -p @webiny/app --no-cache 2>&1 | tail -30`) when Task 6 has not been built yet, because the presenter imports `GraphQLOperationError`.

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
git commit -m "feat(app-workflows): add the target review presenter and its message tables" -m "The presenter loads the bound workflow and the target review through the app's use cases, builds one render-ready view model and publishes ReviewChangedEvent after every settled load. The editing, publishing and moving rules, the review message table and the action list are pure functions driven by the server flags and the review state." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Composition-root test:** the registration assertions extend Task 10's `app.test.tsx` (a container-style `describe("WorkflowsAdminApp review view")`, no new file), and Tasks 15-18 and 25-27 add their tokens there. The contract's Interfaces for Tasks 10, 13, 25 and 27 also name a `wiring.test.tsx` that no 8a.3/8a.5 task creates; Tasks 25 and 27 use `app.test.tsx` and say so. That file mocks `~/presentation/ContentReviews.js`; Task 37 deletes that module and must drop the mock.
- **Viewer teams:** `IdentityContext` is not registered by the `app.test.tsx` container, so the test registers a stub (the presenter reads `getIdentity().teams` only when it builds its view model). A viewer who is a member of none of the step's candidate teams reads the full ", " list (R232); a viewer in several candidate teams reads them joined with " and ".
- `getEditorRules` lets `isUnpublished` enable Publish only when there is no active review (`reviewKind: "none"`); an unpublished revision with an in-progress, rejected or approved review follows that review's rules. The server still refuses a revision that has no review and was published before the workflow existed (A89); the client enables Publish and the refusal surfaces as the error toast.
- Size: large (sixteen source files, six test files, six fixture files), all small and pure except the presenter.
