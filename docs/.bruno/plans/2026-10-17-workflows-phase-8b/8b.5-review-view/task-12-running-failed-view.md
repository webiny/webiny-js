### Task 12: Running and failed in the bar, tags, tooltips and popover

R202, R234, R238, R243, R263, R264; D107; spec 13.4; design README 6 (messages table, state tile), UI-13, `research-spec.md` 4c (bar, tags); Review Focus 5. A running step (`isStepRunning`, Task 11) and a failed step get their own message in the bar (`{Step} running since {hh:mm}` and `{Step} failed: {reason}`), their own step tag (`Running` with the `progress_activity` icon, `Failed` as 8a built it), their own tile (running: `progress_activity`; failed stays `sync_problem`), tag tooltips (R264 copy) and a message line per segment in the progress popover. The lock text stays. Everything is pure functions plus two small view changes; the bar component only renders what the view model says.

- **Copy** (verbatim, R263, R264, `research-spec.md` 4c):
  - Bar message, running: `{Step} running since {hh:mm}` (`{hh:mm}` = `formatTimeOfDay` of the step's `startedOn`; `{Step}` = the step title, D107).
  - Bar message, failed: `{Step} failed: {reason}` (`reason` = the step's `comment`, trimmed); without a reason `{Step} failed.`.
  - Step tag, running: label `Running`, icon `progress_activity`, variant `accent-light` (the In review treatment, README UI-13). Step tag, failed: label `Failed`, variant `destructive`, no tag icon (the 8a tag; the tile carries `sync_problem`).
  - Tooltips: running `{Step} is running since {hh:mm}.`; failed `{Step} failed. The requester or an operator can restart it.`
  - Lock text unchanged: `Editing, publishing and moving are locked while this revision is in review.`
  - The popover segment shows the message above as its text line (R263); a segment without a running or failed message keeps the quoted comment.
- **Fallback (no new copy):** a running step without a parsable `startedOn` has no "since" time to print, so it keeps the 8a message `{Step} is reviewing` (the owner label of an AI or automation step is the step title). The failed message needs no time.
- **Where the logic lives:** three tiny pure files (`getStepStartedAt`, `getStepRunMessage`, `getStepTagTooltip`) feed the bar message, the segments and the tag tooltip, so no rule is written twice. `getStepStateTag` takes an optional second argument `running` (the row tags of the lists pass nothing; a row does not know its step owner).
- **Drawer tag:** `buildReviewDetailsViewModel` calls `getStepStateTag`; it passes `isStepRunning(step)`, so the drawer tag label reads `Running` for a running step. Task 14 adds the icon and the rest of the drawer.
- **The `progress_activity` icon is not in `@webiny/icons`** (the package copies the older `@material-design-icons/svg` outlined set). Step 3 adds it as an extra icon (`packages/icons/src/extraIcons/`, copied to `dist` by the package build, the way `push_pin_off.svg` is). Tests stub every `@webiny/icons/*.svg` import (`__tests__/setup/svgStub.tsx`), so only the package build needs the file.

**Files:**
- Create: `packages/icons/src/extraIcons/progress_activity.svg`
- Create: `packages/app-workflows/src/review/testing/createAutomatedStep.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getStepStartedAt.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getStepRunMessage.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getStepTagTooltip.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewStepTag.tsx`
- Create: `packages/app-workflows/src/review/presentation/targetReview/runningFailedView.test.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewStepTag.test.tsx`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/abstractions.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/getStepStateTag.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/getReviewMessage.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/getReviewProgress.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/components/reviewBarAppearance.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.tsx`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewStepsPopover.tsx`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.ts`
- Modify: `packages/app-workflows/src/review/testing/targetReviewFakes.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/getReviewMessage.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/stepLabels.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts`

**Interfaces:**
- Consumes: Task 11 (`at(hour, minute)` from `~/review/testing/at.js`; `isStepRunning(step: ReviewStep): boolean` from `./isStepRunning.js`, R263: `step.state === StepState.InReview && step.owner !== null && step.owner.type !== "user"`), 8a (`getStepOwnerLabel`, `getDisplayStep`, `formatTimeOfDay` from `~/review/presentation/time/formatTimeOfDay.js`, the `createStep`, `createActor`, `createReview`, `createReviewWithFlags`, `createFlags` builders in `~/review/testing/`, `renderWithAdminUi`, `createFakePresenter`, `createViewModel`). Existing (verified with codegraph): admin-ui `Tag` (`variant`, `content`, `icon?: React.ReactElement | null`), `Tooltip` (`trigger`, `content`), `Popover`.
- Produces: `getStepStartedAt(step): string | null`, `getStepRunMessage(step): string | null`, `getStepTagTooltip(step): string | null`, `TargetReviewTagIcon`, `TargetReviewTag.icon?`, the tile `"progress_activity"`, `TargetReviewSegmentVm.{tag, message, tooltip}`, `ITargetReviewViewModel.stepStateTooltip`, `ReviewStepTag` (`{ tag: TargetReviewTag; tooltip: string | null }`), `REVIEW_TAG_ICONS` (Task 14 renders the drawer tag icon with it), and the shared pure test builders `AI_ACTOR`, `AUTOMATION_ACTOR`, `createRunningAiStep`, `createRunningAutomationStep`, `createFailedAutomationStep` (`~/review/testing/createAutomatedStep.js`), which Tasks 13, 14 and 15 import (together with `at(hour, minute)` from `~/review/testing/at.js`, created by Task 11).

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. Task 11 must be built first (`isStepRunning.ts` exists); if it is missing, stop.

- [ ] **Step 1: Write the failing tests**

`packages/app-workflows/src/review/testing/at.ts` (`at(hour, minute)`, 16 Oct 2026 in local time, the one clock of the view tests) is created by Task 11; this task imports it and creates no other clock.

Create `packages/app-workflows/src/review/testing/createAutomatedStep.ts` (pure builders of AI and automation steps, R243; the defaults are a step that started at 14:20):

```ts
import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import { at } from "./at.js";
import { createActor } from "./createActor.js";
import { createStep } from "./createStep.js";

export const AI_ACTOR = createActor({ type: "ai", id: "ai-1", displayName: "gpt-model-9" });

export const AUTOMATION_ACTOR = createActor({
    type: "automation",
    id: "auto-1",
    displayName: "Send webhook"
});

// An AI step "AI tone check" that is running since 14:20.
export const createRunningAiStep = (overrides: Partial<ReviewStep> = {}): ReviewStep => {
    return createStep({
        id: "step-1",
        title: "AI tone check",
        type: "ai",
        state: StepState.InReview,
        owner: AI_ACTOR,
        reachedOn: at(14, 19),
        startedOn: at(14, 20),
        ...overrides
    });
};

// An automation step "Notify web team" that is running since 14:20.
export const createRunningAutomationStep = (overrides: Partial<ReviewStep> = {}): ReviewStep => {
    return createStep({
        id: "step-1",
        title: "Notify web team",
        type: "automation",
        state: StepState.InReview,
        owner: AUTOMATION_ACTOR,
        reachedOn: at(14, 19),
        startedOn: at(14, 20),
        ...overrides
    });
};

// The automation step above, failed at 14:25 with its reason in the comment.
export const createFailedAutomationStep = (overrides: Partial<ReviewStep> = {}): ReviewStep => {
    return createRunningAutomationStep({
        state: StepState.Failed,
        finishedOn: at(14, 25),
        comment: "Webhook returned 503 Service Unavailable",
        ...overrides
    });
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/runningFailedView.test.ts` (the pure functions of this task):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getStepStartedAt } from "./getStepStartedAt.js";
import { getStepRunMessage } from "./getStepRunMessage.js";
import { getStepTagTooltip } from "./getStepTagTooltip.js";
import { getStepStateTag } from "./getStepStateTag.js";
import { getReviewProgress } from "./getReviewProgress.js";
import { StepState } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import { at } from "~/review/testing/at.js";
import { createFailedAutomationStep } from "~/review/testing/createAutomatedStep.js";
import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";
import { createRunningAutomationStep } from "~/review/testing/createAutomatedStep.js";

const LUKA = createActor({ id: "user-2", displayName: "Luka Perić" });

describe("getStepStartedAt", () => {
    it("formats the start of the attempt as hh:mm", () => {
        expect(getStepStartedAt(createRunningAiStep())).toBe("14:20");
    });

    it("is null without a start time", () => {
        expect(getStepStartedAt(createRunningAiStep({ startedOn: null }))).toBeNull();
    });

    it("is null for an unparsable start time", () => {
        expect(getStepStartedAt(createRunningAiStep({ startedOn: "not a date" }))).toBeNull();
    });
});

describe("getStepRunMessage (R263)", () => {
    it("reads '{Step} running since {hh:mm}' for a running AI step", () => {
        expect(getStepRunMessage(createRunningAiStep())).toBe("AI tone check running since 14:20");
    });

    it("reads the same for a running automation step", () => {
        const step = createRunningAutomationStep();
        expect(getStepRunMessage(step)).toBe("Notify web team running since 14:20");
    });

    it("is null for a running step without a usable start time", () => {
        expect(getStepRunMessage(createRunningAiStep({ startedOn: null }))).toBeNull();
        expect(getStepRunMessage(createRunningAiStep({ startedOn: "not a date" }))).toBeNull();
    });

    it("reads '{Step} failed: {reason}' for a failed step", () => {
        expect(getStepRunMessage(createFailedAutomationStep())).toBe(
            "Notify web team failed: Webhook returned 503 Service Unavailable"
        );
    });

    it("trims the reason", () => {
        expect(getStepRunMessage(createFailedAutomationStep({ comment: "  Provider unavailable.  " }))).toBe(
            "Notify web team failed: Provider unavailable."
        );
    });

    it("reads '{Step} failed.' for a failed step without a reason (R264)", () => {
        expect(getStepRunMessage(createFailedAutomationStep({ comment: null }))).toBe("Notify web team failed.");
        expect(getStepRunMessage(createFailedAutomationStep({ comment: "   " }))).toBe("Notify web team failed.");
    });

    it("is null for a step a person reviews, and for steps that are neither running nor failed", () => {
        const person = createStep({ state: StepState.InReview, owner: LUKA, startedOn: at(14, 20) });
        expect(getStepRunMessage(person)).toBeNull();
        expect(getStepRunMessage(createRunningAiStep({ state: StepState.Approved }))).toBeNull();
        expect(getStepRunMessage(createRunningAiStep({ state: StepState.Awaiting, owner: null }))).toBeNull();
        expect(getStepRunMessage(createRunningAiStep({ state: StepState.Pending, owner: null }))).toBeNull();
    });
});

describe("getStepTagTooltip (R264)", () => {
    it("explains a running step", () => {
        expect(getStepTagTooltip(createRunningAiStep())).toBe("AI tone check is running since 14:20.");
    });

    it("explains a failed step", () => {
        expect(getStepTagTooltip(createFailedAutomationStep())).toBe(
            "Notify web team failed. The requester or an operator can restart it."
        );
    });

    it("explains a failed step without a reason the same way", () => {
        expect(getStepTagTooltip(createFailedAutomationStep({ comment: null }))).toBe(
            "Notify web team failed. The requester or an operator can restart it."
        );
    });

    it("is null for every other step and for a running step without a start time", () => {
        const person = createStep({ state: StepState.InReview, owner: LUKA, startedOn: at(14, 20) });
        expect(getStepTagTooltip(person)).toBeNull();
        expect(getStepTagTooltip(createRunningAiStep({ state: StepState.Approved }))).toBeNull();
        expect(getStepTagTooltip(createRunningAiStep({ startedOn: null }))).toBeNull();
    });
});

describe("getStepStateTag with running (R263)", () => {
    it("is 'Running' with the progress_activity icon for a running in-review step", () => {
        expect(getStepStateTag(StepState.InReview, true)).toEqual({
            label: "Running",
            variant: "accent-light",
            icon: "progress_activity"
        });
    });

    it("keeps 'In review' without the icon for a step a person reviews", () => {
        expect(getStepStateTag(StepState.InReview, false)).toEqual({
            label: "In review",
            variant: "accent-light"
        });
        expect(getStepStateTag(StepState.InReview)).toEqual({
            label: "In review",
            variant: "accent-light"
        });
    });

    it("ignores running for every other state and keeps Failed as it was", () => {
        expect(getStepStateTag(StepState.Failed, true)).toEqual({
            label: "Failed",
            variant: "destructive"
        });
        expect(getStepStateTag(StepState.Approved, true)).toEqual({
            label: "Approved",
            variant: "success-light"
        });
    });
});

describe("getReviewProgress with running and failed steps", () => {
    it("gives each segment its tag, its run message and its tooltip", () => {
        const review = createReview({
            steps: [
                createRunningAiStep({ id: "a" }),
                createFailedAutomationStep({ id: "b" }),
                createStep({ id: "c", title: "Legal sign-off", state: StepState.Pending })
            ]
        });

        const { segments } = getReviewProgress(review);

        expect(segments[0].tag).toEqual({
            label: "Running",
            variant: "accent-light",
            icon: "progress_activity"
        });
        expect(segments[0].message).toBe("AI tone check running since 14:20");
        expect(segments[0].tooltip).toBe("AI tone check is running since 14:20.");
        expect(segments[1].tag).toEqual({ label: "Failed", variant: "destructive" });
        expect(segments[1].message).toBe(
            "Notify web team failed: Webhook returned 503 Service Unavailable"
        );
        expect(segments[1].tooltip).toBe(
            "Notify web team failed. The requester or an operator can restart it."
        );
        expect(segments[2].tag).toEqual({ label: "Pending", variant: "neutral-base-outline" });
        expect(segments[2].message).toBeNull();
        expect(segments[2].tooltip).toBeNull();
    });

    it("keeps the decision comment of an approved step as its comment", () => {
        const review = createReview({
            steps: [
                createStep({
                    id: "a",
                    state: StepState.Approved,
                    owner: LUKA,
                    comment: "Fine."
                })
            ]
        });

        const { segments } = getReviewProgress(review);

        expect(segments[0].comment).toBe("Fine.");
        expect(segments[0].message).toBeNull();
    });
});
```

Modify `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts`: add the import `import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";` (the file keeps its own `at(day, hour, minute)`; it is not the shared `at`). Add a test inside `describe("buildReviewDetailsViewModel", ...)`, before the last test (replace the anchor pair

```ts
    it("is render-ready: plain data only (R234)", () => {
        const vm = build();
```

with the new test followed by the anchor):

```ts
    it("reads 'Running' for a running AI step and 'In review' for a step a person reviews (R263)", () => {
        const review = createReview({
            steps: [
                createRunningAiStep({ id: "a" }),
                createStep({
                    id: "b",
                    state: StepState.InReview,
                    owner: LUKA,
                    reachedOn: at(16, 14, 19)
                })
            ]
        });

        const { steps } = build(review);

        expect(steps.map(step => step.stateLabel)).toEqual(["Running", "In review"]);
    });

    it("is render-ready: plain data only (R234)", () => {
        const vm = build();
```

Create `packages/app-workflows/src/review/presentation/targetReview/components/ReviewStepTag.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { ReviewStepTag } from "./ReviewStepTag.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";

describe("ReviewStepTag", () => {
    it("renders the label of a plain tag without an icon", () => {
        renderWithAdminUi(
            <ReviewStepTag tag={{ label: "Failed", variant: "destructive" }} tooltip={null} />
        );

        const label = screen.getByText("Failed");
        expect(label.parentElement?.querySelector("[data-testid='svg-icon']")).toBeNull();
    });

    it("renders the progress_activity icon of a running tag", () => {
        renderWithAdminUi(
            <ReviewStepTag
                tag={{ label: "Running", variant: "accent-light", icon: "progress_activity" }}
                tooltip={null}
            />
        );

        const label = screen.getByText("Running");
        expect(label.parentElement?.querySelector("[data-testid='svg-icon']")).not.toBeNull();
    });

    it("shows the tooltip text when the tag receives focus (R264)", async () => {
        renderWithAdminUi(
            <ReviewStepTag
                tag={{ label: "Running", variant: "accent-light", icon: "progress_activity" }}
                tooltip={"AI tone check is running since 14:20."}
            />
        );
        const trigger = screen.getByText("Running").closest(".inline-block");

        fireEvent.focus(trigger as HTMLElement);

        const matches = await screen.findAllByText("AI tone check is running since 14:20.");
        expect(matches.length).toBeGreaterThan(0);
    });

    it("renders no tooltip trigger without a tooltip", () => {
        renderWithAdminUi(
            <ReviewStepTag tag={{ label: "Approved", variant: "success-light" }} tooltip={null} />
        );

        expect(screen.getByText("Approved").closest(".inline-block")).toBeNull();
    });
});
```

Modify `packages/app-workflows/src/review/presentation/targetReview/getReviewMessage.test.ts`. First replace the test that pinned the generic failed text (8a, R203 said 8b adds the message):

```ts
    it("falls back to the generic text for a failed step", () => {
        const owner = createActor({ type: "automation", displayName: "Send webhook" });
        const review = createReview({
            currentStepId: "step-1",
            currentStepState: StepState.Failed,
            steps: [createStep({ title: "Notify web team", state: StepState.Failed, owner })]
        });
        const result = getReviewMessage(params({ review, flags: createFlags() }));
        expect(result.message).toBe("Notify web team is reviewing");
    });
```

with:

```ts
    it("reads '{Step} failed.' for a failed step without a reason (R263, R264)", () => {
        const owner = createActor({ type: "automation", displayName: "Send webhook" });
        const review = createReview({
            currentStepId: "step-1",
            currentStepState: StepState.Failed,
            steps: [createStep({ title: "Notify web team", state: StepState.Failed, owner })]
        });
        const result = getReviewMessage(params({ review, flags: createFlags() }));
        expect(result).toEqual({ message: "Notify web team failed.", lockText: LOCK_IN_REVIEW });
    });
```

Add the imports `import { at } from "~/review/testing/at.js";`, `import { createFailedAutomationStep } from "~/review/testing/createAutomatedStep.js";`, `import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";` and `import { createRunningAutomationStep } from "~/review/testing/createAutomatedStep.js";` to the file, then append at the end of the file:

```ts
describe("getReviewMessage, running and failed steps (R263)", () => {
    const reviewWith = (step: ReturnType<typeof createStep>) => {
        return createReview({
            currentStepId: step.id,
            currentStepState: step.state,
            steps: [step]
        });
    };

    it("reads '{Step} running since {hh:mm}' for a running AI step and keeps the lock text", () => {
        const review = reviewWith(createRunningAiStep());

        const result = getReviewMessage(params({ review, flags: createFlags() }));

        expect(result).toEqual({
            message: "AI tone check running since 14:20",
            lockText: LOCK_IN_REVIEW
        });
    });

    it("reads the same for a running automation step", () => {
        const review = reviewWith(createRunningAutomationStep({ startedOn: at(9, 5) }));

        const result = getReviewMessage(params({ review, flags: createFlags() }));

        expect(result.message).toBe("Notify web team running since 09:05");
    });

    it("keeps the running message even when the viewer flags allow an approval", () => {
        const review = reviewWith(createRunningAiStep());
        const flags = createFlags({ canApprove: true });

        const result = getReviewMessage(params({ review, flags }));

        expect(result.message).toBe("AI tone check running since 14:20");
    });

    it("falls back to '{Step} is reviewing' for a running step without a start time", () => {
        const review = reviewWith(createRunningAiStep({ startedOn: null }));

        const result = getReviewMessage(params({ review, flags: createFlags() }));

        expect(result.message).toBe("AI tone check is reviewing");
    });

    it("reads '{Step} failed: {reason}' with the step comment as the reason", () => {
        const review = reviewWith(createFailedAutomationStep());

        const result = getReviewMessage(params({ review, flags: createFlags() }));

        expect(result).toEqual({
            message: "Notify web team failed: Webhook returned 503 Service Unavailable",
            lockText: LOCK_IN_REVIEW
        });
    });

    it("reads '{Step} failed.' for a blank reason", () => {
        const review = reviewWith(createFailedAutomationStep({ comment: "  " }));

        const result = getReviewMessage(params({ review, flags: createFlags() }));

        expect(result.message).toBe("Notify web team failed.");
    });

    it("leaves the message of a step a person reviews unchanged", () => {
        const step = createStep({
            title: "Legal sign-off",
            state: StepState.InReview,
            owner: createActor({ id: "user-2", displayName: "Luka Perić" }),
            startedOn: at(14, 20)
        });

        const result = getReviewMessage(params({ review: reviewWith(step), flags: createFlags() }));

        expect(result.message).toBe("Luka Perić is reviewing");
    });
});
```

Modify `packages/app-workflows/src/review/presentation/targetReview/stepLabels.test.ts`: the `getReviewProgress` expectation now carries `tag`, `message` and `tooltip` per segment. Replace

```ts
        expect(getReviewProgress(review)).toEqual({
            approved: 1,
            total: 3,
            segments: [
                {
                    stepId: "a",
                    title: "Editorial",
                    state: StepState.Approved,
                    ownerLabel: "Ivan Horvat",
                    comment: "Fine."
                },
                {
                    stepId: "b",
                    title: "Legal",
                    state: StepState.Awaiting,
                    ownerLabel: "Team pool",
                    comment: null
                },
                {
                    stepId: "c",
                    title: "Brand",
                    state: StepState.Pending,
                    ownerLabel: "Not reached yet",
                    comment: null
                }
            ]
        });
```

with

```ts
        expect(getReviewProgress(review)).toEqual({
            approved: 1,
            total: 3,
            segments: [
                {
                    stepId: "a",
                    title: "Editorial",
                    state: StepState.Approved,
                    ownerLabel: "Ivan Horvat",
                    comment: "Fine.",
                    tag: { label: "Approved", variant: "success-light" },
                    message: null,
                    tooltip: null
                },
                {
                    stepId: "b",
                    title: "Legal",
                    state: StepState.Awaiting,
                    ownerLabel: "Team pool",
                    comment: null,
                    tag: { label: "Awaiting", variant: "warning" },
                    message: null,
                    tooltip: null
                },
                {
                    stepId: "c",
                    title: "Brand",
                    state: StepState.Pending,
                    ownerLabel: "Not reached yet",
                    comment: null,
                    tag: { label: "Pending", variant: "neutral-base-outline" },
                    message: null,
                    tooltip: null
                }
            ]
        });
```

Append to `packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts` (add `import { at } from "~/review/testing/at.js";`, `import { createFailedAutomationStep } from "~/review/testing/createAutomatedStep.js";` and `import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";`; it already imports `createActor`, `createFlags`, `createReview`, `createReviewWithFlags`, `createStep`, `StepState` and defines `input`):

```ts
describe("buildTargetReviewViewModel, running and failed steps (R263, R264)", () => {
    const reviewWith = (step: ReturnType<typeof createStep>) => {
        return createReviewWithFlags(
            createReview({
                currentStepId: step.id,
                currentStepState: step.state,
                steps: [step]
            }),
            createFlags()
        );
    };

    it("shows a running AI step with the progress tile, the Running tag and its tooltip", () => {
        const review = reviewWith(createRunningAiStep());

        const vm = buildTargetReviewViewModel(input({ status: "active", review }));

        expect(vm.tile).toBe("progress_activity");
        expect(vm.message).toBe("AI tone check running since 14:20");
        expect(vm.stepStateTag).toEqual({
            label: "Running",
            variant: "accent-light",
            icon: "progress_activity"
        });
        expect(vm.stepStateTooltip).toBe("AI tone check is running since 14:20.");
        expect(vm.ownerMeta).toBe("Owner: AI tone check");
        expect(vm.progress?.segments[0].message).toBe("AI tone check running since 14:20");
    });

    it("shows a failed automation step with the sync_problem tile and the Failed tag", () => {
        const review = reviewWith(createFailedAutomationStep());

        const vm = buildTargetReviewViewModel(input({ status: "active", review }));

        expect(vm.tile).toBe("sync_problem");
        expect(vm.message).toBe("Notify web team failed: Webhook returned 503 Service Unavailable");
        expect(vm.stepStateTag).toEqual({ label: "Failed", variant: "destructive" });
        expect(vm.stepStateTooltip).toBe(
            "Notify web team failed. The requester or an operator can restart it."
        );
    });

    it("has no tooltip and no icon for a step a person reviews", () => {
        const step = createStep({
            title: "Legal sign-off",
            state: StepState.InReview,
            owner: createActor({ id: "user-2", displayName: "Luka Perić" }),
            startedOn: at(14, 20)
        });

        const vm = buildTargetReviewViewModel(input({ status: "active", review: reviewWith(step) }));

        expect(vm.tile).toBe("rate_review");
        expect(vm.stepStateTag).toEqual({ label: "In review", variant: "accent-light" });
        expect(vm.stepStateTooltip).toBeNull();
    });

    it("has no tooltip without a review", () => {
        const vm = buildTargetReviewViewModel(input({ status: "none" }));

        expect(vm.stepStateTooltip).toBeNull();
    });
});
```

Modify the existing test `lists all six step states with owner and the full comment in the popover (QBZ-64)` in `ReviewBar.test.tsx`: its six segment literals need `tag`, `message` and `tooltip` (the popover renders the tags from the view model now; the assertions stay as they are). Add to each literal, after its `comment` line, exactly:

- `s1` (pending): `tag: { label: "Pending", variant: "neutral-base-outline" }, message: null, tooltip: null`
- `s2` (awaiting): `tag: { label: "Awaiting", variant: "warning" }, message: null, tooltip: null`
- `s3` (in review): `tag: { label: "In review", variant: "accent-light" }, message: null, tooltip: null`
- `s4` (approved): `tag: { label: "Approved", variant: "success-light" }, message: null, tooltip: null`
- `s5` (rejected): `tag: { label: "Rejected", variant: "neutral-dark" }, message: null, tooltip: null`
- `s6` (failed): `tag: { label: "Failed", variant: "destructive" }, message: null, tooltip: null`

For example `s6` becomes

```tsx
                        {
                            stepId: "s6",
                            title: "Step failed",
                            state: "failed",
                            ownerLabel: "Step failed",
                            comment: null,
                            tag: { label: "Failed", variant: "destructive" },
                            message: null,
                            tooltip: null
                        }
```

Append to `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx` (it already imports `fireEvent`, `screen`, `renderBar`, `createViewModel`):

```tsx
describe("ReviewBar, running and failed steps (R263, R264)", () => {
    const runningTag = {
        label: "Running",
        variant: "accent-light" as const,
        icon: "progress_activity" as const
    };

    const runningSegment = {
        stepId: "step-1",
        title: "AI tone check",
        state: "inReview" as const,
        ownerLabel: "AI tone check",
        comment: null,
        tag: runningTag,
        message: "AI tone check running since 14:20",
        tooltip: "AI tone check is running since 14:20."
    };

    it("renders the running message, the Running tag with its icon and the meta line", () => {
        renderBar(
            createViewModel({
                message: "AI tone check running since 14:20",
                tile: "progress_activity",
                stepStateTag: runningTag,
                stepStateTooltip: "AI tone check is running since 14:20.",
                stepMeta: "Step 1 of 1: AI tone check",
                ownerMeta: "Owner: AI tone check",
                progress: { approved: 0, total: 1, segments: [runningSegment] }
            })
        );

        expect(screen.getByText("AI tone check running since 14:20")).toBeTruthy();
        const tag = screen.getByText("Running");
        expect(tag.parentElement?.querySelector("[data-testid='svg-icon']")).not.toBeNull();
        expect(
            screen.getByText(
                "Editing, publishing and moving are locked while this revision is in review."
            )
        ).toBeTruthy();
    });

    it("renders the failed message with the Failed tag", () => {
        renderBar(
            createViewModel({
                message: "Notify web team failed: Webhook returned 503 Service Unavailable",
                tile: "sync_problem",
                stepStateTag: { label: "Failed", variant: "destructive" },
                stepStateTooltip:
                    "Notify web team failed. The requester or an operator can restart it.",
                stepMeta: "Step 1 of 1: Notify web team",
                ownerMeta: "Owner: Notify web team"
            })
        );

        expect(
            screen.getByText("Notify web team failed: Webhook returned 503 Service Unavailable")
        ).toBeTruthy();
        expect(screen.getByText("Failed")).toBeTruthy();
    });

    it("shows the run message of a segment in the popover instead of a quoted comment", async () => {
        renderBar(
            createViewModel({
                message: "Luka Perić is reviewing",
                progress: {
                    approved: 1,
                    total: 2,
                    segments: [
                        {
                            stepId: "step-0",
                            title: "Editorial check",
                            state: "approved",
                            ownerLabel: "Ivan Horvat",
                            comment: "Fine.",
                            tag: { label: "Approved", variant: "success-light" },
                            message: null,
                            tooltip: null
                        },
                        runningSegment
                    ]
                }
            })
        );

        fireEvent.click(screen.getByText("1 of 2 steps approved"));

        expect(await screen.findByText("AI tone check running since 14:20")).toBeTruthy();
        expect(screen.getByText("“Fine.”")).toBeTruthy();
        expect(screen.queryByText("“AI tone check running since 14:20”")).toBeNull();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview/runningFailedView.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewStepTag.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/getReviewMessage.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/stepLabels.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts 2>&1 | tail -30
```

Expected: `runningFailedView.test.ts` and `ReviewStepTag.test.tsx` fail with `Failed to resolve import` for the missing modules. `getReviewMessage.test.ts` fails (`Notify web team is reviewing` is not `Notify web team failed.`, the running cases get the in-review text). `stepLabels.test.ts` fails (the segments carry no `tag`, `message`, `tooltip`). `buildTargetReviewViewModel.test.ts` fails (`tile` is `rate_review`, no `stepStateTooltip`). `ReviewBar.test.tsx` fails (the new vm fields are unknown, TypeScript is not checked by vitest, so the runtime failure is the missing popover message). Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/icons/src/extraIcons/progress_activity.svg` (the official Material Symbols Outlined 24px glyph, which the older `@material-design-icons/svg` set that `@webiny/icons` copies does not have; `fill` as in `flowchart.svg`):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
     viewBox="0 -960 960 960" fill="#000000">
    <path
            d="M325-111.5q-73-31.5-127.5-86t-86-127.5Q80-398 80-480.5t31.5-155q31.5-72.5 86-127t127.5-86Q398-880 480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480.5-80Q398-80 325-111.5Z"/>
</svg>
```

Then build the package once so `dist` has the file (the app build and the real admin use it; the tests stub it):

```bash
yarn build -p @webiny/icons --no-cache 2>&1 | tail -10
```

Create `packages/app-workflows/src/review/presentation/targetReview/getStepStartedAt.ts`:

```ts
import type { ReviewStep } from "~/review/domain/types.js";
import { formatTimeOfDay } from "../time/formatTimeOfDay.js";

/*
 * The "hh:mm" the current attempt of a step started at, in the viewer's timezone; `null` without
 * a start time or with an unparsable one. Pure.
 */
export const getStepStartedAt = (step: ReviewStep): string | null => {
    if (step.startedOn === null) {
        return null;
    }
    const started = new Date(step.startedOn);
    if (Number.isNaN(started.getTime())) {
        return null;
    }
    return formatTimeOfDay(started);
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/getStepRunMessage.ts`:

```ts
import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import { getStepStartedAt } from "./getStepStartedAt.js";
import { isStepRunning } from "./isStepRunning.js";

/*
 * What the bar and the progress popover say about a running or failed step (R263, R264):
 * "{Step} running since {hh:mm}", "{Step} failed: {reason}" and, without a reason, "{Step} failed."
 * (`reason` is the step comment). `null` for every other step, and for a running step without a
 * usable start time. Pure.
 */
export const getStepRunMessage = (step: ReviewStep): string | null => {
    if (step.state === StepState.Failed) {
        const reason = step.comment ? step.comment.trim() : "";
        if (reason === "") {
            return `${step.title} failed.`;
        }
        return `${step.title} failed: ${reason}`;
    }

    if (!isStepRunning(step)) {
        return null;
    }
    const startedAt = getStepStartedAt(step);
    if (startedAt === null) {
        return null;
    }
    return `${step.title} running since ${startedAt}`;
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/getStepTagTooltip.ts`:

```ts
import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import { getStepStartedAt } from "./getStepStartedAt.js";
import { isStepRunning } from "./isStepRunning.js";

/*
 * The hover text of a step tag (R264): running "{Step} is running since {hh:mm}.", failed
 * "{Step} failed. The requester or an operator can restart it.". `null` for every other step, and
 * for a running step without a usable start time. Pure.
 */
export const getStepTagTooltip = (step: ReviewStep): string | null => {
    if (step.state === StepState.Failed) {
        return `${step.title} failed. The requester or an operator can restart it.`;
    }

    if (!isStepRunning(step)) {
        return null;
    }
    const startedAt = getStepStartedAt(step);
    if (startedAt === null) {
        return null;
    }
    return `${step.title} is running since ${startedAt}.`;
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/components/ReviewStepTag.tsx`:

```tsx
import React from "react";
import { Tag } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import type { TargetReviewTag } from "../abstractions.js";
import { REVIEW_TAG_ICONS } from "./reviewBarAppearance.js";

export interface ReviewStepTagProps {
    tag: TargetReviewTag;
    // The hover text (R264), or `null` for a tag without one.
    tooltip: string | null;
}

/*
 * A step-state tag with its optional icon (the running tag) and its optional tooltip (running and
 * failed). The bar and the progress popover render step tags through it.
 */
export const ReviewStepTag = (props: ReviewStepTagProps) => {
    const { tag, tooltip } = props;

    let icon: React.ReactElement | undefined = undefined;
    if (tag.icon) {
        const TagIcon = REVIEW_TAG_ICONS[tag.icon];
        icon = <TagIcon />;
    }

    const element = <Tag variant={tag.variant} content={tag.label} icon={icon} />;
    if (tooltip === null) {
        return element;
    }
    return <Tooltip trigger={element} content={tooltip} />;
};
```

Modify `packages/app-workflows/src/review/presentation/targetReview/abstractions.ts` in four places. Replace

```ts
// The state tile of the bar (README 6): the Material icon name that names it.
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
```

with

```ts
// The state tile of the bar (README 6): the Material icon name that names it.
export type TargetReviewTile =
    | "rule"
    | "rate_review"
    | "progress_activity"
    | "hourglass_empty"
    | "sync_problem"
    | "check_circle"
    | "cancel";

// The icon of a step tag: only the running tag has one (R263).
export type TargetReviewTagIcon = "progress_activity";

export interface TargetReviewTag {
    label: string;
    variant: TargetReviewTagVariant;
    icon?: TargetReviewTagIcon;
}
```

Replace

```ts
export interface TargetReviewSegmentVm {
    stepId: string;
    title: string;
    state: StepStateValue;
    ownerLabel: string;
    comment: string | null;
}
```

with

```ts
export interface TargetReviewSegmentVm {
    stepId: string;
    title: string;
    state: StepStateValue;
    ownerLabel: string;
    // The decision comment of the step.
    comment: string | null;
    tag: TargetReviewTag;
    // "{Step} running since {hh:mm}" or "{Step} failed: {reason}", else `null` (R263).
    message: string | null;
    // The tag tooltip of a running or failed step (R264), else `null`.
    tooltip: string | null;
}
```

Replace

```ts
    stepStateTag: TargetReviewTag | null;
    stepMeta: string | null;
```

with

```ts
    stepStateTag: TargetReviewTag | null;
    // The hover text of the step tag of a running or failed step (R264), else `null`.
    stepStateTooltip: string | null;
    stepMeta: string | null;
```

Replace the body of `packages/app-workflows/src/review/presentation/targetReview/getStepStateTag.ts` (whole file):

```ts
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { TargetReviewTag } from "./abstractions.js";

/*
 * The six step states, each visibly distinct (README 1, UI-13). Only `failed` is red (R239, Q24);
 * a rejected step is the dark neutral tag. A running step (`running` true, R263) is the In review
 * treatment with the label `Running` and the `progress_activity` icon; `running` only matters for
 * the `inReview` state, so the rows of the lists, which do not know the step owner, pass nothing.
 */
export const getStepStateTag = (state: StepStateValue, running = false): TargetReviewTag => {
    switch (state) {
        case StepState.Awaiting:
            return { label: "Awaiting", variant: "warning" };
        case StepState.InReview:
            if (running) {
                return { label: "Running", variant: "accent-light", icon: "progress_activity" };
            }
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

Modify `getReviewMessage.ts`. Add the import after `import { getRejectionText } from "./getRejectionText.js";`:

```ts
import { getRejectionText } from "./getRejectionText.js";
import { getStepOwnerLabel } from "./getStepOwnerLabel.js";
```

becomes

```ts
import { getRejectionText } from "./getRejectionText.js";
import { getStepOwnerLabel } from "./getStepOwnerLabel.js";
import { getStepRunMessage } from "./getStepRunMessage.js";
```

(add only the last line). In `getInProgressMessage` replace

```ts
    if (step.owner === null) {
        return { message: "Review in progress", lockText: LOCK_IN_REVIEW };
    }

    // Approving is owner-only on the server, so the flag tells us the viewer owns the step.
```

with

```ts
    // A running or failed step says so, before any owner wording (R263).
    const runMessage = getStepRunMessage(step);
    if (runMessage !== null) {
        return { message: runMessage, lockText: LOCK_IN_REVIEW };
    }

    if (step.owner === null) {
        return { message: "Review in progress", lockText: LOCK_IN_REVIEW };
    }

    // Approving is owner-only on the server, so the flag tells us the viewer owns the step.
```

and replace the file comment

```ts
/*
 * The bar's message and lock text (README 6, R225, R226, R232). Pure. A running or failed step
 * reads like an in-review step here (R203, 8b adds their own messages).
 */
```

with

```ts
/*
 * The bar's message and lock text (README 6, R225, R226, R232, R263). Pure. A running step reads
 * "{Step} running since {hh:mm}" and a failed one "{Step} failed: {reason}".
 */
```

Replace the whole file `getReviewProgress.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import type { TargetReviewProgressVm } from "./abstractions.js";
import type { TargetReviewSegmentVm } from "./abstractions.js";
import { getStepOwnerLabel } from "./getStepOwnerLabel.js";
import { getStepRunMessage } from "./getStepRunMessage.js";
import { getStepStateTag } from "./getStepStateTag.js";
import { getStepTagTooltip } from "./getStepTagTooltip.js";
import { isStepRunning } from "./isStepRunning.js";

// "n of N steps approved" and the segments of the popover (README 6, R263).
export const getReviewProgress = (review: Review): TargetReviewProgressVm => {
    const segments: TargetReviewSegmentVm[] = review.steps.map(step => {
        return {
            stepId: step.id,
            title: step.title,
            state: step.state,
            ownerLabel: getStepOwnerLabel(step),
            comment: step.comment,
            tag: getStepStateTag(step.state, isStepRunning(step)),
            message: getStepRunMessage(step),
            tooltip: getStepTagTooltip(step)
        };
    });
    const approved = review.steps.filter(step => step.state === StepState.Approved).length;

    return { approved, total: review.steps.length, segments };
};
```

Modify `buildTargetReviewViewModel.ts`. Add imports after `import { getStepStateTag } from "./getStepStateTag.js";`:

```ts
import { getStepStateTag } from "./getStepStateTag.js";
import { getStepTagTooltip } from "./getStepTagTooltip.js";
import { isStepRunning } from "./isStepRunning.js";
```

In `getTile` replace

```ts
    if (display && display.step.state === StepState.Failed) {
        return "sync_problem";
    }
    return "rate_review";
```

with

```ts
    if (display && display.step.state === StepState.Failed) {
        return "sync_problem";
    }
    if (display && isStepRunning(display.step)) {
        return "progress_activity";
    }
    return "rate_review";
```

Replace

```ts
    let stepMeta: string | null = null;
    let ownerMeta: string | null = null;
    let stepStateTag: TargetReviewTag | null = null;
    if (display) {
        const ownerLabel = getStepOwnerLabel(display.step);
        stepMeta = `Step ${display.index + 1} of ${display.total}: ${display.step.title}`;
        ownerMeta = `Owner: ${ownerLabel}`;
        stepStateTag = getStepStateTag(display.step.state);
    }
```

with

```ts
    let stepMeta: string | null = null;
    let ownerMeta: string | null = null;
    let stepStateTag: TargetReviewTag | null = null;
    let stepStateTooltip: string | null = null;
    if (display) {
        const ownerLabel = getStepOwnerLabel(display.step);
        const running = isStepRunning(display.step);
        stepMeta = `Step ${display.index + 1} of ${display.total}: ${display.step.title}`;
        ownerMeta = `Owner: ${ownerLabel}`;
        stepStateTag = getStepStateTag(display.step.state, running);
        stepStateTooltip = getStepTagTooltip(display.step);
    }
```

and in the returned object replace

```ts
        stepStateTag,
        stepMeta,
```

with

```ts
        stepStateTag,
        stepStateTooltip,
        stepMeta,
```

Modify `components/reviewBarAppearance.ts`. After `import { ReactComponent as CancelIcon } from "@webiny/icons/cancel.svg";` add:

```ts
import { ReactComponent as ProgressActivityIcon } from "@webiny/icons/progress_activity.svg";
```

Replace `import type { TargetReviewActionIcon } from "../abstractions.js";` with

```ts
import type { TargetReviewActionIcon } from "../abstractions.js";
import type { TargetReviewTagIcon } from "../abstractions.js";
```

(Task 11 only edits `REVIEW_ACTION_ICONS` and adds one import after the `BlockIcon` import; these anchors do not overlap with it.) Replace

```ts
export const REVIEW_TILE_ICONS: Record<TargetReviewTile, SvgComponent> = {
    rule: RuleIcon,
    rate_review: RateReviewIcon,
```

with

```ts
// The icon of a step tag (R263): only the running tag has one.
export const REVIEW_TAG_ICONS: Record<TargetReviewTagIcon, SvgComponent> = {
    progress_activity: ProgressActivityIcon
};

export const REVIEW_TILE_ICONS: Record<TargetReviewTile, SvgComponent> = {
    rule: RuleIcon,
    rate_review: RateReviewIcon,
    progress_activity: ProgressActivityIcon,
```

and replace

```ts
    rule: "bg-neutral-dimmed",
    rate_review: "bg-primary-subtle",
```

with

```ts
    rule: "bg-neutral-dimmed",
    rate_review: "bg-primary-subtle",
    progress_activity: "bg-primary-subtle",
```

Modify `components/ReviewBar.tsx`. Add `import { ReviewStepTag } from "./ReviewStepTag.js";` after `import { ReviewProgress } from "./ReviewProgress.js";`, and replace

```tsx
                            {vm.stepStateTag && (
                                <Tag
                                    variant={vm.stepStateTag.variant}
                                    content={vm.stepStateTag.label}
                                />
                            )}
```

with

```tsx
                            {vm.stepStateTag && (
                                <ReviewStepTag
                                    tag={vm.stepStateTag}
                                    tooltip={vm.stepStateTooltip}
                                />
                            )}
```

(`Tag` stays imported: the review state tag still uses it.)

Replace the whole file `components/ReviewStepsPopover.tsx`:

```tsx
import React from "react";
import { useState } from "react";
import { Popover } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { TargetReviewProgressVm } from "../abstractions.js";
import type { TargetReviewSegmentVm } from "../abstractions.js";
import { ReviewStepTag } from "./ReviewStepTag.js";

export interface ReviewStepsPopoverProps {
    progress: TargetReviewProgressVm;
    children: React.ReactNode;
}

// The text line of a segment: the run message of a running or failed step, else the quoted comment.
const getSegmentLine = (segment: TargetReviewSegmentVm): string | null => {
    if (segment.message !== null) {
        return segment.message;
    }
    if (segment.comment) {
        return `“${segment.comment}”`;
    }
    return null;
};

/*
 * The steps popover (README 6, R263): every step's state tag with its tooltip, owner and text
 * line. Opens on hover and on click or keyboard (the trigger is a button); `useState` holds one
 * visual flag only.
 */
export const ReviewStepsPopover = (props: ReviewStepsPopoverProps) => {
    const { progress, children } = props;
    const [open, setOpen] = useState(false);

    const content = (
        <ul className={"m-none flex min-w-[280px] list-none flex-col gap-sm-plus p-none"}>
            {progress.segments.map(segment => {
                const line = getSegmentLine(segment);
                return (
                    <li key={segment.stepId} className={"flex flex-col gap-xs"}>
                        <div className={"flex items-center gap-sm"}>
                            <Text size={"md"} className={"font-semibold"}>
                                {segment.title}
                            </Text>
                            <ReviewStepTag tag={segment.tag} tooltip={segment.tooltip} />
                        </div>
                        <Text size={"sm"} className={"text-neutral-strong"}>
                            {segment.ownerLabel}
                        </Text>
                        {line !== null ? <Text size={"sm"}>{line}</Text> : null}
                    </li>
                );
            })}
        </ul>
    );

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
            align={"start"}
            content={content}
            trigger={
                <button
                    type={"button"}
                    className={"flex cursor-pointer items-center gap-sm-plus bg-transparent p-none"}
                    onMouseEnter={() => setOpen(true)}
                >
                    {children}
                </button>
            }
        />
    );
};
```

Modify `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.ts`. Add the import after `import { getStepStateTag } from "../targetReview/getStepStateTag.js";`:

```ts
import { isStepRunning } from "../targetReview/isStepRunning.js";
```

and in `getStepVm` replace `const tag = getStepStateTag(step.state);` with

```ts
    const tag = getStepStateTag(step.state, isStepRunning(step));
```

Modify `packages/app-workflows/src/review/testing/targetReviewFakes.ts`. After `stepStateTag: { label: "In review", variant: "accent-light" },` add `stepStateTooltip: null,`, and replace the three segments

```ts
                {
                    stepId: "step-1",
                    title: "Editorial check",
                    state: "approved",
                    ownerLabel: "Ivan Horvat",
                    comment: null
                },
                {
                    stepId: "step-2",
                    title: "Legal sign-off",
                    state: "inReview",
                    ownerLabel: "Luka Perić",
                    comment: null
                },
                {
                    stepId: "step-3",
                    title: "Brand check",
                    state: "pending",
                    ownerLabel: "Not reached yet",
                    comment: null
                }
```

with

```ts
                {
                    stepId: "step-1",
                    title: "Editorial check",
                    state: "approved",
                    ownerLabel: "Ivan Horvat",
                    comment: null,
                    tag: { label: "Approved", variant: "success-light" },
                    message: null,
                    tooltip: null
                },
                {
                    stepId: "step-2",
                    title: "Legal sign-off",
                    state: "inReview",
                    ownerLabel: "Luka Perić",
                    comment: null,
                    tag: { label: "In review", variant: "accent-light" },
                    message: null,
                    tooltip: null
                },
                {
                    stepId: "step-3",
                    title: "Brand check",
                    state: "pending",
                    ownerLabel: "Not reached yet",
                    comment: null,
                    tag: { label: "Pending", variant: "neutral-base-outline" },
                    message: null,
                    tooltip: null
                }
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview/runningFailedView.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewStepTag.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/getReviewMessage.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/stepLabels.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx 2>&1 | tail -40
```

Expected: PASS. Component test notes to check on the first run: in `ReviewStepTag.test.tsx` the tooltip trigger is the `.inline-block` span `Tooltip` renders around the tag; if `fireEvent.focus` does not open it, hover with `fireEvent.pointerMove(trigger)` and `await screen.findAllByText(...)` (the tooltip delay is 500 ms; `findAllByText` waits 1000 ms). In `ReviewBar.test.tsx` the popover opens on a click of the trigger button (`1 of 2 steps approved` sits inside it); if Radix needs a pointer event, use `fireEvent.pointerDown` first.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview packages/app-workflows/src/review/presentation/reviewDetails packages/app-workflows/src/review/presentation/reviewList packages/app-workflows/src/review/presentation/reviewWidget packages/app-workflows/src/review/editor 2>&1 | tail -40
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors. The list and widget presenters call `getRowStateTag`, which still calls `getStepStateTag(state)` with one argument (default `running = false`), so their tests stay green unchanged. The existing popover test in `ReviewBar.test.tsx` (QBZ-64) is the other place that builds `TargetReviewSegmentVm` literals; it is updated in Step 1.

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
git commit -m "feat(app-workflows): show running and failed steps in the review bar" -m "A running AI or automation step reads '{Step} running since {hh:mm}' and a failed one '{Step} failed: {reason}' in the bar and the progress popover. The step tag of a running step is Running with the progress_activity icon, the tile follows, and running and failed tags carry their tooltips. The progress_activity icon is added to the extra icons of @webiny/icons." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`progress_activity` is not in `@webiny/icons`.** The contract and design name the icon; the package copies `@material-design-icons/svg/outlined` (no `progress_activity`) plus `src/extraIcons/`. The task adds `progress_activity.svg` to `extraIcons` and builds the package. Admin tests stub all `@webiny/icons/*.svg` imports, so they do not need the build.
- **`TargetReviewTag.icon` is optional** (`icon?: TargetReviewTagIcon`, set only for the running tag), so the existing `toEqual({ label, variant })` expectations of `getStepStateTag`, `getRowStateTag` and `buildTargetReviewViewModel` stay valid. The failed tag keeps the 8a shape (no tag icon); the contract's "failed keeps `Failed` and `sync_problem`" is read as: the tag stays `Failed`, the tile stays `sync_problem`.
- **Additive names not in the contract:** `getStepStartedAt`, `getStepRunMessage`, `getStepTagTooltip` (one pure file each), `ReviewStepTag`, `REVIEW_TAG_ICONS`, `TargetReviewTagIcon`, `ITargetReviewViewModel.stepStateTooltip`, `TargetReviewSegmentVm.tag` and `.tooltip` (the popover needs the running-aware tag and the tooltip render-ready; it used to compute the tag from `segment.state`, which cannot tell running from in review). `TargetReviewSegmentVm.message` is the contract's "message per segment".
- **`getStepStateTag(state, running = false)`** keeps the single-argument form for the list rows (a row has no owner). `buildReviewDetailsViewModel` passes `isStepRunning(step)`, so the drawer tag label is `Running` from this task; Task 14 adds the drawer icon.
- **Running without a start time** has no copy for "since": it falls back to the 8a text `{Step} is reviewing`, pinned by a test. A step in `inReview` with an AI or automation owner always has `startedOn` on the server, so this only covers malformed data.
- **Existing expectations changed:** `ReviewBar.test.tsx` (the QBZ-64 six-states popover test: segments gain `tag`, `message`, `tooltip`), `getReviewMessage.test.ts` ("falls back to the generic text for a failed step" now reads `Notify web team failed.`, the 8a text said 8b adds this), `stepLabels.test.ts` (`getReviewProgress` segments), `createViewModel` in `targetReviewFakes.ts` (new fields).
- **Depends on Task 11** for `isStepRunning`; Task 11 also edits `abstractions.ts`, `reviewBarAppearance.ts` and `ReviewBar.test.tsx` (other hunks, same files; Task 11 only edits `REVIEW_ACTION_ICONS` and adds one import after the `BlockIcon` import in `reviewBarAppearance.ts`, so the Task 12 anchors do not overlap).
- **Popover line:** `getSegmentLine` chooses between `message` and the quoted `comment` in the component (the 8a popover already quoted in the component); the contract fixes `message` as "message per segment", so no render-ready `line` field was added.
- **Shared test builders** `AI_ACTOR`, `AUTOMATION_ACTOR`, `createRunningAiStep`, `createRunningAutomationStep`, `createFailedAutomationStep` are created here (R243) and reused by Tasks 13-15; `at` is Task 11's (`testing/at.ts`), created there because Task 11's tests also need a local clock.
- Size: large (four new source files, one component, ten modified files, six test files).
