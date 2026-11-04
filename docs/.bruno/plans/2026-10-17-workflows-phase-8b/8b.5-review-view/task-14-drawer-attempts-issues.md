### Task 14: Details drawer: live refresh, attempts and AI issues

R258, R259, R260, R261, R263, R264; D82, D90; design README 7, `research-spec.md` 4c (drawer: AI issues block, Attempts block); Review Focus 5. The drawer follows the activity bus like the bar (R260), shows the running state, the failure reason, the attempts of an AI or automation step (oldest first, the current attempt last, R261) and the issues the AI reported (R264 copy), and tells the view who may open an attempt's background task (the link itself lands in Task 15). `ReviewDetailsPresenter` gains `IdentityContext` and reads the client permission set (R259) to set `showTaskLink`.

- **Copy** (verbatim, R261, R264, `research-spec.md` 4c):
  - Section headings: `Attempts`, `Issues reported by the AI`.
  - Attempt row text: `#{n} {start}–{end} {Outcome} {reason}`; while running `#{n} since {start} Running`. The separator is an en dash, times are `formatTimeOfDay` (24-hour, viewer timezone). Outcomes `Approved`, `Rejected`, `Failed`, `Running`; an outcome the client does not know is shown as is. A blank or missing reason is left out (no trailing space).
  - Issue: severity label `Error`, `Warning`, `Info` (any other value shown as is); field cell the issue's field path, or `Whole content` without one; suggestion cell `Suggestion: {suggestion}`, or `—` without one; the message as received.
  - The failed reason (the step comment) is shown in its own box in a failed step; the step tag reads `Running` with the `progress_activity` icon for a running step (Task 12's tag, now with its icon in the drawer).
- **Attempts (R261):**
  - Only AI and automation steps (`step.type` is `ai` or `automation`) list attempts. Every `runs[]` record comes first, numbered from 1, then the current attempt as the last row when the step has a `startedOn` and a state that has an outcome: `inReview` (running, time span `since {start}`, outcome `Running`), `approved`, `rejected` or `failed` (reason = `comment`). An `awaiting` or `pending` step has no current row.
  - A run record without an end time reads `since {start}`; one without an outcome reads `Running` (a stuck record is shown as running; the server's stuck-step service ends it).
  - `taskId` of a row is the run's or the step's `taskId`; `showTaskLink` is true when the viewer is an operator (`editor` or `reassign`, R258) and the row has a `taskId`.
- **Comment of a failed step:** the reason moves out of the generic comment box (`{Owner}: “…”`, which would repeat the step title) into `failedReason`; `comment` is `null` for a failed step.
- **Subscription (R260):** the drawer knows its review id, not its namespace, until the first load: it subscribes with `[review.namespace]` after the first successful load (a failed first load does not subscribe; Try again subscribes after it succeeds). It refreshes on a signal whose `reviewId` equals its review's id, queues one more refresh for signals during a load, ignores the signal of its own `actionDone` (a per-instance `notifying` flag around the synchronous `notify`), and drops the subscription on `dispose` and on a later `init`.
- **Task 15 follows** with `openStepRun`, `closeStepRun` and the panel; this task does not render the `Background task` link.

**Files:**
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/getAttempts.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/getAiIssues.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/getAttempts.test.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/getAiIssues.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/abstractions.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.tsx`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx`
- Modify: `packages/app-workflows/src/review/editor/components/EditorReviewBar.test.tsx`

(`feature.ts` of the drawer is unchanged: the presenter's dependencies are declared in its own `createImplementation`; `WorkflowsAdminApp` already registers `IdentityContext` through the admin, and `app.test.tsx` registers a fake one.)

**Interfaces:**
- Consumes: Task 10 (`createWorkflowsIdentityContext({ teams?, permissions? })` from `~/review/testing/createWorkflowsIdentityContext.js`, the one shared test identity; `getWorkflowsPermissionSet(identity: Identity): WorkflowsPermissionSet` from `~/review/domain/getWorkflowsPermissionSet.js`, `WorkflowsPermissionSet { fullAccess; editor; reassign }`, `ReviewActivitySignal` with `reviewId` and `targetRevisionId`), Task 11 (`isStepRunning`), Task 12 (`REVIEW_TAG_ICONS`, the running-aware `getStepStateTag(state, running)`), Task 13 (`createFakeActivity` from `~/review/testing/fakeReviewActivity.js`), 8a (`formatTimeOfDay`, `getStepTypeLabel`, the builders in `~/review/testing/`). Existing (verified with codegraph): `Identity.createAuthenticated`, `IdentityContext` token (`@webiny/app-admin/features/security/IdentityContext/abstractions.js`), admin-ui `Tag` (`icon`), `Button`.
- Produces: `ReviewAttemptVm { number: number; text: string; taskId: string | null; showTaskLink: boolean }`, `ReviewAiIssueVm { severityLabel: string; severityVariant: TargetReviewTagVariant; field: string; message: string; suggestion: string }`, `ReviewDetailsStepVm.{running, failedReason, attempts, issues}`, `getAttempts(step, canViewStepRun)`, `getAiIssues(step)`, `buildReviewDetailsViewModel` input `canViewStepRun: boolean`.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/review/presentation/reviewDetails/getAttempts.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getAttempts } from "./getAttempts.js";
import { StepState } from "~/review/domain/StepState.js";
import type { ReviewStep } from "~/review/domain/types.js";
import type { ReviewStepRun } from "~/review/domain/types.js";
import { at } from "~/review/testing/at.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFailedAutomationStep } from "~/review/testing/createAutomatedStep.js";
import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";
import { createStep } from "~/review/testing/createStep.js";

const run = (overrides: Partial<ReviewStepRun> = {}): ReviewStepRun => {
    return {
        taskId: "task-1",
        startedOn: at(9, 0),
        finishedOn: at(9, 5),
        outcome: "failed",
        reason: "Webhook returned 503",
        ...overrides
    };
};

// The AI step "AI tone check", failed 10:00-10:05 with its task and reason.
const aiStep = (overrides: Partial<ReviewStep> = {}): ReviewStep => {
    return createRunningAiStep({
        state: StepState.Failed,
        startedOn: at(10, 0),
        finishedOn: at(10, 5),
        comment: "Provider unavailable: request timed out after 60 s",
        taskId: "task-2",
        ...overrides
    });
};

describe("getAttempts (R261)", () => {
    it("lists the runs oldest first and then the current attempt as the last row", () => {
        const step = aiStep({ runs: [run()] });

        expect(getAttempts(step, false)).toEqual([
            {
                number: 1,
                text: "#1 09:00–09:05 Failed Webhook returned 503",
                taskId: "task-1",
                showTaskLink: false
            },
            {
                number: 2,
                text: "#2 10:00–10:05 Failed Provider unavailable: request timed out after 60 s",
                taskId: "task-2",
                showTaskLink: false
            }
        ]);
    });

    it("numbers several runs in the order received", () => {
        const step = aiStep({
            runs: [
                run({ taskId: "task-a", startedOn: at(8, 0), finishedOn: at(8, 1) }),
                run({ taskId: "task-b", startedOn: at(9, 0), finishedOn: at(9, 1) })
            ]
        });

        const attempts = getAttempts(step, false);

        expect(attempts.map(attempt => attempt.number)).toEqual([1, 2, 3]);
        expect(attempts.map(attempt => attempt.taskId)).toEqual(["task-a", "task-b", "task-2"]);
    });

    it("shows the task link only to an operator and only for a row with a task id", () => {
        const step = aiStep({
            runs: [run({ taskId: null }), run({ taskId: "task-1" })]
        });

        expect(getAttempts(step, true).map(attempt => attempt.showTaskLink)).toEqual([
            false,
            true,
            true
        ]);
        expect(getAttempts(step, false).map(attempt => attempt.showTaskLink)).toEqual([
            false,
            false,
            false
        ]);
    });

    it("reads a running current attempt as 'since {start}' and 'Running'", () => {
        const step = aiStep({
            state: StepState.InReview,
            startedOn: at(14, 20),
            finishedOn: null,
            comment: null
        });

        expect(getAttempts(step, false)).toEqual([
            { number: 1, text: "#1 since 14:20 Running", taskId: "task-2", showTaskLink: false }
        ]);
    });

    it("ignores a stale end time while the step is running", () => {
        const step = aiStep({
            state: StepState.InReview,
            startedOn: at(14, 20),
            finishedOn: at(14, 25)
        });

        expect(getAttempts(step, false)[0].text).toBe("#1 since 14:20 Running");
    });

    it("reads an approved or rejected current attempt with its outcome and no reason", () => {
        const approved = aiStep({ state: StepState.Approved, comment: "Looks fine." });
        const rejected = aiStep({ state: StepState.Rejected, comment: "Too casual." });

        expect(getAttempts(approved, false)[0].text).toBe("#1 10:00–10:05 Approved");
        expect(getAttempts(rejected, false)[0].text).toBe("#1 10:00–10:05 Rejected");
    });

    it("works for an automation step", () => {
        const step = createFailedAutomationStep({
            startedOn: at(11, 0),
            finishedOn: at(11, 2)
        });

        expect(getAttempts(step, false)[0].text).toBe(
            "#1 11:00–11:02 Failed Webhook returned 503 Service Unavailable"
        );
    });

    it("has no current row for a step that has not started or is awaiting or pending", () => {
        const notStarted = aiStep({
            state: StepState.Awaiting,
            owner: null,
            startedOn: null,
            finishedOn: null,
            comment: null,
            runs: [run()]
        });
        const pending = aiStep({ state: StepState.Pending, owner: null, runs: [run()] });

        expect(getAttempts(notStarted, false)).toHaveLength(1);
        expect(getAttempts(pending, false)).toHaveLength(1);
    });

    it("lists nothing for a step a person reviews", () => {
        const person = createStep({
            type: "review",
            state: StepState.Approved,
            owner: createActor({ id: "user-2", displayName: "Luka Perić" }),
            startedOn: at(10, 0),
            finishedOn: at(10, 5),
            runs: [run()]
        });

        expect(getAttempts(person, true)).toEqual([]);
    });

    it("reads a run without an end time as running and a run without an outcome as 'Running'", () => {
        const step = aiStep({
            state: StepState.Awaiting,
            owner: null,
            startedOn: null,
            runs: [run({ finishedOn: null, outcome: null, reason: null })]
        });

        expect(getAttempts(step, false)[0].text).toBe("#1 since 09:00 Running");
    });

    it("shows an outcome it does not know as received", () => {
        const step = aiStep({
            state: StepState.Awaiting,
            owner: null,
            startedOn: null,
            runs: [run({ outcome: "timedOut", reason: null })]
        });

        expect(getAttempts(step, false)[0].text).toBe("#1 09:00–09:05 timedOut");
    });

    it("trims the reason and leaves a blank reason out", () => {
        const step = aiStep({
            runs: [run({ reason: "  Webhook returned 503  " }), run({ reason: "   " })],
            comment: null
        });

        const texts = getAttempts(step, false).map(attempt => attempt.text);

        expect(texts).toEqual([
            "#1 09:00–09:05 Failed Webhook returned 503",
            "#2 09:00–09:05 Failed",
            "#3 10:00–10:05 Failed"
        ]);
    });

    it("leaves out the time span of an unparsable start", () => {
        const step = aiStep({
            state: StepState.Awaiting,
            owner: null,
            startedOn: null,
            runs: [run({ startedOn: "not a date" })]
        });

        expect(getAttempts(step, false)[0].text).toBe("#1 Failed Webhook returned 503");
    });
});
```

Create `packages/app-workflows/src/review/presentation/reviewDetails/getAiIssues.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getAiIssues } from "./getAiIssues.js";
import type { ReviewAiIssue } from "~/review/domain/types.js";
import { createStep } from "~/review/testing/createStep.js";

const issue = (overrides: Partial<ReviewAiIssue> = {}): ReviewAiIssue => {
    return {
        fieldPath: "body",
        severity: "error",
        message: "Tone is too casual.",
        suggestion: "Use a formal greeting.",
        ...overrides
    };
};

describe("getAiIssues (R264)", () => {
    it("shows the severity label, the field, the message and the suggestion line", () => {
        const step = createStep({ issues: [issue()] });

        expect(getAiIssues(step)).toEqual([
            {
                severityLabel: "Error",
                severityVariant: "neutral-base-outline",
                field: "body",
                message: "Tone is too casual.",
                suggestion: "Suggestion: Use a formal greeting."
            }
        ]);
    });

    it("labels the three severities and shows any other value as is", () => {
        const step = createStep({
            issues: [
                issue({ severity: "error" }),
                issue({ severity: "warning" }),
                issue({ severity: "info" }),
                issue({ severity: "critical" })
            ]
        });

        expect(getAiIssues(step).map(item => item.severityLabel)).toEqual([
            "Error",
            "Warning",
            "Info",
            "critical"
        ]);
    });

    it("gives a warning the warning tag and every other severity the neutral one", () => {
        const step = createStep({
            issues: [
                issue({ severity: "warning" }),
                issue({ severity: "error" }),
                issue({ severity: "info" }),
                issue({ severity: "critical" })
            ]
        });

        expect(getAiIssues(step).map(item => item.severityVariant)).toEqual([
            "warning",
            "neutral-base-outline",
            "neutral-base-outline",
            "neutral-base-outline"
        ]);
    });

    it("says 'Whole content' for an issue without a field", () => {
        const step = createStep({
            issues: [issue({ fieldPath: null }), issue({ fieldPath: "  " })]
        });

        expect(getAiIssues(step).map(item => item.field)).toEqual([
            "Whole content",
            "Whole content"
        ]);
    });

    it("says '—' for an issue without a suggestion", () => {
        const step = createStep({
            issues: [issue({ suggestion: null }), issue({ suggestion: "" })]
        });

        expect(getAiIssues(step).map(item => item.suggestion)).toEqual(["—", "—"]);
    });

    it("keeps the order and returns nothing for a step without issues", () => {
        const step = createStep({
            issues: [issue({ message: "First." }), issue({ message: "Second." })]
        });

        expect(getAiIssues(step).map(item => item.message)).toEqual(["First.", "Second."]);
        expect(getAiIssues(createStep())).toEqual([]);
    });
});
```

Modify `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts`. Replace the `build` helper

```ts
    const build = (review = createReview(), flags = createFlags()) => {
        return buildReviewDetailsViewModel({
            status: "loaded",
            review: createReviewWithFlags(review, flags),
            error: null,
            openAction: null,
            now: NOW
        });
    };
```

with

```ts
    const build = (review = createReview(), flags = createFlags(), canViewStepRun = false) => {
        return buildReviewDetailsViewModel({
            status: "loaded",
            review: createReviewWithFlags(review, flags),
            error: null,
            openAction: null,
            canViewStepRun,
            now: NOW
        });
    };
```

In the test `builds the loading and failed states without a header` add `canViewStepRun: false,` after `openAction: null,` in both literal calls:

```ts
        const loading = buildReviewDetailsViewModel({
            status: "loading",
            review: null,
            error: null,
            openAction: null,
            canViewStepRun: false,
            now: NOW
        });
        const failed = buildReviewDetailsViewModel({
            status: "failed",
            review: null,
            error: "The server did not respond. Try again in a moment.",
            openAction: null,
            canViewStepRun: false,
            now: NOW
        });
```

Replace the whole test `never carries runs, issues or the task id (R203)` (8a: the drawer showed none of them; it runs from its `it(` line to just before `it("gives every time a full date, time and timezone on hover (QBZ-54)"`) with:

```ts
    it("carries the attempts, the issues and the failure reason of an AI step (R261, R264)", () => {
        const review = createReview({
            steps: [
                createStep({
                    title: "AI tone check",
                    type: "ai",
                    state: StepState.Failed,
                    owner: createActor({ type: "ai", displayName: "model" }),
                    reachedOn: at(16, 9, 0),
                    startedOn: at(16, 10, 0),
                    finishedOn: at(16, 10, 5),
                    comment: "Provider unavailable: request timed out after 60 s",
                    taskId: "task-2",
                    runs: [
                        {
                            taskId: "task-1",
                            startedOn: at(16, 9, 0),
                            finishedOn: at(16, 9, 5),
                            outcome: "failed",
                            reason: "Webhook returned 503"
                        }
                    ],
                    issues: [
                        {
                            fieldPath: "title",
                            severity: "warning",
                            message: "Title is long.",
                            suggestion: null
                        }
                    ]
                })
            ]
        });

        const { steps } = build(review, createFlags(), true);

        expect(steps[0].running).toBe(false);
        expect(steps[0].failedReason).toBe("Provider unavailable: request timed out after 60 s");
        expect(steps[0].comment).toBeNull();
        expect(steps[0].attempts).toEqual([
            {
                number: 1,
                text: "#1 09:00–09:05 Failed Webhook returned 503",
                taskId: "task-1",
                showTaskLink: true
            },
            {
                number: 2,
                text: "#2 10:00–10:05 Failed Provider unavailable: request timed out after 60 s",
                taskId: "task-2",
                showTaskLink: true
            }
        ]);
        expect(steps[0].issues).toEqual([
            {
                severityLabel: "Warning",
                severityVariant: "warning",
                field: "title",
                message: "Title is long.",
                suggestion: "—"
            }
        ]);
    });

    it("hides the task link from a viewer who is not an operator (R258)", () => {
        const review = createReview({
            steps: [
                createStep({
                    type: "automation",
                    state: StepState.Failed,
                    owner: createActor({ type: "automation", displayName: "Send webhook" }),
                    startedOn: at(16, 10, 0),
                    finishedOn: at(16, 10, 5),
                    taskId: "task-2"
                })
            ]
        });

        const viewer = build(review, createFlags(), false).steps[0].attempts;
        const operator = build(review, createFlags(), true).steps[0].attempts;

        expect(viewer.map(attempt => attempt.showTaskLink)).toEqual([false]);
        expect(operator.map(attempt => attempt.showTaskLink)).toEqual([true]);
    });

    it("marks a running step and shows its attempt as running", () => {
        const review = createReview({
            steps: [
                createStep({
                    type: "ai",
                    state: StepState.InReview,
                    owner: createActor({ type: "ai", displayName: "model" }),
                    reachedOn: at(16, 14, 19),
                    startedOn: at(16, 14, 20)
                }),
                createStep({
                    id: "step-2",
                    state: StepState.InReview,
                    owner: LUKA,
                    reachedOn: at(16, 14, 19),
                    startedOn: at(16, 14, 20)
                })
            ]
        });

        const { steps } = build(review);

        expect(steps.map(step => step.running)).toEqual([true, false]);
        expect(steps[0].stateLabel).toBe("Running");
        expect(steps[0].attempts[0].text).toBe("#1 since 14:20 Running");
        expect(steps[1].attempts).toEqual([]);
        expect(steps[1].failedReason).toBeNull();
    });

    it("has no failure reason for a failed step without a comment, and keeps other comments", () => {
        const review = createReview({
            steps: [
                createStep({
                    id: "a",
                    type: "ai",
                    state: StepState.Failed,
                    owner: createActor({ type: "ai", displayName: "model" }),
                    comment: "   "
                }),
                createStep({
                    id: "b",
                    state: StepState.Approved,
                    owner: LUKA,
                    comment: "Looks fine."
                })
            ]
        });

        const { steps } = build(review);

        expect(steps[0].failedReason).toBeNull();
        expect(steps[0].comment).toBeNull();
        expect(steps[1].failedReason).toBeNull();
        expect(steps[1].comment).toBe("Luka Perić: “Looks fine.”");
    });

    it("never puts the task id of a step without a link into the text of a row", () => {
        const review = createReview({
            steps: [
                createStep({
                    type: "ai",
                    state: StepState.Failed,
                    owner: createActor({ type: "ai", displayName: "model" }),
                    startedOn: at(16, 10, 0),
                    finishedOn: at(16, 10, 5),
                    taskId: "task-secret-1"
                })
            ]
        });

        const { steps } = build(review);

        expect(steps[0].attempts[0].text).not.toContain("task-secret-1");
    });
```

Modify `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts`. Add the imports after `import { ReviewActivity } from "~/review/activity/abstractions.js";`:

```ts
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { IPermission } from "@webiny/app-admin/domain/Identity.js";
```

and after `import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";`:

```ts
import { createFakeActivity } from "~/review/testing/fakeReviewActivity.js";
import type { FakeReviewActivity } from "~/review/testing/fakeReviewActivity.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";
import { at } from "~/review/testing/at.js";
import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";
import { StepState } from "~/review/domain/StepState.js";
```

Add a deferred helper above `interface Setup {`:

```ts
interface Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
}

const createDeferred = <T>(): Deferred<T> => {
    let resolve: (value: T) => void = () => undefined;
    let reject: (error: Error) => void = () => undefined;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};
```

Replace

```ts
    activity: { subscribe: ReturnType<typeof vi.fn>; notify: ReturnType<typeof vi.fn> };
```

with

```ts
    activity: FakeReviewActivity;
```

and replace

```ts
const createSetup = (): Setup => {
    const container = new Container();
    const activity = { subscribe: vi.fn(), notify: vi.fn() };
    container.registerInstance(ReviewActivity, activity);
    ReviewDetailsPresenterFeature.register(container);
```

with

```ts
const createSetup = (permissions: IPermission[] = []): Setup => {
    const container = new Container();
    const activity = createFakeActivity();
    container.registerInstance(ReviewActivity, activity);
    container.registerInstance(IdentityContext, createWorkflowsIdentityContext({ permissions }));
    ReviewDetailsPresenterFeature.register(container);
```

Existing tests of the same file that change:

- `is transient` builds its own container. Replace

```ts
        container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
        ReviewDetailsPresenterFeature.register(container);
```

with

```ts
        container.registerInstance(ReviewActivity, createFakeActivity());
        container.registerInstance(IdentityContext, createWorkflowsIdentityContext());
        ReviewDetailsPresenterFeature.register(container);
```

- One refetch per action (R260): the drawer's own signal refreshes the bar, so `actionDone` no longer calls `onChanged` (it stays for the conflict path, which sends no signal). In `refreshes, signals the activity bus and tells the host after an action` and in `signals the activity bus and the host even when the refresh after an action fails` replace each `expect(setup.onChanged).toHaveBeenCalledTimes(1);` with `expect(setup.onChanged).not.toHaveBeenCalled();`, and rename the tests to `refreshes and signals the activity bus after an action` and `signals the activity bus even when the refresh after an action fails`.

Append at the end of the file:

```ts
describe("ReviewDetailsPresenter live refresh (R260)", () => {
    const flush = async (): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 0));
    };

    const signalFor = (overrides = {}): ReviewActivity.Signal => {
        return {
            namespace: "cms.article",
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0001",
            ...overrides
        };
    };

    it("subscribes with the namespace of the loaded review, after the first load", async () => {
        const setup = createSetup();
        const first = createDeferred<ReturnType<typeof createReviewWithFlags>>();
        setup.useCases.getReview.mockReturnValue(first.promise);

        const pending = setup.presenter.init(setup.params());
        expect(setup.activity.listenerCount()).toBe(0);
        first.resolve(createReviewWithFlags(createReview(), createFlags()));
        await pending;

        expect(setup.activity.subscribe).toHaveBeenCalledTimes(1);
        expect(setup.activity.subscribe.mock.calls[0][0]).toEqual(["cms.article"]);
        expect(setup.activity.listenerCount()).toBe(1);
    });

    it("does not subscribe after a failed first load and subscribes once a retry succeeds", async () => {
        const setup = createSetup();
        setup.useCases.getReview.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.init(setup.params());
        expect(setup.activity.listenerCount()).toBe(0);

        await setup.presenter.refresh();
        await setup.presenter.refresh();

        expect(setup.activity.subscribe).toHaveBeenCalledTimes(1);
        expect(setup.activity.listenerCount()).toBe(1);
    });

    it("refreshes once for a signal of its own review", async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());
        expect(setup.useCases.getReview).toHaveBeenCalledTimes(1);

        setup.activity.notify(signalFor());
        await vi.waitFor(() => expect(setup.useCases.getReview).toHaveBeenCalledTimes(2));
        await flush();

        expect(setup.useCases.getReview).toHaveBeenCalledTimes(2);
    });

    it("ignores a signal of another review and of another namespace", async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());

        setup.activity.notify(signalFor({ reviewId: "review-9" }));
        setup.activity.notify(signalFor({ reviewId: null }));
        setup.activity.notify(signalFor({ namespace: "wb.page" }));
        await flush();

        expect(setup.useCases.getReview).toHaveBeenCalledTimes(1);
    });

    it("queues exactly one more refresh for the signals that arrive during a load", async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());
        const next = createDeferred<ReturnType<typeof createReviewWithFlags>>();
        setup.useCases.getReview.mockReturnValueOnce(next.promise);
        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(setup.useCases.getReview).toHaveBeenCalledTimes(2));

        setup.activity.notify(signalFor());
        setup.activity.notify(signalFor());
        setup.activity.notify(signalFor());
        expect(setup.useCases.getReview).toHaveBeenCalledTimes(2);

        next.resolve(createReviewWithFlags(createReview(), createFlags()));
        await pending;
        await flush();

        expect(setup.useCases.getReview).toHaveBeenCalledTimes(3);
    });

    it("drops the queued refresh when the load fails", async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());
        const next = createDeferred<ReturnType<typeof createReviewWithFlags>>();
        setup.useCases.getReview.mockReturnValueOnce(next.promise);
        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(setup.useCases.getReview).toHaveBeenCalledTimes(2));
        setup.activity.notify(signalFor());

        next.reject(new Error("Network."));
        await pending;
        await flush();

        expect(setup.useCases.getReview).toHaveBeenCalledTimes(2);
        expect(setup.presenter.vm.status).toBe("failed");
    });

    it("refreshes once for its own actionDone: its own signal is ignored", async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());

        await setup.presenter.actionDone();
        await flush();

        expect(setup.useCases.getReview).toHaveBeenCalledTimes(2);
        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "own",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0001"
        });
    });

    it("reacts to a signal again after its own action", async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());
        await setup.presenter.actionDone();
        await flush();
        const afterAction = setup.useCases.getReview.mock.calls.length;

        setup.activity.notify(signalFor());

        await vi.waitFor(() =>
            expect(setup.useCases.getReview).toHaveBeenCalledTimes(afterAction + 1)
        );
    });

    it("drops the previous subscription on a second init and on dispose", async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());
        await setup.presenter.init(setup.params());

        expect(setup.activity.subscribe).toHaveBeenCalledTimes(2);
        expect(setup.activity.listenerCount()).toBe(1);

        setup.presenter.dispose();
        expect(setup.activity.listenerCount()).toBe(0);
        setup.activity.notify(signalFor());
        await flush();
        expect(setup.useCases.getReview).toHaveBeenCalledTimes(2);
    });
});

describe("ReviewDetailsPresenter task link (R258, R259)", () => {
    const failedAiReview = () => {
        return createReviewWithFlags(
            createReview({
                steps: [
                    createRunningAiStep({
                        state: StepState.Failed,
                        finishedOn: at(14, 25),
                        taskId: "task-2"
                    })
                ]
            }),
            createFlags()
        );
    };

    const linkFor = async (permissions: IPermission[]): Promise<boolean> => {
        const setup = createSetup(permissions);
        setup.useCases.getReview.mockResolvedValue(failedAiReview());
        await setup.presenter.init(setup.params());
        return setup.presenter.vm.steps[0].attempts[0].showTaskLink;
    };

    it("is shown to a viewer with the workflows editor permission", async () => {
        expect(await linkFor([{ name: "workflows", editor: true }])).toBe(true);
    });

    it("is shown to a viewer with the workflows reassign permission", async () => {
        expect(await linkFor([{ name: "workflows", reassign: true }])).toBe(true);
    });

    it("is shown to a viewer with workflows full access", async () => {
        expect(await linkFor([{ name: "workflows.*" }])).toBe(true);
    });

    it("is shown when one of several roles grants the permission", async () => {
        const permissions = [{ name: "workflows" }, { name: "workflows", reassign: true }];

        expect(await linkFor(permissions)).toBe(true);
    });

    it("is hidden from a viewer without either permission", async () => {
        expect(await linkFor([])).toBe(false);
        expect(await linkFor([{ name: "workflows" }])).toBe(false);
        expect(await linkFor([{ name: "cms.contentEntry", own: true }])).toBe(false);
    });
});
```

Modify `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx`. Add the imports after `import { ReviewToasts } from "~/review/toasts/abstractions.js";`:

```tsx
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { IPermission } from "@webiny/app-admin/domain/Identity.js";
```

and after `import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";`:

```tsx
import { createFakeActivity } from "~/review/testing/fakeReviewActivity.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";
import { at } from "~/review/testing/at.js";
import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";
```

Replace

```tsx
const createContainer = () => {
    const container = new Container();
    container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
    container.registerInstance(ReviewToasts, { show: vi.fn() });
```

with

```tsx
const createContainer = (permissions: IPermission[] = []) => {
    const container = new Container();
    container.registerInstance(ReviewActivity, createFakeActivity());
    container.registerInstance(IdentityContext, createWorkflowsIdentityContext({ permissions }));
    container.registerInstance(ReviewToasts, { show: vi.fn() });
```

Replace the whole test `does not render runs, issues or the task id (R203)` (from its `it(` line to just before `it("shows the full time on hover through the title attribute (QBZ-54)"`) with:

```tsx
    it("never renders a task id as text", async () => {
        const useCases = createUseCases();
        const loaded = await useCases.getReview("review-1");
        const step = loaded.review.steps[0];
        step.type = "ai";
        step.owner = createActor({ type: "ai", displayName: "model" });
        step.startedOn = at(10, 0);
        step.finishedOn = at(10, 5);
        step.taskId = "task-secret-1";
        step.runs = [
            {
                taskId: "task-secret-0",
                startedOn: at(9, 0),
                finishedOn: at(9, 5),
                outcome: "failed",
                reason: "Webhook returned 503"
            }
        ];
        useCases.getReview.mockResolvedValue(loaded);
        renderDrawer(useCases);

        await screen.findByText("Spring campaign review");

        expect(screen.getByText("#1 09:00–09:05 Failed Webhook returned 503")).toBeTruthy();
        expect(document.body.textContent).not.toContain("task-secret");
    });
```

Append at the end of the file:

```tsx
const createAiUseCases = (stepOverrides = {}) => {
    const useCases = createFakeUseCases();
    const review = createReview({
        title: "Spring campaign review",
        currentStepId: "s1",
        steps: [
            createRunningAiStep({
                id: "s1",
                state: StepState.Failed,
                reachedOn: at(9, 0),
                startedOn: at(10, 0),
                finishedOn: at(10, 5),
                comment: "Provider unavailable: request timed out after 60 s",
                taskId: "task-2",
                runs: [
                    {
                        taskId: "task-1",
                        startedOn: at(9, 0),
                        finishedOn: at(9, 5),
                        outcome: "failed",
                        reason: "Webhook returned 503"
                    }
                ],
                issues: [
                    {
                        fieldPath: "body",
                        severity: "error",
                        message: "Tone is too casual.",
                        suggestion: "Use a formal greeting."
                    },
                    {
                        fieldPath: null,
                        severity: "warning",
                        message: "Title is long.",
                        suggestion: null
                    }
                ],
                ...stepOverrides
            })
        ]
    });
    useCases.getReview.mockResolvedValue(createReviewWithFlags(review, createFlags()));
    return useCases;
};

describe("ReviewDetailsDrawer, AI and automation steps (R261, R264)", () => {
    it("shows the attempts oldest first with the current attempt last", async () => {
        renderDrawer(createAiUseCases());

        expect(await screen.findByText("Attempts")).toBeTruthy();
        expect(screen.getByText("#1 09:00–09:05 Failed Webhook returned 503")).toBeTruthy();
        expect(
            screen.getByText(
                "#2 10:00–10:05 Failed Provider unavailable: request timed out after 60 s"
            )
        ).toBeTruthy();
    });

    it("shows the failure reason of a failed step in its own box", async () => {
        renderDrawer(createAiUseCases());

        await screen.findByText("Attempts");

        expect(
            screen.getByText("Provider unavailable: request timed out after 60 s")
        ).toBeTruthy();
        expect(screen.queryByText(/AI tone check: “/)).toBeNull();
    });

    it("shows the issues the AI reported with severity, field, message and suggestion", async () => {
        renderDrawer(createAiUseCases());

        expect(await screen.findByText("Issues reported by the AI")).toBeTruthy();
        expect(screen.getByText("Error")).toBeTruthy();
        expect(screen.getByText("body")).toBeTruthy();
        expect(screen.getByText("Tone is too casual.")).toBeTruthy();
        expect(screen.getByText("Suggestion: Use a formal greeting.")).toBeTruthy();
        expect(screen.getByText("Warning")).toBeTruthy();
        expect(screen.getByText("Whole content")).toBeTruthy();
        expect(screen.getByText("Title is long.")).toBeTruthy();
        expect(screen.getByText("—")).toBeTruthy();
    });

    it("shows a running step with the Running tag, its icon and the running attempt", async () => {
        renderDrawer(
            createAiUseCases({
                state: StepState.InReview,
                finishedOn: null,
                comment: null,
                runs: [],
                issues: []
            })
        );

        const tag = await screen.findByText("Running");

        expect(tag.parentElement?.querySelector("[data-testid='svg-icon']")).not.toBeNull();
        expect(screen.getByText("#1 since 10:00 Running")).toBeTruthy();
        expect(screen.queryByText("Issues reported by the AI")).toBeNull();
    });

    it("shows no attempts and no issues for a step a person reviews", async () => {
        renderDrawer();
        await screen.findByText("Spring campaign review");

        expect(screen.queryByText("Attempts")).toBeNull();
        expect(screen.queryByText("Issues reported by the AI")).toBeNull();
    });
});
```

Modify `packages/app-workflows/src/review/editor/components/EditorReviewBar.test.tsx`. Add the imports after `import { ReviewToasts } from "~/review/toasts/abstractions.js";`:

```tsx
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
```

and after `import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";`:

```tsx
import { createFakeActivity } from "~/review/testing/fakeReviewActivity.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";
```

and in `createContainer` replace

```tsx
    container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
```

with

```tsx
    container.registerInstance(ReviewActivity, createFakeActivity());
    container.registerInstance(IdentityContext, createWorkflowsIdentityContext());
```

In the same file replace the test

```tsx
    it("refreshes the bar's presenter when an action inside the drawer changed the review", async () => {
        const { session, presenter } = createSession();
        renderBar(session);
        fireEvent.click(screen.getByText("Review details"));
        await screen.findByText("Spring campaign review");

        fireEvent.click(await screen.findByText("Approve", { selector: "button *, button" }));
        await screen.findByText("Approve “Legal sign-off”");
        fireEvent.click(screen.getAllByText("Approve", { selector: "button *, button" }).pop()!);

        await vi.waitFor(() => expect(presenter.refresh).toHaveBeenCalledTimes(1));
    });
```

with these two (add `import { GraphQLOperationError } from "@webiny/app/errors/index.js";` and `import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";` to the imports):

```tsx
    it("leaves the bar's refresh to the activity signal after an action inside the drawer (R260)", async () => {
        const { session, presenter, useCases } = createSession();
        renderBar(session);
        fireEvent.click(screen.getByText("Review details"));
        await screen.findByText("Spring campaign review");

        fireEvent.click(await screen.findByText("Approve", { selector: "button *, button" }));
        await screen.findByText("Approve “Legal sign-off”");
        fireEvent.click(screen.getAllByText("Approve", { selector: "button *, button" }).pop()!);

        await vi.waitFor(() => expect(useCases.approveStep).toHaveBeenCalledTimes(1));
        expect(presenter.refresh).not.toHaveBeenCalled();
    });

    it("refreshes the bar's presenter when an action inside the drawer hit a conflict", async () => {
        const { session, presenter, useCases } = createSession();
        useCases.approveStep.mockRejectedValue(
            new GraphQLOperationError({
                message: "Conflict.",
                code: ReviewErrorCode.StepNotCurrent
            })
        );
        renderBar(session);
        fireEvent.click(screen.getByText("Review details"));
        await screen.findByText("Spring campaign review");

        fireEvent.click(await screen.findByText("Approve", { selector: "button *, button" }));
        await screen.findByText("Approve “Legal sign-off”");
        fireEvent.click(screen.getAllByText("Approve", { selector: "button *, button" }).pop()!);

        expect(await screen.findByText("Someone else acted first")).toBeTruthy();
        await vi.waitFor(() => expect(presenter.refresh).toHaveBeenCalled());
    });
```


- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewDetails/getAttempts.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewDetails/getAiIssues.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/review/editor/components/EditorReviewBar.test.tsx 2>&1 | tail -30
```

Expected: `getAttempts.test.ts` and `getAiIssues.test.ts` fail with `Failed to resolve import` for the missing modules. `buildReviewDetailsViewModel.test.ts` fails (no `attempts`, `issues`, `running`, `failedReason` on the step view models). `ReviewDetailsPresenter.test.ts` fails (no subscription, `vm.steps[0].attempts` is `undefined`). `ReviewDetailsDrawer.test.tsx` fails on the new sections. `EditorReviewBar.test.tsx` still passes. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/review/presentation/reviewDetails/getAttempts.ts`:

```ts
import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import { formatTimeOfDay } from "../time/formatTimeOfDay.js";
import type { ReviewAttemptVm } from "./abstractions.js";

interface AttemptRow {
    number: number;
    startedOn: string;
    finishedOn: string | null;
    // The outcome of the attempt, `null` while it is running.
    outcome: string | null;
    reason: string | null;
    taskId: string | null;
    canViewStepRun: boolean;
}

// Only AI and automation steps have attempts (D82); a people step has one decision, not runs.
const AUTOMATED_STEP_TYPES: string[] = ["ai", "automation"];

const formatClock = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    return formatTimeOfDay(date);
};

// "10:00–10:05", or "since 10:00" while the attempt has no end (R261).
const getSpan = (startedOn: string, finishedOn: string | null): string => {
    const started = formatClock(startedOn);
    if (started === "") {
        return "";
    }
    if (finishedOn !== null) {
        const finished = formatClock(finishedOn);
        if (finished !== "") {
            return `${started}–${finished}`;
        }
    }
    return `since ${started}`;
};

const getOutcomeLabel = (outcome: string | null): string => {
    switch (outcome) {
        case null:
            return "Running";
        case "approved":
            return "Approved";
        case "rejected":
            return "Rejected";
        case "failed":
            return "Failed";
        default:
            return outcome;
    }
};

const toAttempt = (row: AttemptRow): ReviewAttemptVm => {
    const span = getSpan(row.startedOn, row.finishedOn);
    const parts = [`#${row.number}`, span, getOutcomeLabel(row.outcome)];
    if (row.reason !== null && row.reason.trim() !== "") {
        parts.push(row.reason.trim());
    }
    const text = parts.filter(part => part !== "").join(" ");

    return {
        number: row.number,
        text,
        taskId: row.taskId,
        showTaskLink: row.canViewStepRun && row.taskId !== null
    };
};

const getCurrentOutcome = (step: ReviewStep): string | null => {
    switch (step.state) {
        case StepState.Approved:
            return "approved";
        case StepState.Rejected:
            return "rejected";
        case StepState.Failed:
            return "failed";
        default:
            return null;
    }
};

/*
 * The attempts of an AI or automation step, oldest first (R261): every `runs[]` record, then the
 * current attempt as the last row when the step has started and is running or has an outcome.
 * `canViewStepRun` is the operator rule (R258): the task link shows only with it and only for a
 * row with a task id. A people step lists nothing. Pure.
 */
export const getAttempts = (step: ReviewStep, canViewStepRun: boolean): ReviewAttemptVm[] => {
    if (!AUTOMATED_STEP_TYPES.includes(step.type)) {
        return [];
    }

    const attempts = step.runs.map((run, index) => {
        return toAttempt({
            number: index + 1,
            startedOn: run.startedOn,
            finishedOn: run.finishedOn,
            outcome: run.outcome,
            reason: run.reason,
            taskId: run.taskId,
            canViewStepRun
        });
    });

    const running = step.state === StepState.InReview;
    const hasOutcome = getCurrentOutcome(step) !== null;
    if (step.startedOn === null || (!running && !hasOutcome)) {
        return attempts;
    }

    let finishedOn: string | null = null;
    if (!running) {
        finishedOn = step.finishedOn;
    }
    let reason: string | null = null;
    if (step.state === StepState.Failed) {
        reason = step.comment;
    }
    const current = toAttempt({
        number: step.runs.length + 1,
        startedOn: step.startedOn,
        finishedOn,
        outcome: getCurrentOutcome(step),
        reason,
        taskId: step.taskId,
        canViewStepRun
    });
    attempts.push(current);
    return attempts;
};
```

Create `packages/app-workflows/src/review/presentation/reviewDetails/getAiIssues.ts`:

```ts
import type { ReviewAiIssue } from "~/review/domain/types.js";
import type { ReviewStep } from "~/review/domain/types.js";
import type { TargetReviewTagVariant } from "../targetReview/abstractions.js";
import type { ReviewAiIssueVm } from "./abstractions.js";

const WHOLE_CONTENT = "Whole content";
const NO_SUGGESTION = "—";

const getSeverityLabel = (severity: string): string => {
    switch (severity) {
        case "error":
            return "Error";
        case "warning":
            return "Warning";
        case "info":
            return "Info";
        default:
            return severity;
    }
};

const getSeverityVariant = (severity: string): TargetReviewTagVariant => {
    if (severity === "warning") {
        return "warning";
    }
    return "neutral-base-outline";
};

const toIssueVm = (issue: ReviewAiIssue): ReviewAiIssueVm => {
    let field = WHOLE_CONTENT;
    if (issue.fieldPath !== null && issue.fieldPath.trim() !== "") {
        field = issue.fieldPath;
    }
    let suggestion = NO_SUGGESTION;
    if (issue.suggestion !== null && issue.suggestion !== "") {
        suggestion = `Suggestion: ${issue.suggestion}`;
    }

    return {
        severityLabel: getSeverityLabel(issue.severity),
        severityVariant: getSeverityVariant(issue.severity),
        field,
        message: issue.message,
        suggestion
    };
};

// The issues an AI step reported, in the design's table cells (R264). Pure.
export const getAiIssues = (step: ReviewStep): ReviewAiIssueVm[] => {
    return step.issues.map(toIssueVm);
};
```

Modify `packages/app-workflows/src/review/presentation/reviewDetails/abstractions.ts`. In `ReviewDetailsInitParams` replace

```ts
    // Called after an action in the drawer changed the review (the editor refreshes its bar).
    onChanged?: () => void;
```

with

```ts
    // Called after a conflict made the drawer refresh (the editor refreshes its bar). An action
    // that succeeded reaches the bar through the activity signal (R260), not through this.
    onChanged?: () => void;
```

Then replace

```ts
export interface ReviewDetailsStepVm {
```

with

```ts
// One attempt of an AI or automation step (R261): the row text and the task the row can open.
export interface ReviewAttemptVm {
    number: number;
    // "#{n} {start}–{end} {Outcome} {reason}", or "#{n} since {start} Running".
    text: string;
    taskId: string | null;
    // True for an operator (workflows editor or reassign) on a row with a task id (R258).
    showTaskLink: boolean;
}

// One issue an AI step reported, as the cells of the design's table (R264).
export interface ReviewAiIssueVm {
    severityLabel: string;
    // The tag treatment of the severity: a warning is the warning tag, every other one neutral.
    severityVariant: TargetReviewTagVariant;
    field: string;
    message: string;
    suggestion: string;
}

export interface ReviewDetailsStepVm {
```

and in `ReviewDetailsStepVm` replace

```ts
    comment: string | null;
    skipped: ReviewDetailsSkippedVm[] | null;
}
```

with

```ts
    comment: string | null;
    skipped: ReviewDetailsSkippedVm[] | null;
    // An AI or automation step is running (R263): the tag reads Running with its icon.
    running: boolean;
    // The reason a failed step failed (its comment); `null` for any other step or without one.
    failedReason: string | null;
    attempts: ReviewAttemptVm[];
    issues: ReviewAiIssueVm[];
}
```

Modify `buildReviewDetailsViewModel.ts`. Add imports after `import { getStepOwnerLabel } from "../targetReview/getStepOwnerLabel.js";`:

```ts
import { getAiIssues } from "./getAiIssues.js";
import { getAttempts } from "./getAttempts.js";
```

Add to `ReviewDetailsViewModelInput` after `openAction: TargetReviewOpenAction | null;`:

```ts
    // The viewer may open the background task of an attempt: workflows editor or reassign (R258).
    canViewStepRun: boolean;
```

Replace `getComment`'s head

```ts
const getComment = (step: ReviewStep): string | null => {
    const comment = step.comment ? step.comment.trim() : "";
```

with

```ts
// The reason of a failed step has its own field and box (`failedReason`), not a quoted comment.
const getComment = (step: ReviewStep): string | null => {
    if (step.state === StepState.Failed) {
        return null;
    }
    const comment = step.comment ? step.comment.trim() : "";
```

Add before `const getStepVm`:

```ts
const getFailedReason = (step: ReviewStep): string | null => {
    if (step.state !== StepState.Failed) {
        return null;
    }
    const reason = step.comment ? step.comment.trim() : "";
    if (reason === "") {
        return null;
    }
    return reason;
};

```

Replace

```ts
const getStepVm = (step: ReviewStep, now: Date): ReviewDetailsStepVm => {
    const tag = getStepStateTag(step.state, isStepRunning(step));
```

with

```ts
const getStepVm = (
    step: ReviewStep,
    now: Date,
    canViewStepRun: boolean
): ReviewDetailsStepVm => {
    const running = isStepRunning(step);
    const tag = getStepStateTag(step.state, running);
```

and the end of the returned object

```ts
        comment: getComment(step),
        skipped: getSkipped(step)
    };
};
```

with

```ts
        comment: getComment(step),
        skipped: getSkipped(step),
        running,
        failedReason: getFailedReason(step),
        attempts: getAttempts(step, canViewStepRun),
        issues: getAiIssues(step)
    };
};
```

In `buildReviewDetailsViewModel` replace `const { status, review: withFlags, error, openAction, now } = input;` with

```ts
    const { status, review: withFlags, error, openAction, canViewStepRun, now } = input;
```

and `steps: review.steps.map(step => getStepVm(step, now)),` with

```ts
        steps: review.steps.map(step => getStepVm(step, now, canViewStepRun)),
```

Replace the whole file `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { getWorkflowsPermissionSet } from "~/review/domain/getWorkflowsPermissionSet.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { classifyReviewActionError } from "../actionDialog/classifyReviewActionError.js";
import { getActionErrorMessage } from "../actionDialog/getActionErrorMessage.js";
import type { TargetReviewActionKind } from "../targetReview/abstractions.js";
import type { TargetReviewOpenAction } from "../targetReview/abstractions.js";
import { ReviewDetailsPresenter as Abstraction } from "./abstractions.js";
import type { ReviewDetailsInitParams } from "./abstractions.js";
import type { ReviewDetailsStatus } from "./abstractions.js";
import { buildReviewDetailsViewModel } from "./buildReviewDetailsViewModel.js";

const LOAD_FAILED_MESSAGE = "The server did not respond. Try again in a moment.";

class ReviewDetailsPresenterImpl implements Abstraction.Interface {
    private params: ReviewDetailsInitParams | null = null;
    private review: ReviewWithFlags | null = null;
    private status: ReviewDetailsStatus = "loading";
    private error: string | null = null;
    private action: TargetReviewOpenAction | null = null;
    private token = 0;
    // A load is on the wire (R260).
    private inFlight = false;
    // A signal arrived during a load: one more refresh runs when that load settles (R260).
    private refreshQueued = false;
    // True while the presenter is inside its own `activity.notify` call (R260).
    private notifying = false;
    private unsubscribe: (() => void) | null = null;

    constructor(
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            ReviewDetailsPresenterImpl,
            | "activity"
            | "identityContext"
            | "token"
            | "inFlight"
            | "refreshQueued"
            | "notifying"
            | "unsubscribe"
            | "params"
            | "review"
        >(this, {
            activity: false,
            identityContext: false,
            token: false,
            inFlight: false,
            refreshQueued: false,
            notifying: false,
            unsubscribe: false,
            params: observableRef,
            review: observableRef
        });
    }

    get vm(): Abstraction.ViewModel {
        const identity = this.identityContext.getIdentity();
        const permissions = getWorkflowsPermissionSet(identity);
        return buildReviewDetailsViewModel({
            status: this.status,
            review: this.review,
            error: this.error,
            openAction: this.action,
            canViewStepRun: permissions.editor || permissions.reassign,
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
        this.inFlight = true;

        try {
            const loaded = await params.useCases.getReview(params.reviewId);
            if (token !== this.token) {
                return;
            }
            this.applyLoaded(loaded);
            if (this.unsubscribe === null) {
                // The namespace is only known once the review is loaded.
                this.unsubscribe = this.activity.subscribe([loaded.review.namespace], signal => {
                    this.handleSignal(signal);
                });
            }
        } catch (error) {
            if (token !== this.token) {
                return;
            }
            this.applyFailure(error);
            return;
        }

        this.inFlight = false;
        if (this.refreshQueued) {
            this.refreshQueued = false;
            await this.refresh();
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
        let namespace: string | null = null;
        let targetRevisionId: string | null = null;
        if (this.review) {
            namespace = this.review.review.namespace;
            targetRevisionId = this.review.review.targetRevisionId;
        }

        this.closeAction();
        await this.refresh();

        if (namespace !== null) {
            this.notifying = true;
            try {
                this.activity.notify({
                    namespace,
                    source: "own",
                    reviewId: params.reviewId,
                    targetRevisionId
                });
            } finally {
                this.notifying = false;
            }
        }
    }

    dispose(): void {
        this.token += 1;
        this.dropSubscription();
        this.inFlight = false;
        this.refreshQueued = false;
        this.params = null;
        this.review = null;
        this.status = "loading";
        this.error = null;
        this.action = null;
    }

    private begin(params: ReviewDetailsInitParams): void {
        this.token += 1;
        this.dropSubscription();
        this.inFlight = false;
        this.refreshQueued = false;
        this.params = params;
        this.review = null;
        this.status = "loading";
        this.error = null;
        this.action = null;
    }

    private dropSubscription(): void {
        if (this.unsubscribe !== null) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    /*
     * A signal of this review refreshes it once (R260). Its own signal is ignored (the own action
     * refreshes itself), and a signal during a load queues one more refresh.
     */
    private handleSignal(signal: ReviewActivity.Signal): void {
        const params = this.params;
        if (!params || this.notifying) {
            return;
        }
        if (signal.reviewId !== params.reviewId) {
            return;
        }
        if (this.inFlight) {
            this.refreshQueued = true;
            return;
        }
        void this.refresh();
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
        this.inFlight = false;
        this.refreshQueued = false;
        this.review = null;
        this.status = "failed";
        const errorKind = classifyReviewActionError(error);
        this.error = getActionErrorMessage(errorKind, error, LOAD_FAILED_MESSAGE);
    }
}

export const ReviewDetailsPresenter = Abstraction.createImplementation({
    implementation: ReviewDetailsPresenterImpl,
    dependencies: [ReviewActivity, IdentityContext]
});
```

Modify `components/ReviewDetailsDrawer.tsx`. Add the import after `import { REVIEW_ACTION_ICONS } from "../../targetReview/components/reviewBarAppearance.js";`:

```tsx
import { REVIEW_TAG_ICONS } from "../../targetReview/components/reviewBarAppearance.js";
```

and, above `export interface ReviewDetailsDrawerProps {`, add:

```tsx
const RunningIcon = REVIEW_TAG_ICONS.progress_activity;

```

Replace the step state tag

```tsx
                                <Tag variant={step.stateVariant} content={step.stateLabel} />
```

with

```tsx
                                <Tag
                                    variant={step.stateVariant}
                                    content={step.stateLabel}
                                    icon={step.running ? <RunningIcon /> : undefined}
                                />
```

and after the comment box

```tsx
                            {step.comment !== null && (
                                <div className={"rounded-md bg-neutral-light p-sm text-sm"}>
                                    {step.comment}
                                </div>
                            )}
```

insert

```tsx
                            {step.failedReason !== null && (
                                <div
                                    data-role={"failed-reason"}
                                    className={
                                        "rounded-md border-sm border-destructive-default p-sm text-sm"
                                    }
                                >
                                    {step.failedReason}
                                </div>
                            )}
                            {step.attempts.length > 0 && (
                                <div data-role={"attempts"} className={"flex flex-col gap-xs text-sm"}>
                                    <div
                                        className={
                                            "text-xs font-semibold uppercase text-neutral-muted"
                                        }
                                    >
                                        {"Attempts"}
                                    </div>
                                    {step.attempts.map(attempt => (
                                        <div
                                            key={attempt.number}
                                            className={"flex flex-wrap items-center gap-sm"}
                                        >
                                            <span>{attempt.text}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {step.issues.length > 0 && (
                                <div data-role={"issues"} className={"flex flex-col gap-xs text-sm"}>
                                    <div
                                        className={
                                            "text-xs font-semibold uppercase text-neutral-muted"
                                        }
                                    >
                                        {"Issues reported by the AI"}
                                    </div>
                                    {step.issues.map((issue, index) => (
                                        <div
                                            key={index}
                                            className={
                                                "flex flex-col gap-xs rounded-md border-sm border-neutral-dimmed p-sm"
                                            }
                                        >
                                            <div className={"flex flex-wrap items-center gap-sm"}>
                                                <Tag
                                                    variant={issue.severityVariant}
                                                    content={issue.severityLabel}
                                                />
                                                <span className={"font-medium"}>{issue.field}</span>
                                            </div>
                                            <div>{issue.message}</div>
                                            <div className={"text-neutral-strong"}>
                                                {issue.suggestion}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
```



- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewDetails/getAttempts.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewDetails/getAiIssues.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/review/editor/components/EditorReviewBar.test.tsx 2>&1 | tail -30
```

Expected: PASS. Notes to check on the first run: in the drawer test the severity tags `Error` and `Warning` and the field `body` must each match one element (the `Failed` tag and the reason box do not collide because their text differs); if `getByText("—")` matches more than one element on a future change, scope it with `within(document.querySelector("[data-role='issues']"))`. The existing 8a test `refreshes, signals the activity bus and tells the host after an action` asserts the `notify` payload Task 10 gave it; the presenter above sends the review id and the revision of the loaded review (`review-1`, `entry-1#0001`).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewDetails packages/app-workflows/src/review/presentation/reviewList packages/app-workflows/src/review/editor packages/app-workflows/src/app.test.tsx 2>&1 | tail -40
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors. `ReviewListView.test.tsx` stubs the drawer and is unaffected; `app.test.tsx` already registers a fake `IdentityContext`, so resolving `ReviewDetailsPresenter` works with its new dependency.

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
git commit -m "feat(app-workflows): show attempts and AI issues in the review details drawer" -m "The drawer follows the activity bus for its review (one refresh per signal, one queued during a load, its own action ignored), shows the running state and the failure reason, lists the attempts of an AI or automation step oldest first with the current attempt last, and lists the issues the AI reported. The attempt rows carry whether the viewer is an operator who may open the background task." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`ReviewAttemptVm.text` is the whole row** (`#{n} {span} {Outcome} {reason}`) because R261 gives the row text as one string and the contract's `ReviewAttemptVm` has `number` and `text`, not separate cells; `number` stays for the key. A run without an outcome reads `Running`, an unknown outcome is shown as is, a blank reason is left out (no copy covers these; no new string is invented).
- **Failed step comment:** the generic comment box would print `{Step title}: “reason”` (the owner label of an AI step is the step title) next to the attempts, so a failed step's reason moves to `failedReason` (shown in its own box) and `comment` is `null` for it. 8a's drawer already showed that quoted line for a failed step; this is an 8b change to that expectation (no existing test pinned it: the six-states test has a failed step without a comment).
- **Existing expectation changed:** 8a's `never carries runs, issues or the task id (R203)` tests (view model and component) are replaced; the drawer now shows runs, reasons and issues. The task id never appears as text in either test (it travels in `ReviewAttemptVm.taskId` for the link only).
- **Additive `ReviewAiIssueVm.severityVariant`** (render-ready, R234): `warning` for a warning, the neutral outline tag for every other severity (design 4c), computed in `getAiIssues`; the component compares no label. The design also colours the attempt outcome (Failed and Rejected destructive, Approved success, else primary); the contract's one-string `text` carries no colour, so it is dropped on purpose.
- **Subscription after the first load:** the contract has the drawer subscribe on `init`, but `ReviewDetailsInitParams` carries a review id and no namespace, and `ReviewActivity.subscribe` filters by namespace. The drawer subscribes after its first successful load with the review's namespace instead (a failed first load does not subscribe). The alternative, a `namespace` init parameter, would change both callers (`EditorReviewBar`, `ReviewListDialogs`).
- **One refetch per action (R260):** the drawer's done path no longer calls `onChanged`; the bar presenter hears of an action inside the drawer through the drawer's own activity signal (the bar subscribes to its review). `onChanged` stays for the conflict path (`handleConflict`), which sends no signal. The `ReviewDetailsInitParams.onChanged` comment and the two `EditorReviewBar` drawer tests change accordingly.
- **Shared test identity:** the tests use Task 10's `createWorkflowsIdentityContext({ permissions })`; this task creates no identity builder.
- Size: large (two pure files, the presenter rewritten, a view model, the drawer sections, three modified test files and two new ones).
