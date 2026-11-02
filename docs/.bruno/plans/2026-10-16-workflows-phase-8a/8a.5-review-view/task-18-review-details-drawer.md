### Task 18: Review details drawer

R202, R203, R212, R216, R221, R225, R234, R-c, R-e, R-i, R-k, R-l; D5, D54, D88, D89, D107, D126; QBZ-1, QBZ-54, QBZ-59, QBZ-63, QBZ-64, QBZ-79, QBZ-83; README 7; Review Focus 12. The drawer (640px, admin-ui `Drawer` size `lg`) that opens from the bar's "Review details" and, in Task 26, from a list row (R221: presenter state, no route). It loads the review by id through the app's use cases and shows the header (title, review state tag, `Content: {title} (#{revision})`, requester, requested time), a vertical timeline with all six step states (owner, "Why this owner", times, the comment), the skipped-by-assignment box exactly as received (D89) and the footer actions from the server flags with the same action dialogs as the bar. `runs`, `issues` and `taskId` are mapped but never rendered (R203).

- **Why this owner** (design prototype): `picked` "Picked by requester"; `rule` "Assigned by a routing rule" (a rule id is not a name); `roundRobin` "Round-robin"; `leastLoaded` "Least-loaded"; `pool` the server's `reason` when present, else "Sent to team pool"; `poolStart` "Started from team pool"; `takeOver` "Taken over by {name}"; `reassign` "Reassigned by {name}". **Hidden** for AI and automation owners (R216, QBZ-63) and for steps without an assignment.
- **Times** (QBZ-54): "Reached 6 Oct, 10:41 · started 11:05 · finished 11:20", the date written once when start and finish fall on the day of "reached"; not shown for a step that was not reached.
- **Comment:** `{Name}: “…”` (AI and automation owners by the step title, QBZ-79); a rejected step without a comment shows "Rejected at {step}." in its place (R216, the QBZ-83 "by" is dropped as ruled in Task 13).
- **Skipped** entries (`assignments` of kind `skip`, present only for viewers who may see them, D89): `{ name, reason }` per step, the reason as received, each line rendered "{Name}: {reason}" where `name` is the entry's `userDisplayName` (resolved server-side, Task 5b, R251) and, while the name is `null` or blank, the exported neutral constant `SKIPPED_PERSON_LABEL = "A person"`; a raw user id is never shown.
- **Hover (QBZ-54):** the requested time and the step's Times line carry a `title` with the full date and time with timezone (`formatReviewTimeFull`, `getStepTimesTitle`).
- **After an action in the drawer:** `actionDone` reads the review's namespace before the refresh (a failed refresh clears the review), refreshes, then always signals `ReviewActivity` (when a namespace was known) and calls `onChanged`.
- **States:** loading "Loading review…" with three skeleton rows; failed "Could not load review details" / "The server did not respond. Try again in a moment." with Try again; no access the shared `NO_ACCESS_MESSAGE` (R-i); a cancelled review shows its header and "{Name} cancelled this review at {time}. The revision has no review now; a new request starts again from the first step." (`{Name}` is `review.cancelledBy.displayName`, R252; "Someone cancelled this review at {time}. ..." while `cancelledBy` is `null`) and no timeline (QBZ-1).

**Files:**
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/abstractions.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/formatReviewTimeFull.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/getStepTimesTitle.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/getWhyOwner.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/getStepTimes.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/getRevisionNumber.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/feature.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.tsx`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx`
- Modify: `packages/app-workflows/src/app.tsx`

**Interfaces:**
- Consumes: Task 13 (`getReviewActions`, `getStepOwnerLabel`, `getStepStateTag`, `getReviewStateTag`, `getRejectionText`, `NO_ACCESS_MESSAGE`, `TargetReviewActionVm`, `TargetReviewTagVariant`, `TargetReviewOpenAction`), Task 15 (`ReviewActionDialogs`, `toActionRequest`, `formatReviewTime`, `classifyReviewActionError`, `renderWithContainer`), Task 17 (`getStepTypeLabel`), Task 10 (`ReviewActivity`), Task 8 (`Review` incl. `cancelledBy` (Task 5c, R252), `ReviewStep`, `ReviewWithFlags`, `ReviewAssignmentEntry` incl. `userDisplayName` (Task 5b, R251), `IReviewUseCases.getReview`, `createReview`/`createReviewWithFlags` from `~/review/testing/reviewFixtures.js`), Task 6. Existing (verified): admin-ui `Drawer` (`open`, `onClose`, `title`, `actions`, `size`), `Button`, `Tag`, `Skeleton`, `Alert`, `Text`.
- Produces: `ReviewDetailsInitParams { useCases; reviewId; reviewsUrl; onClose; onChanged? }`; `IReviewDetailsViewModel` (below); presenter `{ vm; init; refresh(); actionDone(); openAction(kind, stepId); closeAction(); dispose() }`; token `ReviewDetailsPresenter` (`"Workflows/ReviewDetailsPresenter"`, transient, dependencies `[ReviewActivity]`); `ReviewDetailsPresenterFeature`; `ReviewDetailsDrawer` props `{ useCases; reviewId; reviewsUrl; onClose; onChanged? }`. Consumed by Tasks 19, 26.

**Test runner note:** admin package, `yarn test <path>` only.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { buildReviewDetailsViewModel } from "./buildReviewDetailsViewModel.js";
import { SKIPPED_PERSON_LABEL } from "./buildReviewDetailsViewModel.js";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";
import { getRevisionNumber } from "./getRevisionNumber.js";
import { getStepTimes } from "./getStepTimes.js";
import { getWhyOwner } from "./getWhyOwner.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import type { ReviewAssignmentEntry } from "~/review/domain/types.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";

const NOW = new Date(2026, 9, 16, 15, 0);
const at = (day: number, hour: number, minute: number): string => {
    return new Date(2026, 9, day, hour, minute).toISOString();
};
const LUKA = createActor({ id: "user-2", displayName: "Luka Perić" });

describe("getRevisionNumber", () => {
    it("strips the leading zeros of the version", () => {
        expect(getRevisionNumber("entry-1#0003")).toBe("3");
        expect(getRevisionNumber("entry-1#0012")).toBe("12");
    });

    it("returns an empty string without a version", () => {
        expect(getRevisionNumber("entry-1")).toBe("");
    });
});

describe("getWhyOwner", () => {
    const assignment = (source: string, overrides = {}) => ({
        source,
        ruleId: null,
        reason: null,
        by: null,
        ...overrides
    });

    it("maps every source to the design text", () => {
        const table: Array<[string, string]> = [
            ["picked", "Picked by requester"],
            ["rule", "Assigned by a routing rule"],
            ["roundRobin", "Round-robin"],
            ["leastLoaded", "Least-loaded"],
            ["pool", "Sent to team pool"],
            ["poolStart", "Started from team pool"]
        ];
        table.forEach(([source, text]) => {
            const step = createStep({ owner: LUKA, assignment: assignment(source) });
            expect(getWhyOwner(step)).toBe(text);
        });
    });

    it("uses the server reason for a pool outcome", () => {
        const step = createStep({
            owner: null,
            assignment: assignment("pool", { reason: "No rule matched and the strategy is None" })
        });
        expect(getWhyOwner(step)).toBe("No rule matched and the strategy is None");
    });

    it("names who took over or reassigned", () => {
        const operator = createActor({ id: "user-3", displayName: "Jana Dolenc" });
        const takeOver = createStep({ owner: LUKA, assignment: assignment("takeOver", { by: LUKA }) });
        const reassign = createStep({ owner: LUKA, assignment: assignment("reassign", { by: operator }) });
        expect(getWhyOwner(takeOver)).toBe("Taken over by Luka Perić");
        expect(getWhyOwner(reassign)).toBe("Reassigned by Jana Dolenc");
    });

    it("hides the row for AI and automation owners (R216, QBZ-63)", () => {
        const ai = createStep({
            owner: createActor({ type: "ai", displayName: "model" }),
            assignment: assignment("rule")
        });
        expect(getWhyOwner(ai)).toBeNull();
    });

    it("hides the row without an assignment", () => {
        expect(getWhyOwner(createStep({ owner: LUKA, assignment: null }))).toBeNull();
    });
});

describe("getStepTimes (QBZ-54)", () => {
    it("is null for a step that was not reached", () => {
        expect(getStepTimes(createStep(), NOW)).toBeNull();
    });

    it("writes the date once when everything falls on the day of 'reached'", () => {
        const step = createStep({
            reachedOn: at(6, 10, 41),
            startedOn: at(6, 11, 5),
            finishedOn: at(6, 11, 20)
        });
        expect(getStepTimes(step, NOW)).toBe("Reached 6 Oct, 10:41 · started 11:05 · finished 11:20");
    });

    it("writes the date again for a later day", () => {
        const step = createStep({
            reachedOn: at(6, 10, 41),
            startedOn: at(7, 9, 0),
            finishedOn: null
        });
        expect(getStepTimes(step, NOW)).toBe("Reached 6 Oct, 10:41 · started 7 Oct, 09:00");
    });

    it("shows only 'reached' for a step that was not started", () => {
        expect(getStepTimes(createStep({ reachedOn: at(16, 14, 20) }), NOW)).toBe("Reached 14:20");
    });
});

const skip = (
    userId: string,
    reason: string | null,
    userDisplayName: string | null = null
): ReviewAssignmentEntry => ({
    id: `skip-${userId}`,
    kind: "skip",
    userId,
    userDisplayName,
    assignedOn: at(6, 10, 0),
    source: "pool",
    ruleId: null,
    by: null,
    reason
});

describe("buildReviewDetailsViewModel", () => {
    const build = (review = createReview(), flags = createFlags()) => {
        return buildReviewDetailsViewModel({
            status: "loaded",
            review: createReviewWithFlags(review, flags),
            error: null,
            openAction: null,
            now: NOW
        });
    };

    it("builds the header lines", () => {
        const review = createReview({
            title: "Spring campaign review",
            targetRevisionId: "entry-1#0003",
            createdOn: at(16, 9, 5),
            createdBy: createActor({ displayName: "Maja Kos" }),
            targetContext: {
                folder: null,
                modelId: "article",
                title: "Spring campaign",
                author: { id: "user-1", displayName: "Maja Kos" }
            }
        });

        const { header } = build(review);

        expect(header).toEqual({
            title: "Spring campaign review",
            stateLabel: "In progress",
            stateVariant: "accent-light",
            contentLine: "Content: Spring campaign (#3)",
            requesterLine: "Requester: Maja Kos",
            requestedLine: "Requested: 09:05",
            requestedTitle: formatReviewTimeFull(at(16, 9, 5))
        });
    });

    it("builds a timeline for all six step states", () => {
        const review = createReview({
            steps: [
                createStep({ id: "a", title: "S pending", state: StepState.Pending }),
                createStep({ id: "b", title: "S awaiting", state: StepState.Awaiting, reachedOn: at(16, 10, 0) }),
                createStep({
                    id: "c",
                    title: "S in review",
                    state: StepState.InReview,
                    owner: LUKA,
                    reachedOn: at(16, 10, 0)
                }),
                createStep({
                    id: "d",
                    title: "S approved",
                    state: StepState.Approved,
                    owner: LUKA,
                    comment: "Looks fine.",
                    reachedOn: at(16, 10, 0)
                }),
                createStep({
                    id: "e",
                    title: "S rejected",
                    state: StepState.Rejected,
                    owner: LUKA,
                    comment: null,
                    reachedOn: at(16, 10, 0)
                }),
                createStep({
                    id: "f",
                    title: "S failed",
                    state: StepState.Failed,
                    owner: createActor({ type: "automation", displayName: "Send webhook" }),
                    reachedOn: at(16, 10, 0)
                })
            ]
        });

        const { steps } = build(review);

        expect(steps.map(step => step.stateLabel)).toEqual([
            "Pending",
            "Awaiting",
            "In review",
            "Approved",
            "Rejected",
            "Failed"
        ]);
        expect(steps[0].ownerLine).toBeNull();
        expect(steps[0].times).toBeNull();
        expect(steps[1].ownerLine).toBe("Team pool");
        expect(steps[2].ownerLine).toBe("Luka Perić");
        expect(steps[3].comment).toBe("Luka Perić: “Looks fine.”");
        expect(steps[4].comment).toBe("Rejected at S rejected.");
        expect(steps[5].ownerLine).toBe("S failed");
    });

    it("hides 'Why this owner' for an AI step and shows it for a person", () => {
        const review = createReview({
            steps: [
                createStep({
                    id: "a",
                    title: "AI check",
                    type: "ai",
                    state: StepState.Approved,
                    owner: createActor({ type: "ai", displayName: "model" }),
                    assignment: { source: "rule", ruleId: null, reason: null, by: null },
                    reachedOn: at(16, 10, 0)
                }),
                createStep({
                    id: "b",
                    state: StepState.InReview,
                    owner: LUKA,
                    assignment: { source: "poolStart", ruleId: null, reason: null, by: null },
                    reachedOn: at(16, 10, 0)
                })
            ]
        });

        const { steps } = build(review);

        expect(steps[0].typeLabel).toBe("AI");
        expect(steps[0].whyOwner).toBeNull();
        expect(steps[1].typeLabel).toBe("People");
        expect(steps[1].whyOwner).toBe("Started from team pool");
    });

    it("shows the skipped-by-assignment box exactly as received (D89)", () => {
        const review = createReview({
            steps: [
                createStep({
                    state: StepState.InReview,
                    owner: LUKA,
                    reachedOn: at(16, 10, 0),
                    assignments: [
                        skip("user-9", "is the requester", "Pat Kim"),
                        skip("user-8", "excluded until 20 Oct: on leave"),
                        skip("user-7", "is on leave", "   "),
                        {
                            id: "outcome-1",
                            kind: "outcome",
                            userId: "user-2",
                            userDisplayName: "Luka Perić",
                            assignedOn: at(16, 10, 0),
                            source: "pool",
                            ruleId: null,
                            by: null,
                            reason: null
                        }
                    ]
                })
            ]
        });

        const { steps } = build(review);

        expect(steps[0].skipped).toEqual([
            { name: "Pat Kim", reason: "is the requester" },
            { name: SKIPPED_PERSON_LABEL, reason: "excluded until 20 Oct: on leave" },
            { name: SKIPPED_PERSON_LABEL, reason: "is on leave" }
        ]);
        expect(SKIPPED_PERSON_LABEL).toBe("A person");
        expect(JSON.stringify(steps[0])).not.toContain("user-9");
        expect(JSON.stringify(steps[0])).not.toContain("user-8");
        expect(JSON.stringify(steps[0])).not.toContain("user-7");
    });

    it("has no skipped box without skip entries or without assignments", () => {
        const none = build(createReview({ steps: [createStep({ assignments: null })] }));
        const empty = build(createReview({ steps: [createStep({ assignments: [] })] }));
        expect(none.steps[0].skipped).toBeNull();
        expect(empty.steps[0].skipped).toBeNull();
    });

    it("offers the footer actions from the server flags for the current step", () => {
        const review = createReview({ currentStepId: "step-1" });

        const { actions } = build(review, createFlags({ canTakeOver: true, canReassign: true }));

        expect(actions.map(action => [action.kind, action.stepId])).toEqual([
            ["reassign", "step-1"],
            ["takeOver", "step-1"]
        ]);
    });

    it("shows a cancelled review with its header, no timeline and no actions (QBZ-1)", () => {
        const review = createReview({
            state: ReviewState.Cancelled,
            isActive: false,
            lastChangedOn: at(16, 14, 20)
        });

        const vm = build(review, createFlags({ canCancel: true }));

        expect(vm.header?.stateLabel).toBe("Cancelled");
        expect(vm.steps).toEqual([]);
        expect(vm.actions).toEqual([]);
        expect(vm.cancelledText).toBe(
            "Someone cancelled this review at 14:20. The revision has no review now; a new request starts again from the first step."
        );
    });

    it("names who cancelled the review when the review carries it (R252)", () => {
        const review = createReview({
            state: ReviewState.Cancelled,
            isActive: false,
            lastChangedOn: at(16, 14, 20),
            cancelledBy: createActor({ id: "user-5", displayName: "Nina Cole" })
        });

        const vm = build(review);

        expect(vm.cancelledText).toBe(
            "Nina Cole cancelled this review at 14:20. The revision has no review now; a new request starts again from the first step."
        );
    });

    it("falls back to 'Someone' for a blank canceller name", () => {
        const review = createReview({
            state: ReviewState.Cancelled,
            isActive: false,
            lastChangedOn: at(16, 14, 20),
            cancelledBy: createActor({ displayName: "  " })
        });

        expect(build(review).cancelledText).toContain("Someone cancelled this review at 14:20.");
    });

    it("builds the loading and failed states without a header", () => {
        const loading = buildReviewDetailsViewModel({
            status: "loading",
            review: null,
            error: null,
            openAction: null,
            now: NOW
        });
        const failed = buildReviewDetailsViewModel({
            status: "failed",
            review: null,
            error: "The server did not respond. Try again in a moment.",
            openAction: null,
            now: NOW
        });

        expect(loading.header).toBeNull();
        expect(loading.steps).toEqual([]);
        expect(failed.error).toBe("The server did not respond. Try again in a moment.");
        expect(failed.actions).toEqual([]);
    });

    it("never carries runs, issues or the task id (R203)", () => {
        const review = createReview({
            steps: [
                createStep({
                    state: StepState.Failed,
                    owner: createActor({ type: "ai", displayName: "model" }),
                    reachedOn: at(16, 10, 0),
                    taskId: "task-secret-1",
                    runs: [
                        {
                            taskId: "task-secret-0",
                            startedOn: at(16, 9, 0),
                            finishedOn: at(16, 9, 5),
                            outcome: "failed",
                            reason: "run reason secret"
                        }
                    ],
                    issues: [
                        {
                            fieldPath: "title",
                            severity: "error",
                            message: "issue message secret",
                            suggestion: "issue suggestion secret"
                        }
                    ]
                })
            ]
        });

        const text = JSON.stringify(build(review));

        ["task-secret-1", "task-secret-0", "run reason secret", "issue message secret", "issue suggestion secret"].forEach(
            secret => expect(text).not.toContain(secret)
        );
    });

    it("gives every time a full date, time and timezone on hover (QBZ-54)", () => {
        const review = createReview({
            steps: [
                createStep({
                    state: StepState.Approved,
                    owner: LUKA,
                    reachedOn: at(6, 10, 41),
                    startedOn: at(6, 11, 5),
                    finishedOn: at(6, 11, 20)
                })
            ]
        });

        const { steps } = build(review);

        expect(steps[0].timesTitle).toContain("Reached");
        expect(steps[0].timesTitle).toContain("6 Oct 2026");
        expect(steps[0].timesTitle).toContain("Finished");
    });

    it("is render-ready: plain data only (R234)", () => {
        const vm = build();
        expect(JSON.parse(JSON.stringify(vm))).toEqual(vm);
    });
});
```

Create `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { ReviewDetailsPresenterFeature } from "./feature.js";
import type { ReviewDetailsInitParams } from "./abstractions.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import type { FakeReviewUseCases } from "~/review/testing/fakeReviewUseCases.js";

interface Setup {
    presenter: ReturnType<typeof ReviewDetailsPresenterFeature.resolve>["presenter"];
    useCases: FakeReviewUseCases;
    activity: { subscribe: ReturnType<typeof vi.fn>; notify: ReturnType<typeof vi.fn> };
    onClose: ReturnType<typeof vi.fn>;
    onChanged: ReturnType<typeof vi.fn>;
    params: () => ReviewDetailsInitParams;
}

const createSetup = (): Setup => {
    const container = new Container();
    const activity = { subscribe: vi.fn(), notify: vi.fn() };
    container.registerInstance(ReviewActivity, activity);
    ReviewDetailsPresenterFeature.register(container);
    const { presenter } = ReviewDetailsPresenterFeature.resolve(container);
    const useCases = createFakeUseCases();
    useCases.getReview.mockResolvedValue(
        createReviewWithFlags(createReview(), createFlags({ canStart: true }))
    );
    const onClose = vi.fn();
    const onChanged = vi.fn();
    return {
        presenter,
        useCases,
        activity,
        onClose,
        onChanged,
        params: () => ({
            useCases,
            reviewId: "review-1",
            reviewsUrl: "/cms/content-reviews",
            onClose,
            onChanged
        })
    };
};

describe("ReviewDetailsPresenter", () => {
    let setup: Setup;

    beforeEach(() => {
        setup = createSetup();
    });

    it("loads the review by id and is loading before that", async () => {
        const pending = setup.presenter.init(setup.params());
        expect(setup.presenter.vm.status).toBe("loading");

        await pending;

        expect(setup.useCases.getReview).toHaveBeenCalledWith("review-1");
        expect(setup.presenter.vm.status).toBe("loaded");
        expect(setup.presenter.vm.header?.title).toBe("Spring campaign");
        expect(setup.presenter.vm.actions.map(action => action.kind)).toEqual(["start"]);
    });

    it("fails with the design text when the load rejects", async () => {
        setup.useCases.getReview.mockRejectedValue(new Error("Network."));

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.error).toBe("The server did not respond. Try again in a moment.");
    });

    it("fails with the no-access text for a read that is not authorized (QBZ-59)", async () => {
        setup.useCases.getReview.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.error).toBe(NO_ACCESS_MESSAGE);
    });

    it("retries with refresh while keeping the loaded view during a reload", async () => {
        await setup.presenter.init(setup.params());
        let release: (value: ReturnType<typeof createReviewWithFlags>) => void = () => undefined;
        setup.useCases.getReview.mockReturnValue(
            new Promise(resolve => {
                release = resolve;
            })
        );

        const pending = setup.presenter.refresh();
        expect(setup.presenter.vm.status).toBe("loaded");

        release(createReviewWithFlags(createReview({ title: "Renamed" }), createFlags()));
        await pending;
        expect(setup.presenter.vm.header?.title).toBe("Renamed");
    });

    it("recovers from a failed load with refresh", async () => {
        setup.useCases.getReview.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.init(setup.params());
        expect(setup.presenter.vm.status).toBe("failed");

        await setup.presenter.refresh();

        expect(setup.presenter.vm.status).toBe("loaded");
    });

    it("opens and closes an action", async () => {
        await setup.presenter.init(setup.params());

        setup.presenter.openAction("start", "step-1");
        expect(setup.presenter.vm.openAction).toEqual({ kind: "start", stepId: "step-1" });

        setup.presenter.closeAction();
        expect(setup.presenter.vm.openAction).toBeNull();
    });

    it("refreshes, signals the activity bus and tells the host after an action (Task 26, 19)", async () => {
        await setup.presenter.init(setup.params());
        setup.presenter.openAction("start", "step-1");

        await setup.presenter.actionDone();

        expect(setup.presenter.vm.openAction).toBeNull();
        expect(setup.useCases.getReview).toHaveBeenCalledTimes(2);
        expect(setup.activity.notify).toHaveBeenCalledWith({ namespace: "cms.article", source: "own" });
        expect(setup.onChanged).toHaveBeenCalledTimes(1);
    });

    it("signals the activity bus and the host even when the refresh after an action fails", async () => {
        await setup.presenter.init(setup.params());
        setup.useCases.getReview.mockRejectedValue(new Error("Network."));

        await setup.presenter.actionDone();

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.activity.notify).toHaveBeenCalledWith({ namespace: "cms.article", source: "own" });
        expect(setup.onChanged).toHaveBeenCalledTimes(1);
    });

    it("ignores a late response after dispose and resets", async () => {
        let release: (value: ReturnType<typeof createReviewWithFlags>) => void = () => undefined;
        setup.useCases.getReview.mockReturnValue(
            new Promise(resolve => {
                release = resolve;
            })
        );
        const pending = setup.presenter.init(setup.params());

        setup.presenter.dispose();
        release(createReviewWithFlags());
        await pending;

        expect(setup.presenter.vm.status).toBe("loading");
        expect(setup.presenter.vm.header).toBeNull();
    });

    it("is transient", () => {
        const container = new Container();
        container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
        ReviewDetailsPresenterFeature.register(container);
        const first = ReviewDetailsPresenterFeature.resolve(container).presenter;
        const second = ReviewDetailsPresenterFeature.resolve(container).presenter;
        expect(first).not.toBe(second);
    });
});
```

Create `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { within } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { StepState } from "~/review/domain/StepState.js";
import { ReviewActionDialogPresenterFeature } from "../../actionDialog/feature.js";
import { ReviewDetailsPresenterFeature } from "../feature.js";
import { ReviewDetailsDrawer } from "./ReviewDetailsDrawer.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";

const createContainer = () => {
    const container = new Container();
    container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
    container.registerInstance(ReviewToasts, { show: vi.fn() });
    ReviewDetailsPresenterFeature.register(container);
    ReviewActionDialogPresenterFeature.register(container);
    return container;
};

const createUseCases = () => {
    const useCases = createFakeUseCases();
    const luka = createActor({ id: "user-2", displayName: "Luka Perić" });
    const review = createReview({
        title: "Spring campaign review",
        currentStepId: "s2",
        steps: [
            createStep({
                id: "s1",
                title: "Editorial check",
                state: StepState.Approved,
                owner: luka,
                comment: "Looks fine.",
                reachedOn: new Date().toISOString()
            }),
            createStep({
                id: "s2",
                title: "Legal sign-off",
                state: StepState.Awaiting,
                reachedOn: new Date().toISOString(),
                candidateTeams: [{ id: "t1", name: "Legal" }]
            }),
            createStep({ id: "s3", title: "Brand check", state: StepState.Pending })
        ]
    });
    useCases.getReview.mockResolvedValue(
        createReviewWithFlags(review, createFlags({ canStart: true }))
    );
    return useCases;
};

const renderDrawer = (useCases = createUseCases(), onClose = vi.fn()) => {
    renderWithContainer(
        <ReviewDetailsDrawer
            useCases={useCases}
            reviewId={"review-1"}
            reviewsUrl={null}
            onClose={onClose}
        />,
        createContainer()
    );
    return { useCases, onClose };
};

describe("ReviewDetailsDrawer", () => {
    it("shows the loading text first", () => {
        renderDrawer();

        expect(screen.getByText("Loading review…")).toBeTruthy();
    });

    it("shows the header and the timeline with owner, comment and team pool", async () => {
        renderDrawer();

        expect(await screen.findByText("Spring campaign review")).toBeTruthy();
        expect(screen.getByText("Requester: Maja Kos")).toBeTruthy();
        expect(screen.getByText("Editorial check")).toBeTruthy();
        expect(screen.getByText("Luka Perić: “Looks fine.”")).toBeTruthy();
        expect(screen.getByText("Team pool (Legal)")).toBeTruthy();
        ["Approved", "Awaiting", "Pending"].forEach(label => {
            expect(screen.getAllByText(label).length).toBeGreaterThan(0);
        });
    });

    it("does not render runs, issues or the task id (R203)", async () => {
        const useCases = createUseCases();
        const loaded = await useCases.getReview("review-1");
        const step = loaded.review.steps[0];
        step.taskId = "task-secret-1";
        step.runs = [
            { taskId: "task-secret-0", startedOn: new Date().toISOString(), finishedOn: null, outcome: "failed", reason: "run reason secret" }
        ];
        step.issues = [
            { fieldPath: null, severity: "error", message: "issue message secret", suggestion: null }
        ];
        useCases.getReview.mockResolvedValue(loaded);
        renderDrawer(useCases);

        await screen.findByText("Spring campaign review");

        expect(document.body.textContent).not.toContain("task-secret");
        expect(document.body.textContent).not.toContain("run reason secret");
        expect(document.body.textContent).not.toContain("issue message secret");
    });

    it("shows the full time on hover through the title attribute (QBZ-54)", async () => {
        renderDrawer();
        await screen.findByText("Spring campaign review");

        const requested = screen.getByText(/^Requested:/);

        expect(requested.getAttribute("title")).toMatch(/\d{4}/);
    });

    it("shows the failed state with Try again that reloads", async () => {
        const useCases = createUseCases();
        useCases.getReview.mockRejectedValueOnce(new Error("Network."));
        renderDrawer(useCases);

        expect(await screen.findByText("Could not load review details")).toBeTruthy();
        expect(screen.getByText("The server did not respond. Try again in a moment.")).toBeTruthy();
        fireEvent.click(screen.getByText("Try again"));

        expect(await screen.findByText("Spring campaign review")).toBeTruthy();
    });

    it("shows the footer actions from the flags and opens the same action dialog", async () => {
        renderDrawer();
        await screen.findByText("Spring campaign review");

        fireEvent.click(screen.getByText("Start", { selector: "button *, button" }));

        expect(await screen.findByText("Start “Legal sign-off”?")).toBeTruthy();
    });

    it("calls onClose from the close control", async () => {
        const { onClose } = renderDrawer();
        await screen.findByText("Spring campaign review");

        // The drawer header holds the icon-only close control as its first button.
        fireEvent.click(within(screen.getByRole("dialog")).getAllByRole("button")[0]);

        expect(onClose).toHaveBeenCalled();
    });
});
```

Extend Task 10's `packages/app-workflows/src/app.test.tsx` ("WorkflowsAdminApp review view" `describe`, Task 13): import the token and add one line to each of its three tests (the `ReviewActivity` the details presenter needs is registered by Task 10's `ReviewServicesFeature`).

```tsx
import { ReviewDetailsPresenter } from "~/review/presentation/reviewDetails/abstractions.js";
```

```tsx
// in "registers the review view presenters when the flag is on"
        expect(container.resolve(ReviewDetailsPresenter)).toBeDefined();

// in "registers the presenters transient: every resolve is a new instance (R212)"
        const firstDetails = container.resolve(ReviewDetailsPresenter);
        const secondDetails = container.resolve(ReviewDetailsPresenter);
        expect(firstDetails).not.toBe(secondDetails);

// in "registers no review view presenter when the flag is off (R211)"
        expect(() => container.resolve(ReviewDetailsPresenter)).toThrow();
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: `Failed to resolve import` for the new modules. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/review/presentation/reviewDetails/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { TargetReviewActionKind } from "../targetReview/abstractions.js";
import type { TargetReviewActionVm } from "../targetReview/abstractions.js";
import type { TargetReviewOpenAction } from "../targetReview/abstractions.js";
import type { TargetReviewTagVariant } from "../targetReview/abstractions.js";

export interface ReviewDetailsInitParams {
    useCases: IReviewUseCases;
    reviewId: string;
    reviewsUrl: string | null;
    onClose: () => void;
    /** Called after an action in the drawer changed the review (the editor refreshes its bar). */
    onChanged?: () => void;
}

export interface ReviewDetailsHeaderVm {
    title: string;
    stateLabel: string;
    stateVariant: TargetReviewTagVariant;
    contentLine: string;
    requesterLine: string;
    requestedLine: string;
    /** The full date and time with timezone, shown on hover (QBZ-54). */
    requestedTitle: string;
}

export interface ReviewDetailsSkippedVm {
    name: string;
    reason: string;
}

export interface ReviewDetailsStepVm {
    stepId: string;
    title: string;
    color: string;
    typeLabel: string;
    state: StepStateValue;
    stateLabel: string;
    stateVariant: TargetReviewTagVariant;
    ownerLine: string | null;
    whyOwner: string | null;
    times: string | null;
    /** The full date and time of each event with timezone, shown on hover (QBZ-54). */
    timesTitle: string | null;
    comment: string | null;
    skipped: ReviewDetailsSkippedVm[] | null;
}

/** Render-ready (R234): no review, step or presenter object. */
export interface IReviewDetailsViewModel {
    status: "loading" | "failed" | "loaded";
    header: ReviewDetailsHeaderVm | null;
    steps: ReviewDetailsStepVm[];
    cancelledText: string | null;
    actions: TargetReviewActionVm[];
    error: string | null;
    openAction: TargetReviewOpenAction | null;
    reviewId: string | null;
}

export interface IReviewDetailsPresenter {
    readonly vm: IReviewDetailsViewModel;
    init(params: ReviewDetailsInitParams): Promise<void>;
    refresh(): Promise<void>;
    openAction(kind: TargetReviewActionKind, stepId: string | null): void;
    closeAction(): void;
    actionDone(): Promise<void>;
    dispose(): void;
}

export const ReviewDetailsPresenter = createAbstraction<IReviewDetailsPresenter>(
    "Workflows/ReviewDetailsPresenter"
);

export namespace ReviewDetailsPresenter {
    export type Interface = IReviewDetailsPresenter;
    export type ViewModel = IReviewDetailsViewModel;
}
```

Create `packages/app-workflows/src/review/presentation/reviewDetails/getRevisionNumber.ts`:

```ts
/** The version of a `<id>#<version>` revision id without leading zeros; "" without one. */
export const getRevisionNumber = (revisionId: string): string => {
    const index = revisionId.indexOf("#");
    if (index === -1) {
        return "";
    }
    const version = Number(revisionId.slice(index + 1));
    return String(version);
};
```

Create `packages/app-workflows/src/review/presentation/reviewDetails/formatReviewTimeFull.ts`:

```ts
const FORMAT = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short"
});

/**
 * The hover text of every time (QBZ-54): the full date and time with its timezone in the
 * viewer's locale settings, e.g. "Tue 6 Oct 2026, 14:20 CEST". Pure.
 */
export const formatReviewTimeFull = (iso: string): string => {
    const date = new Date(iso);
    const formatted = FORMAT.format(date);
    return formatted.replace(",", "");
};
```

Create `packages/app-workflows/src/review/presentation/reviewDetails/getStepTimesTitle.ts`:

```ts
import type { ReviewStep } from "~/review/domain/types.js";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";

/** The hover text of a step's "Times" line: every event with its full date, time and timezone. Pure. */
export const getStepTimesTitle = (step: ReviewStep): string | null => {
    if (step.reachedOn === null) {
        return null;
    }

    const reached = formatReviewTimeFull(step.reachedOn);
    const parts = [`Reached ${reached}`];
    if (step.startedOn !== null) {
        const started = formatReviewTimeFull(step.startedOn);
        parts.push(`Started ${started}`);
    }
    if (step.finishedOn !== null) {
        const finished = formatReviewTimeFull(step.finishedOn);
        parts.push(`Finished ${finished}`);
    }
    return parts.join(" · ");
};
```

Create `packages/app-workflows/src/review/presentation/reviewDetails/getWhyOwner.ts`:

```ts
import type { ReviewStep } from "~/review/domain/types.js";

/**
 * "Why this owner" (design prototype, D127): hidden for AI and automation owners (R216, QBZ-63)
 * and for a step without an assignment. A rule id is not a name, so a rule reads "Assigned by a
 * routing rule". Pure.
 */
export const getWhyOwner = (step: ReviewStep): string | null => {
    if (step.owner !== null && step.owner.type !== "user") {
        return null;
    }
    const assignment = step.assignment;
    if (assignment === null) {
        return null;
    }

    const by = assignment.by ? assignment.by.displayName : "someone";

    switch (assignment.source) {
        case "picked":
            return "Picked by requester";
        case "rule":
            return "Assigned by a routing rule";
        case "roundRobin":
            return "Round-robin";
        case "leastLoaded":
            return "Least-loaded";
        case "pool":
            return assignment.reason ? assignment.reason : "Sent to team pool";
        case "poolStart":
            return "Started from team pool";
        case "takeOver":
            return `Taken over by ${by}`;
        case "reassign":
            return `Reassigned by ${by}`;
        default:
            return null;
    }
};
```

Create `packages/app-workflows/src/review/presentation/reviewDetails/getStepTimes.ts`:

```ts
import type { ReviewStep } from "~/review/domain/types.js";
import { formatReviewTime } from "../actionDialog/formatReviewTime.js";

const pad = (value: number): string => {
    return String(value).padStart(2, "0");
};

const isSameDay = (first: Date, second: Date): boolean => {
    return (
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate()
    );
};

/**
 * "Reached 6 Oct, 10:41 · started 11:05 · finished 11:20" (QBZ-54): the date once when start and
 * finish fall on the day of "reached". `null` for a step that was not reached. Pure.
 */
export const getStepTimes = (step: ReviewStep, now: Date): string | null => {
    if (step.reachedOn === null) {
        return null;
    }

    const reached = new Date(step.reachedOn);
    let text = `Reached ${formatReviewTime(step.reachedOn, now)}`;

    const later: Array<[string, string | null]> = [
        ["started", step.startedOn],
        ["finished", step.finishedOn]
    ];
    later.forEach(([label, iso]) => {
        if (iso === null) {
            return;
        }
        const date = new Date(iso);
        if (isSameDay(date, reached)) {
            const hours = pad(date.getHours());
            const minutes = pad(date.getMinutes());
            text += ` · ${label} ${hours}:${minutes}`;
            return;
        }
        text += ` · ${label} ${formatReviewTime(iso, now)}`;
    });

    return text;
};
```

Create `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import type { ReviewAssignmentEntry } from "~/review/domain/types.js";
import type { ReviewStep } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { formatReviewTime } from "../actionDialog/formatReviewTime.js";
import { getRejectionText } from "../targetReview/getRejectionText.js";
import { getReviewActions } from "../targetReview/getReviewActions.js";
import { getReviewStateTag } from "../targetReview/getReviewStateTag.js";
import { getStepOwnerLabel } from "../targetReview/getStepOwnerLabel.js";
import { getStepStateTag } from "../targetReview/getStepStateTag.js";
import { getStepTypeLabel } from "../requestReview/getStepTypeLabel.js";
import type { ReviewDetailsHeaderVm } from "./abstractions.js";
import type { ReviewDetailsSkippedVm } from "./abstractions.js";
import type { ReviewDetailsStepVm } from "./abstractions.js";
import type { TargetReviewOpenAction } from "../targetReview/abstractions.js";
import { getRevisionNumber } from "./getRevisionNumber.js";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";
import { getStepTimes } from "./getStepTimes.js";
import { getStepTimesTitle } from "./getStepTimesTitle.js";
import { getWhyOwner } from "./getWhyOwner.js";
import type { ReviewDetailsPresenter } from "./abstractions.js";

export interface ReviewDetailsViewModelInput {
    status: "loading" | "failed" | "loaded";
    review: ReviewWithFlags | null;
    error: string | null;
    openAction: TargetReviewOpenAction | null;
    now: Date;
}

const getComment = (step: ReviewStep): string | null => {
    const comment = step.comment ? step.comment.trim() : "";
    if (comment !== "") {
        return `${getStepOwnerLabel(step)}: “${comment}”`;
    }
    if (step.state === StepState.Rejected) {
        return getRejectionText(step);
    }
    return null;
};

/**
 * The lead of a skipped entry while the server could not resolve a name (`userDisplayName` is
 * `null` or blank, R251). A raw user id is never shown.
 */
export const SKIPPED_PERSON_LABEL = "A person";

const getSkippedName = (entry: ReviewAssignmentEntry): string => {
    if (entry.userDisplayName === null) {
        return SKIPPED_PERSON_LABEL;
    }
    const name = entry.userDisplayName.trim();
    if (name === "") {
        return SKIPPED_PERSON_LABEL;
    }
    return name;
};

const getCancelledText = (review: Review, now: Date): string => {
    let who = "Someone";
    if (review.cancelledBy !== null) {
        const name = review.cancelledBy.displayName.trim();
        if (name !== "") {
            who = name;
        }
    }
    const time = formatReviewTime(review.lastChangedOn, now);
    return `${who} cancelled this review at ${time}. The revision has no review now; a new request starts again from the first step.`;
};

const getSkipped = (step: ReviewStep): ReviewDetailsSkippedVm[] | null => {
    if (step.assignments === null) {
        return null;
    }
    const skipped = step.assignments
        .filter(entry => entry.kind === "skip")
        .map(entry => {
            return {
                name: getSkippedName(entry),
                reason: entry.reason ? entry.reason : ""
            };
        });
    if (skipped.length === 0) {
        return null;
    }
    return skipped;
};

const getStepVm = (step: ReviewStep, now: Date): ReviewDetailsStepVm => {
    const tag = getStepStateTag(step.state);
    const reached = step.state !== StepState.Pending;
    return {
        stepId: step.id,
        title: step.title,
        color: step.color,
        typeLabel: getStepTypeLabel(step.type),
        state: step.state,
        stateLabel: tag.label,
        stateVariant: tag.variant,
        ownerLine: reached ? getStepOwnerLabel(step) : null,
        whyOwner: getWhyOwner(step),
        times: getStepTimes(step, now),
        timesTitle: getStepTimesTitle(step),
        comment: getComment(step),
        skipped: getSkipped(step)
    };
};

const STATE_LABELS: Record<string, string> = {
    [ReviewState.InProgress]: "In progress",
    [ReviewState.Approved]: "Approved",
    [ReviewState.Rejected]: "Rejected",
    [ReviewState.Cancelled]: "Cancelled"
};

/**
 * The render-ready view model of the drawer (R234). Pure. `now` is a parameter so times are
 * deterministic. A cancelled review keeps its header and loses timeline and actions (QBZ-1).
 */
export const buildReviewDetailsViewModel = (
    input: ReviewDetailsViewModelInput
): ReviewDetailsPresenter.ViewModel => {
    const { status, review: withFlags, error, openAction, now } = input;

    if (status !== "loaded" || withFlags === null) {
        return {
            status,
            header: null,
            steps: [],
            cancelledText: null,
            actions: [],
            error,
            openAction,
            reviewId: null
        };
    }

    const review = withFlags.review;
    const cancelled = review.state === ReviewState.Cancelled;
    const stateTag = getReviewStateTag(review.state);
    const stateVariant = stateTag ? stateTag.variant : "neutral-base-outline";
    const revision = getRevisionNumber(review.targetRevisionId);
    let contentLine = `Content: ${review.targetContext.title}`;
    if (revision !== "") {
        contentLine = `${contentLine} (#${revision})`;
    }

    const header: ReviewDetailsHeaderVm = {
        title: review.title,
        stateLabel: STATE_LABELS[review.state] ?? review.state,
        stateVariant,
        contentLine,
        requesterLine: `Requester: ${review.createdBy.displayName}`,
        requestedLine: `Requested: ${formatReviewTime(review.createdOn, now)}`,
        requestedTitle: formatReviewTimeFull(review.createdOn)
    };

    if (cancelled) {
        return {
            status,
            header,
            steps: [],
            cancelledText: getCancelledText(review, now),
            actions: [],
            error: null,
            openAction,
            reviewId: review.id
        };
    }

    return {
        status,
        header,
        steps: review.steps.map(step => getStepVm(step, now)),
        cancelledText: null,
        actions: getReviewActions({
            flags: withFlags.flags,
            stepId: review.currentStepId,
            canRequest: false
        }),
        error: null,
        openAction,
        reviewId: review.id
    };
};
```

Create `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import { classifyReviewActionError } from "../actionDialog/classifyReviewActionError.js";
import type { TargetReviewActionKind } from "../targetReview/abstractions.js";
import type { TargetReviewOpenAction } from "../targetReview/abstractions.js";
import { ReviewDetailsPresenter as Abstraction } from "./abstractions.js";
import type { ReviewDetailsInitParams } from "./abstractions.js";
import { buildReviewDetailsViewModel } from "./buildReviewDetailsViewModel.js";

const GENERIC_ERROR = "The server did not respond. Try again in a moment.";

class ReviewDetailsPresenterImpl implements Abstraction.Interface {
    private params: ReviewDetailsInitParams | null = null;
    private review: ReviewWithFlags | null = null;
    private status: "loading" | "failed" | "loaded" = "loading";
    private error: string | null = null;
    private action: TargetReviewOpenAction | null = null;
    private token = 0;

    constructor(private activity: ReviewActivity.Interface) {
        makeAutoObservable<
            ReviewDetailsPresenterImpl,
            "activity" | "token" | "params" | "review"
        >(this, {
            activity: false,
            token: false,
            params: observableRef,
            review: observableRef
        });
    }

    get vm(): Abstraction.ViewModel {
        return buildReviewDetailsViewModel({
            status: this.status,
            review: this.review,
            error: this.error,
            openAction: this.action,
            now: new Date()
        });
    }

    async init(params: ReviewDetailsInitParams): Promise<void> {
        this.begin(params);
        await this.refresh();
    }

    async refresh(): Promise<void> {
        const params = this.params;
        if (!params) {
            return;
        }

        const token = this.nextToken();

        try {
            const loaded = await params.useCases.getReview(params.reviewId);
            if (token !== this.token) {
                return;
            }
            this.applyLoaded(loaded);
        } catch (error) {
            if (token !== this.token) {
                return;
            }
            this.applyFailure(error);
        }
    }

    openAction(kind: TargetReviewActionKind, stepId: string | null): void {
        this.action = { kind, stepId };
    }

    closeAction(): void {
        this.action = null;
    }

    async actionDone(): Promise<void> {
        const params = this.params;
        if (!params) {
            return;
        }

        // Read before the refresh: a failed refresh clears the review, and the lists still need
        // the signal because the action itself succeeded.
        const namespace = this.review ? this.review.review.namespace : null;

        this.closeAction();
        await this.refresh();

        if (namespace !== null) {
            this.activity.notify({ namespace, source: "own" });
        }
        if (params.onChanged) {
            params.onChanged();
        }
    }

    dispose(): void {
        this.token += 1;
        this.params = null;
        this.review = null;
        this.status = "loading";
        this.error = null;
        this.action = null;
    }

    private begin(params: ReviewDetailsInitParams): void {
        this.token += 1;
        this.params = params;
        this.review = null;
        this.status = "loading";
        this.error = null;
        this.action = null;
    }

    private nextToken(): number {
        this.token += 1;
        return this.token;
    }

    private applyLoaded(loaded: ReviewWithFlags): void {
        this.review = loaded;
        this.status = "loaded";
        this.error = null;
    }

    private applyFailure(error: unknown): void {
        this.review = null;
        this.status = "failed";
        this.error = GENERIC_ERROR;
        if (classifyReviewActionError(error) === "notAuthorized") {
            this.error = NO_ACCESS_MESSAGE;
        }
    }
}

export const ReviewDetailsPresenter = Abstraction.createImplementation({
    implementation: ReviewDetailsPresenterImpl,
    dependencies: [ReviewActivity]
});
```

`ReviewErrorCode` is imported by neither path in the final file (the classification lives in `classifyReviewActionError`); remove the unused import `ReviewErrorCode` if the linter reports it.

Create `packages/app-workflows/src/review/presentation/reviewDetails/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ReviewDetailsPresenter as Abstraction } from "./abstractions.js";
import { ReviewDetailsPresenter } from "./ReviewDetailsPresenter.js";

export const ReviewDetailsPresenterFeature = createFeature({
    name: "Workflows/ReviewDetailsPresenter",
    register(container) {
        // Transient (R212): the editor drawer and the list drawer are independent instances.
        container.register(ReviewDetailsPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
```

Create `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Drawer } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { ReviewActionDialogs } from "../../actionDialog/components/ReviewActionDialogs.js";
import { toActionRequest } from "../../actionDialog/toActionRequest.js";
import { REVIEW_ACTION_ICONS } from "../../targetReview/components/reviewBarAppearance.js";
import { ReviewDetailsPresenterFeature } from "../feature.js";
import type { ReviewDetailsPresenter } from "../abstractions.js";

export interface ReviewDetailsDrawerProps {
    useCases: IReviewUseCases;
    reviewId: string;
    reviewsUrl: string | null;
    onClose: () => void;
    onChanged?: () => void;
}

interface ReviewDetailsDrawerViewProps {
    presenter: ReviewDetailsPresenter.Interface;
    useCases: IReviewUseCases;
    reviewsUrl: string | null;
    onClose: () => void;
}

const ReviewDetailsDrawerView = createReactiveComponent(function ReviewDetailsDrawerView(
    props: ReviewDetailsDrawerViewProps
) {
    const { presenter, useCases, reviewsUrl, onClose } = props;
    const { vm } = presenter;
    const request = toActionRequest(vm.openAction, vm.reviewId);

    const footer = vm.actions.map(action => {
        const ActionIcon = REVIEW_ACTION_ICONS[action.icon];
        return (
            <Button
                key={action.kind}
                variant={action.emphasis}
                size={"md"}
                text={action.label}
                icon={<ActionIcon />}
                onClick={() => presenter.openAction(action.kind, action.stepId)}
            />
        );
    });

    return (
        <>
            <Drawer
                open={true}
                size={"lg"}
                title={"Review details"}
                onClose={onClose}
                actions={vm.actions.length > 0 ? <>{footer}</> : undefined}
            >
                <div className={"flex flex-col gap-md p-md"}>
                    {vm.status === "loading" ? (
                        <div className={"flex flex-col gap-md"}>
                            <Text size={"lg"} className={"font-semibold"}>
                                {"Loading review…"}
                            </Text>
                            <Skeleton type={"text"} size={"xl"} />
                            <Skeleton type={"text"} size={"xl"} />
                            <Skeleton type={"text"} size={"xl"} />
                        </div>
                    ) : null}
                    {vm.status === "failed" ? (
                        <div className={"flex flex-col items-center gap-sm text-center"}>
                            <Text size={"lg"} className={"font-semibold"}>
                                {"Could not load review details"}
                            </Text>
                            <Text size={"md"}>{vm.error}</Text>
                            <Button
                                variant={"tertiary"}
                                text={"Try again"}
                                onClick={() => presenter.refresh()}
                            />
                        </div>
                    ) : null}
                    {vm.header ? (
                        <div className={"flex flex-col gap-xs"}>
                            <div className={"flex flex-wrap items-center gap-sm"}>
                                <Text size={"lg"} className={"font-semibold"}>
                                    {vm.header.title}
                                </Text>
                                <Tag variant={vm.header.stateVariant} content={vm.header.stateLabel} />
                            </div>
                            <div className={"flex flex-wrap gap-x-md gap-y-xs text-sm text-neutral-strong"}>
                                <span>{vm.header.contentLine}</span>
                                <span>{vm.header.requesterLine}</span>
                                <span title={vm.header.requestedTitle}>{vm.header.requestedLine}</span>
                            </div>
                        </div>
                    ) : null}
                    {vm.cancelledText ? (
                        <Alert type={"info"} variant={"subtle"}>
                            <div className={"font-semibold"}>{"This review was cancelled"}</div>
                            <div>{vm.cancelledText}</div>
                        </Alert>
                    ) : null}
                    {vm.steps.map(step => (
                        <div key={step.stepId} className={"flex flex-col gap-sm border-b-sm border-neutral-dimmed pb-md"}>
                            <div className={"flex flex-wrap items-center gap-sm"}>
                                <span
                                    className={"h-[8px] w-[8px] rounded-full"}
                                    style={{ backgroundColor: step.color }}
                                />
                                <Text size={"md"} className={"font-semibold"}>
                                    {step.title}
                                </Text>
                                <Tag variant={"neutral-base-outline"} content={step.typeLabel} />
                                <Tag variant={step.stateVariant} content={step.stateLabel} />
                            </div>
                            {step.ownerLine ? (
                                <div className={"grid grid-cols-[120px_1fr] gap-x-md gap-y-xs text-sm"}>
                                    <span className={"text-neutral-muted"}>{"Owner"}</span>
                                    <span>{step.ownerLine}</span>
                                    {step.whyOwner ? (
                                        <>
                                            <span className={"text-neutral-muted"}>{"Why this owner"}</span>
                                            <span>{step.whyOwner}</span>
                                        </>
                                    ) : null}
                                    {step.times ? (
                                        <>
                                            <span className={"text-neutral-muted"}>{"Times"}</span>
                                            <span title={step.timesTitle ?? undefined}>{step.times}</span>
                                        </>
                                    ) : null}
                                </div>
                            ) : null}
                            {step.comment ? (
                                <div className={"rounded-md bg-neutral-light p-sm text-sm"}>{step.comment}</div>
                            ) : null}
                            {step.skipped ? (
                                <div className={"rounded-md border-sm border-dashed border-neutral-muted p-sm text-sm"}>
                                    <div className={"text-xs font-semibold uppercase text-neutral-muted"}>
                                        {"Skipped by assignment"}
                                    </div>
                                    {step.skipped.map(item => (
                                        <div key={`${item.name}:${item.reason}`}>
                                            <b className={"font-medium"}>{item.name}</b>
                                            {`: ${item.reason}`}
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            </Drawer>
            <ReviewActionDialogs
                useCases={useCases}
                request={request}
                reviewsUrl={reviewsUrl}
                onDone={() => presenter.actionDone()}
                onClose={() => presenter.closeAction()}
            />
        </>
    );
});

/** One presenter per mounted drawer (transient, R212): init on mount, dispose on unmount. */
export const ReviewDetailsDrawer = (props: ReviewDetailsDrawerProps) => {
    const { useCases, reviewId, reviewsUrl, onClose, onChanged } = props;
    const { presenter } = useFeature(ReviewDetailsPresenterFeature);

    useEffect(() => {
        presenter.init({ useCases, reviewId, reviewsUrl, onClose, onChanged });
        return () => presenter.dispose();
    }, [presenter, reviewId]);

    return (
        <ReviewDetailsDrawerView
            presenter={presenter}
            useCases={useCases}
            reviewsUrl={reviewsUrl}
            onClose={onClose}
        />
    );
};
```

Modify `app.tsx` (import and registration after `RequestReviewPresenterFeature`):

```tsx
import { ReviewDetailsPresenterFeature } from "~/review/presentation/reviewDetails/feature.js";
```

```tsx
            <RegisterFeature feature={RequestReviewPresenterFeature} />
            <RegisterFeature feature={ReviewDetailsPresenterFeature} />
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass, no TypeScript errors (R-e: `yarn build -p @webiny/app-workflows` is the type check).

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
git commit -m "feat(app-workflows): add the review details drawer" -m "The drawer loads a review by id and shows the header, a timeline with all six step states, owner, why this owner, times, comments and the skipped-by-assignment box as received. Footer actions come from the server flags and open the shared action dialogs. runs, issues and taskId are not rendered." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Skipped box per step, not per review:** the assignment log is per step and the design shows the box inside the step (the contract's Interfaces entry already says so); `skipped` is on `ReviewDetailsStepVm`.
- **Cancelled text keeps the design's second sentence:** R252 gives the lead ("{Name} cancelled this review at {time}."); the sentence "The revision has no review now; a new request starts again from the first step." stays from the design.
- **Content line without the content type or an "Open content" link:** the shared drawer knows no app; `Content: {title} (#{revision})` omits the design's type name ("Article · ") and the cancelled state has no "Open content" button. Both need the app's content adapter (R224); a later task can pass the adapter's label and URL as optional props.
- **No-access** reuses the shared QBZ-59 sentence for the failed state (the drawer has no separate no-access frame in the design).
- **Hover times (QBZ-54):** `title` attributes on the requested line and the Times line; the other times in the drawer have none.
- **Additive VM fields:** header `stateVariant`; step `color`, `stateVariant`, `timesTitle`; root `cancelledText`, `reviewId`; presenter `actionDone()` (used by the drawer component).
- Size: large (six pure files, a presenter, a component, three test files).
