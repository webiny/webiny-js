### Task 11: The restart action

R202, R214, R215, R220, R234, R237, R238, R263 (`isStepRunning`), R264, R266; D34, D82; QBZ-2, QBZ-85, QBZ-93; design 4c (restart dialog, cancel dialog running suffix, restart toast, restart conflict); Review Focus 7 (Restart only with `flags.canRestart`, the conflict text when the step is no longer failed, `TargetSync` is a success). Restart goes through every action table the 8a actions already use: the action kind, its icon, `getReviewActions` (so the bar and the drawer footer), `getListRowActions` (the Content Reviews row), the dialog copy, the one dialog presenter, the conflict message, the toast. Task 8 supplied `restartStep`; nothing here talks to a gateway. The Content Reviews row needs nothing beyond the whitelist entry: `ReviewListDialogKind` already includes every `ReviewActionKind`, and Task 16 tests the row through `ReviewListDialogs`.

- **Action** (server flag `canRestart` only, D5, D54): kind `restart`, label `Restart`, icon `refresh`, emphasis `primary` (design `ACT` table: `restart: ['Restart','primary','refresh']`), the last of the actions. `TargetReviewActionKind` and `ReviewActionKind` gain `restart`, `TargetReviewActionIcon` gains `refresh`, `REVIEW_ACTION_ICONS` maps it to `@webiny/icons/refresh.svg`. `getListRowActions` lets `restart` through its whitelist.
- **`isStepRunning(step: ReviewStep): boolean`** (R263, `targetReview/isStepRunning.ts`, pure): `step.state === StepState.InReview && step.owner !== null && step.owner.type !== "user"`. Tasks 12-15 reuse it; this task uses it for the cancel suffix and the restart conflict.
- **Restart dialog copy** (R266, R264, design 4c; the step is the request's step of the loaded review; `{hh:mm}` is `formatTimeOfDay` of the step's `finishedOn`, the end of the last attempt; `{reason}` is the trimmed `step.comment`):
  - title `Restart “{Step}”?`, confirm `Restart` (primary), cancel `Cancel`, no comment field, `canSubmit` true.
  - body with an end time and a reason: `Last attempt failed at {hh:mm}: {reason}. Restarting runs the step again from the beginning.`
  - body without an end time, with a reason: `Last attempt failed: {reason}. Restarting runs the step again from the beginning.` (the design's list text).
  - body without a reason, with an end time: `Last attempt failed at {hh:mm}. Restarting runs the step again from the beginning.` (R264).
  - body with neither: `Last attempt failed. Restarting runs the step again from the beginning.` This is **the one derived string of 8b** (the list text without the reason); it is listed for the user at the plan review.
- **Cancel dialog running suffix** (design 4c, frame 23): when the current step of the loaded review is running (`isStepRunning`), the cancel body ends ` {Step} is running and will be stopped.` after the 8a text; otherwise it stays as 8a.
- **Submitting:** the restart branch of `ReviewActionDialogPresenter.submit` calls `useCases.restartStep({ reviewId, stepId })` and builds the toast `{ kind: "restarted", stepTitle, personName: null, reviewsUrl }`, then shows it and calls `onDone` like every action (the host refreshes the bar or the list, Tasks 13 and 16).
- **`TargetSync` is a success for a restart** (R266): `classifyReviewActionError` returns the new kind `targetSync` for `Workflows/Review/TargetSync`; the dialog presenter treats it as done for `restart` (the toast and `onDone`, no error, no re-read) because the restart was saved and only the content sync failed. For every other kind it stays the unclassified server message as before.
- **Toast** (R266, QBZ-93): `ReviewToastKind` and `StepReviewToastParams.kind` gain `restarted`; `getReviewToastText` returns title `Restarted “{Step}”` and description `The step is running again.`; the link `Open Content Reviews` comes from `reviewsUrl` as for the other toasts (the editor passes it, Content Reviews passes `null`).
- **Conflict** (R266, QBZ-2): `ACTION_NOUNS.restart = "restart"`, plus one new branch of `getConflictMessage`: a restart whose re-read step is running (`isStepRunning`) gets `Someone restarted “{Step}” at {time}. It is running again, so your restart was not saved.`, `{time}` = `formatReviewTime(review.lastChangedOn, now)` like the other branches, the title stays `Someone else acted first`. Content Reviews appends 8a's ` The list has been refreshed.` (R220). Any other restart conflict (cancelled, approved, rejected, the step gone) uses the existing branches and the generic fallback with the noun `restart`. The existing conflict classification already covers the restart errors (`InvalidState`, `StepNotCurrent` are conflict codes).
- **Conflicts with design copy, named (R266):** (1) the design's restart conflict names the person who restarted (`Tomislav Šarić restarted ...`); the review does not store who restarted and 8b stores nothing new, so the text says `Someone`. (2) The design's list restart conflict ends `It is running again. The list has been refreshed.`; R220's generic append puts the list note after the editor text instead, so the list reads `... so your restart was not saved. The list has been refreshed.` (3) The design's list dialog text omits the end time (`Last attempt failed: {reason}.`); the dialog uses one copy table and shows the time when the step has an end time.

**Files:**
- Create: `packages/app-workflows/src/review/testing/at.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/isStepRunning.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/isStepRunning.test.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/getRestartDialogBody.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/getCancelDialogBody.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/getActionDialogCopy.test.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/classifyReviewActionError.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/abstractions.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/components/reviewBarAppearance.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/getReviewActions.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/getReviewActions.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx`
- Modify: `packages/app-workflows/src/review/presentation/reviewList/getListRowActions.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionKind.ts`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/getActionDialogCopy.ts`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.ts`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/classifyReviewActionError.ts`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.ts`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.test.tsx`
- Modify: `packages/app-workflows/src/review/toasts/abstractions.ts`
- Modify: `packages/app-workflows/src/review/toasts/getReviewToastText.ts`
- Modify: `packages/app-workflows/src/review/toasts/getReviewToastText.test.ts`
- Modify: `packages/app-workflows/src/review/toasts/ReviewToasts.test.ts`

**Interfaces:**
- Consumes (verified): Task 8 (`IReviewUseCases.restartStep` and its `FakeReviewUseCases` mock, `ReviewErrorCode.TargetSync`); `ReviewActionDialogPresenter` and its `Feature` (`./feature.js`), `getActionDialogCopy`, `getConflictMessage`, `classifyReviewActionError`, `formatReviewTime` (`./formatReviewTime.js`), `formatTimeOfDay` (`~/review/presentation/time/formatTimeOfDay.js`), `getStepOwnerLabel`, `getReviewActions`, `getListRowActions`, `REVIEW_ACTION_ICONS`, `getReviewToastText`, `ReviewToasts`; the fixtures `createStep`, `createActor`, `createFlags`, `createReview`, `createReviewWithFlags`, `createFakeUseCases`, `createFakePresenter`, `createViewModel`, `renderWithContainer`, `ReviewToasts` token; `StepState`, `ReviewState`.
- Produces (matches the contract):
  - `isStepRunning(step: ReviewStep): boolean` (Tasks 12-15).
  - Action kind `restart` (`TargetReviewActionKind`, `ReviewActionKind`), icon `refresh`, toast kind `restarted`, error kind `targetSync`, and the restart copy, conflict text and submit branch above.
  - Consumed by Task 12 (running messages), Task 14 (drawer actions), Task 16 (row restart through the same dialog), Tasks 17-18 (the bar's restart through the editor hosts).

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. Run each file by path.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/review/testing/at.ts` (pure; the one clock of the 8b tests, local time so `formatTimeOfDay` is timezone independent; Tasks 12, 14 and 15 import it, none creates another):

```ts
// 16 Oct 2026 at the given local time, as an ISO string.
export const at = (hour: number, minute: number): string => {
    return new Date(2026, 9, 16, hour, minute).toISOString();
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/isStepRunning.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isStepRunning } from "./isStepRunning.js";
import { StepState } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createStep } from "~/review/testing/createStep.js";

describe("isStepRunning (R263)", () => {
    it("is true for an in-review step owned by an AI", () => {
        const step = createStep({
            state: StepState.InReview,
            owner: createActor({ type: "ai" })
        });

        expect(isStepRunning(step)).toBe(true);
    });

    it("is true for an in-review step owned by an automation", () => {
        const step = createStep({
            state: StepState.InReview,
            owner: createActor({ type: "automation" })
        });

        expect(isStepRunning(step)).toBe(true);
    });

    it("is false for an in-review step owned by a person", () => {
        const step = createStep({
            state: StepState.InReview,
            owner: createActor({ type: "user" })
        });

        expect(isStepRunning(step)).toBe(false);
    });

    it("is false for an in-review step without an owner", () => {
        const step = createStep({ state: StepState.InReview, owner: null });

        expect(isStepRunning(step)).toBe(false);
    });

    it.each([
        StepState.Pending,
        StepState.Awaiting,
        StepState.Approved,
        StepState.Rejected,
        StepState.Failed
    ])("is false for a %s step even with an AI owner", state => {
        const step = createStep({ state, owner: createActor({ type: "ai" }) });

        expect(isStepRunning(step)).toBe(false);
    });
});
```

Create `packages/app-workflows/src/review/presentation/actionDialog/classifyReviewActionError.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { classifyReviewActionError } from "./classifyReviewActionError.js";

const failure = (code: string | null): GraphQLOperationError => {
    return new GraphQLOperationError({ message: "Failed.", code });
};

describe("classifyReviewActionError", () => {
    it("classifies TargetSync as its own kind (R266: the review was saved)", () => {
        expect(classifyReviewActionError(failure(ReviewErrorCode.TargetSync))).toBe("targetSync");
    });

    it.each([
        ReviewErrorCode.StepNotCurrent,
        ReviewErrorCode.InvalidState,
        ReviewErrorCode.AlreadyActive
    ])("keeps %s a conflict (a restart of a step that is not failed is one)", code => {
        expect(classifyReviewActionError(failure(code))).toBe("conflict");
    });

    it("keeps the other kinds", () => {
        expect(classifyReviewActionError(failure(ReviewErrorCode.Validation))).toBe("validation");
        expect(classifyReviewActionError(failure(ReviewErrorCode.NotAuthorized))).toBe(
            "notAuthorized"
        );
        expect(classifyReviewActionError(failure(ReviewErrorCode.NotFound))).toBe("notFound");
        expect(classifyReviewActionError(failure(ReviewErrorCode.TargetLocked))).toBe("generic");
        expect(classifyReviewActionError(failure(null))).toBe("generic");
        expect(classifyReviewActionError(new Error("Network."))).toBe("generic");
    });
});
```

Create `packages/app-workflows/src/review/presentation/actionDialog/getActionDialogCopy.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getActionDialogCopy } from "./getActionDialogCopy.js";
import { StepState } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import { at } from "~/review/testing/at.js";
import type { ReviewStep } from "~/review/domain/types.js";

const FAILED_AT = at(10, 20);
const SUFFIX = "Restarting runs the step again from the beginning.";
const AI = createActor({ type: "ai" });

const failedStep = (overrides: Partial<ReviewStep> = {}): ReviewStep => {
    return createStep({
        id: "step-1",
        title: "AI tone check",
        type: "ai",
        state: StepState.Failed,
        owner: AI,
        comment: "Provider unavailable: request timed out after 60 s",
        finishedOn: FAILED_AT,
        ...overrides
    });
};

const restartCopy = (step: ReviewStep) => {
    const review = createReview({ currentStepId: step.id, steps: [step] });
    return getActionDialogCopy({ kind: "restart", review, stepId: step.id, comment: "" });
};

describe("getActionDialogCopy: restart (R266, R264)", () => {
    it("shows the title, the buttons and no comment field", () => {
        const copy = restartCopy(failedStep());

        expect(copy.title).toBe("Restart “AI tone check”?");
        expect(copy.confirmLabel).toBe("Restart");
        expect(copy.cancelLabel).toBe("Cancel");
        expect(copy.showComment).toBe(false);
        expect(copy.showNotify).toBe(false);
        expect(copy.canSubmit).toBe(true);
    });

    it("names the end of the last attempt and the reason", () => {
        expect(restartCopy(failedStep()).body).toBe(
            `Last attempt failed at 10:20: Provider unavailable: request timed out after 60 s. ${SUFFIX}`
        );
    });

    it("uses the list text without a time when the step has no end time", () => {
        const copy = restartCopy(failedStep({ finishedOn: null }));

        expect(copy.body).toBe(
            `Last attempt failed: Provider unavailable: request timed out after 60 s. ${SUFFIX}`
        );
    });

    it("uses the time-only text without a reason (R264)", () => {
        expect(restartCopy(failedStep({ comment: null })).body).toBe(
            `Last attempt failed at 10:20. ${SUFFIX}`
        );
    });

    it("treats a blank reason as none", () => {
        expect(restartCopy(failedStep({ comment: "   " })).body).toBe(
            `Last attempt failed at 10:20. ${SUFFIX}`
        );
    });

    it("uses the derived text with neither a time nor a reason", () => {
        const copy = restartCopy(failedStep({ comment: null, finishedOn: null }));

        expect(copy.body).toBe(`Last attempt failed. ${SUFFIX}`);
    });

    it("trims the reason", () => {
        const copy = restartCopy(failedStep({ comment: "  The webhook returned 503  " }));

        expect(copy.body).toBe(`Last attempt failed at 10:20: The webhook returned 503. ${SUFFIX}`);
    });
});

describe("getActionDialogCopy: cancel (design 4c, frame 23)", () => {
    const cancelBody = (steps: ReviewStep[], currentStepId: string | null): string => {
        const review = createReview({ currentStepId, steps });
        return getActionDialogCopy({ kind: "cancel", review, stepId: null, comment: "" }).body;
    };
    const BASE =
        "Review progress is lost. Editing is unlocked, and a new request starts again from the first step.";

    it("keeps the 8a text for a person's step", () => {
        const step = createStep({
            state: StepState.InReview,
            owner: createActor({ type: "user" })
        });

        expect(cancelBody([step], "step-1")).toBe(BASE);
    });

    it("tells that a running AI step will be stopped", () => {
        const step = failedStep({
            state: StepState.InReview,
            comment: null,
            finishedOn: null
        });

        expect(cancelBody([step], "step-1")).toBe(`${BASE} AI tone check is running and will be stopped.`);
    });

    it("tells that a running automation will be stopped", () => {
        const step = failedStep({
            title: "Notify web team",
            type: "automation",
            state: StepState.InReview,
            owner: createActor({ type: "automation" })
        });

        expect(cancelBody([step], "step-1")).toBe(
            `${BASE} Notify web team is running and will be stopped.`
        );
    });

    it("keeps the 8a text for a failed step, which is not running", () => {
        expect(cancelBody([failedStep()], "step-1")).toBe(BASE);
    });

    it("keeps the 8a text when the review has no current step", () => {
        expect(cancelBody([failedStep()], null)).toBe(BASE);
    });

    it("looks at the current step only", () => {
        const running = failedStep({
            id: "step-2",
            state: StepState.InReview,
            owner: createActor({ type: "ai" })
        });
        const approved = createStep({ id: "step-1", state: StepState.Approved });

        expect(cancelBody([approved, running], "step-1")).toBe(BASE);
        expect(cancelBody([approved, running], "step-2")).toContain("is running and will be stopped.");
    });
});
```

Modify `packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.test.ts`: append inside the `describe`, before its closing `});`:

```ts

    describe("restart", () => {
        const AI_OWNER = createActor({ type: "ai", id: "user-1", displayName: "Maja Kos" });

        it("tells that someone restarted a step that is running again (R266)", () => {
            const result = getConflictMessage({
                kind: "restart",
                stepId: "step-1",
                review: review({
                    title: "AI tone check",
                    state: StepState.InReview,
                    owner: AI_OWNER
                }),
                now: NOW,
                listRefreshed: false
            });

            expect(result.title).toBe("Someone else acted first");
            expect(result.message).toBe(
                "Someone restarted “AI tone check” at 10:51. It is running again, so your restart was not saved."
            );
        });

        it("says the same for a running automation", () => {
            const result = getConflictMessage({
                kind: "restart",
                stepId: "step-1",
                review: review({
                    title: "Notify web team",
                    state: StepState.InReview,
                    owner: createActor({ type: "automation" })
                }),
                now: NOW,
                listRefreshed: false
            });

            expect(result.message).toBe(
                "Someone restarted “Notify web team” at 10:51. It is running again, so your restart was not saved."
            );
        });

        it("ends with the list note on Content Reviews (R220)", () => {
            const result = getConflictMessage({
                kind: "restart",
                stepId: "step-1",
                review: review({
                    title: "AI tone check",
                    state: StepState.InReview,
                    owner: AI_OWNER
                }),
                now: NOW,
                listRefreshed: true
            });

            expect(result.message).toBe(
                "Someone restarted “AI tone check” at 10:51. It is running again, so your restart was not saved. The list has been refreshed."
            );
        });

        it("does not claim a restart when the step is in review with a person", () => {
            const result = getConflictMessage({
                kind: "restart",
                stepId: "step-1",
                review: review({ state: StepState.InReview, owner: LUKA }),
                now: NOW,
                listRefreshed: false
            });

            expect(result.message).toBe(
                "Someone else changed “Legal sign-off” at 10:51, so your restart was not saved."
            );
        });

        it("uses the cancelled text with the restart noun", () => {
            const result = getConflictMessage({
                kind: "restart",
                stepId: "step-1",
                review: review({}, { state: ReviewState.Cancelled, isActive: false }),
                now: NOW,
                listRefreshed: false
            });

            expect(result.message).toBe(
                "Someone cancelled this review at 10:51, so your restart was not saved. The revision has no review now."
            );
        });

        it("uses the approved text with the restart noun", () => {
            const result = getConflictMessage({
                kind: "restart",
                stepId: "step-1",
                review: review({ state: StepState.Approved, owner: LUKA }),
                now: NOW,
                listRefreshed: false
            });

            expect(result.message).toBe(
                "Luka Perić approved “Legal sign-off” at 10:51, so your restart was not saved. The review moved on to the next step."
            );
        });

        it("falls back to the generic text without a fresh review", () => {
            const result = getConflictMessage({
                kind: "restart",
                stepId: "step-1",
                review: null,
                now: NOW,
                listRefreshed: false
            });

            expect(result.message).toBe(
                "Someone else changed this review, so your restart was not saved."
            );
        });
    });
```

Modify `packages/app-workflows/src/review/presentation/targetReview/getReviewActions.test.ts`.

Hunk 1, in `it("orders every action ghost, tertiary, secondary, primary", ...)`:

```ts
// before
                canCancel: true,
                canReassign: true
            }),

// after
                canCancel: true,
                canReassign: true,
                canRestart: true
            }),
```

```ts
// before
            ["start", "primary"],
            ["approve", "primary"]
        ]);

// after
            ["start", "primary"],
            ["approve", "primary"],
            ["restart", "primary"]
        ]);
```

```ts
// before
            "Start",
            "Approve"
        ]);

// after
            "Start",
            "Approve",
            "Restart"
        ]);
```

```ts
// before
            "play_arrow",
            "check"
        ]);

// after
            "play_arrow",
            "check",
            "refresh"
        ]);
```

Hunk 2, replace the last test (`it("never offers Restart (8b), also when the server allows it", ...)`, whose premise is gone) with:

```ts
    it("offers Restart only when the server flag allows it (D34, D82)", () => {
        const withFlag = getReviewActions({
            flags: createFlags({ canRestart: true }),
            stepId: "step-3",
            canRequest: false
        });
        const withoutFlag = getReviewActions({
            flags: createFlags({ canStart: true }),
            stepId: "step-3",
            canRequest: false
        });

        expect(withFlag).toEqual([
            {
                kind: "restart",
                label: "Restart",
                icon: "refresh",
                stepId: "step-3",
                emphasis: "primary"
            }
        ]);
        expect(withoutFlag.map(action => action.kind)).toEqual(["start"]);
    });

    it("never offers Restart without an active review", () => {
        expect(getReviewActions({ flags: null, stepId: null, canRequest: true })).toEqual([
            {
                kind: "request",
                label: "Request review",
                icon: "send",
                stepId: null,
                emphasis: "primary"
            }
        ]);
    });
```

Modify `packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts`: add a test after `it("builds the list actions from the flags only, through getReviewActions (D5, D54)", ...)`:

```ts
    it("offers Restart on a row only when the flag allows it (D34, D82)", () => {
        const failed = getListRowActions(
            row({ stepId: "step-4", flags: { canRestart: true, canCancel: true } })
        );
        const running = getListRowActions(row({ stepId: "step-4", flags: { canCancel: true } }));

        expect(failed.map(action => action.kind)).toEqual(["cancel", "restart"]);
        expect(failed.find(action => action.kind === "restart")).toEqual({
            kind: "restart",
            label: "Restart",
            icon: "refresh",
            stepId: "step-4",
            emphasis: "primary"
        });
        expect(running.map(action => action.kind)).toEqual(["cancel"]);
    });
```

(`row({ flags })` merges partial flags: the existing test passes partial flag objects the same way.)

Modify `packages/app-workflows/src/review/toasts/getReviewToastText.test.ts`: add after the `started` test:

```ts
    it("restarted: names the step and says it is running again (QBZ-93)", () => {
        expect(
            getReviewToastText({
                kind: "restarted",
                stepTitle: "AI tone check",
                personName: null,
                reviewsUrl: null
            })
        ).toEqual({
            title: "Restarted “AI tone check”",
            description: "The step is running again."
        });
    });
```

Modify `packages/app-workflows/src/review/toasts/ReviewToasts.test.ts`: add to `toastCases` after the `started` entry:

```ts
    {
        kind: "restarted",
        params: {
            kind: "restarted",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: null
        },
        title: "Restarted “Draft check”",
        description: "The step is running again."
    },
```

and a test after `it("adds the Open Content Reviews link only when a reviews URL is passed", ...)`:

```ts
    it("adds the Open Content Reviews link to the restarted toast in the editor and none on Content Reviews", () => {
        toasts.show({
            kind: "restarted",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: "/cms/content-reviews"
        });
        toasts.show({
            kind: "restarted",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: null
        });

        const editor: INotificationInput = notifications.success.mock.calls[0][0];
        const list: INotificationInput = notifications.success.mock.calls[1][0];
        expect(editor.link).toEqual({
            label: "Open Content Reviews",
            url: "/cms/content-reviews"
        });
        expect(list).not.toHaveProperty("link");
    });
```

Modify `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.test.ts`.

Hunk A, add `import { at } from "~/review/testing/at.js";` after the `createStep` import, then after the `inReviewReview` function add the failed-step fixtures:

```ts
const FAILED_AT = at(10, 20);

const failedReview = () => {
    return createReview({
        currentStepId: "step-1",
        currentStepState: StepState.Failed,
        steps: [
            createStep({
                id: "step-1",
                title: "AI tone check",
                type: "ai",
                state: StepState.Failed,
                owner: createActor({ type: "ai" }),
                comment: "Provider unavailable: request timed out after 60 s",
                finishedOn: FAILED_AT
            })
        ]
    });
};

const runningAgainReview = () => {
    return createReview({
        currentStepId: "step-1",
        currentStepState: StepState.InReview,
        steps: [
            createStep({
                id: "step-1",
                title: "AI tone check",
                type: "ai",
                state: StepState.InReview,
                owner: createActor({ type: "ai" })
            })
        ]
    });
};
```

Hunk B, new tests inserted before `it("calls onClose on dismiss", ...)`:

```ts
    describe("restart (R266)", () => {
        beforeEach(() => {
            setup.useCases.getReview.mockResolvedValue(
                createReviewWithFlags(failedReview(), createFlags({ canRestart: true }))
            );
        });

        it("builds the restart copy from the failed attempt", async () => {
            await setup.presenter.init(setup.params(REQUEST("restart")));

            const { vm } = setup.presenter;
            expect(vm.status).toBe("ready");
            expect(vm.title).toBe("Restart “AI tone check”?");
            expect(vm.body).toBe(
                "Last attempt failed at 10:20: Provider unavailable: request timed out after 60 s. Restarting runs the step again from the beginning."
            );
            expect(vm.confirmLabel).toBe("Restart");
            expect(vm.cancelLabel).toBe("Cancel");
            expect(vm.showComment).toBe(false);
            expect(vm.canSubmit).toBe(true);
        });

        it("calls restartStep, shows the restarted toast and calls onDone", async () => {
            await setup.presenter.init(setup.params(REQUEST("restart")));

            await setup.presenter.submit();

            expect(setup.useCases.restartStep).toHaveBeenCalledTimes(1);
            expect(setup.useCases.restartStep).toHaveBeenCalledWith({
                reviewId: "review-1",
                stepId: "step-1"
            });
            expect(setup.toasts.show).toHaveBeenCalledWith({
                kind: "restarted",
                stepTitle: "AI tone check",
                personName: null,
                reviewsUrl: "/cms/content-reviews"
            });
            expect(setup.onDone).toHaveBeenCalledTimes(1);
            expect(setup.presenter.vm.dialogError).toBeNull();
        });

        it("passes a null reviews URL through for Content Reviews (no link)", async () => {
            await setup.presenter.init({ ...setup.params(REQUEST("restart")), reviewsUrl: null });

            await setup.presenter.submit();

            expect(setup.toasts.show).toHaveBeenCalledWith({
                kind: "restarted",
                stepTitle: "AI tone check",
                personName: null,
                reviewsUrl: null
            });
        });

        it("treats TargetSync as a success: the toast and onDone, no error, no re-read", async () => {
            setup.useCases.restartStep.mockRejectedValue(
                new GraphQLOperationError({
                    message: "The review was saved, but updating its content failed.",
                    code: ReviewErrorCode.TargetSync
                })
            );
            await setup.presenter.init(setup.params(REQUEST("restart")));

            await setup.presenter.submit();

            expect(setup.toasts.show).toHaveBeenCalledWith({
                kind: "restarted",
                stepTitle: "AI tone check",
                personName: null,
                reviewsUrl: "/cms/content-reviews"
            });
            expect(setup.onDone).toHaveBeenCalledTimes(1);
            expect(setup.presenter.vm.dialogError).toBeNull();
            expect(setup.presenter.vm.conflict).toBeNull();
            expect(setup.useCases.getReview).toHaveBeenCalledTimes(1);
        });

        it("does not treat TargetSync as a success for another action", async () => {
            const start = createSetup();
            start.useCases.getReview.mockResolvedValue(
                createReviewWithFlags(inReviewReview(), createFlags())
            );
            start.useCases.startStep.mockRejectedValue(
                new GraphQLOperationError({
                    message: "The review was saved, but updating its content failed.",
                    code: ReviewErrorCode.TargetSync
                })
            );
            await start.presenter.init(start.params(REQUEST("start")));

            await start.presenter.submit();

            expect(start.toasts.show).not.toHaveBeenCalled();
            expect(start.onDone).not.toHaveBeenCalled();
            expect(start.presenter.vm.dialogError).toBe(
                "The review was saved, but updating its content failed."
            );
        });

        it("keeps the dialog open with the restart conflict when the step is running again", async () => {
            setup.useCases.restartStep.mockRejectedValue(
                new GraphQLOperationError({
                    message: "Conflict.",
                    code: ReviewErrorCode.InvalidState
                })
            );
            setup.useCases.getReview
                .mockResolvedValueOnce(
                    createReviewWithFlags(failedReview(), createFlags({ canRestart: true }))
                )
                .mockResolvedValueOnce(createReviewWithFlags(runningAgainReview(), createFlags()));
            await setup.presenter.init(setup.params(REQUEST("restart")));

            await setup.presenter.submit();

            const conflict = setup.presenter.vm.conflict;
            expect(conflict?.title).toBe("Someone else acted first");
            expect(conflict?.message).toMatch(
                /^Someone restarted “AI tone check” at .+\. It is running again, so your restart was not saved\.$/
            );
            expect(setup.toasts.show).not.toHaveBeenCalled();
            expect(setup.onDone).not.toHaveBeenCalled();
        });

        it("appends the list note to the restart conflict on Content Reviews (R220)", async () => {
            setup.useCases.restartStep.mockRejectedValue(
                new GraphQLOperationError({
                    message: "Conflict.",
                    code: ReviewErrorCode.StepNotCurrent
                })
            );
            setup.useCases.getReview
                .mockResolvedValueOnce(
                    createReviewWithFlags(failedReview(), createFlags({ canRestart: true }))
                )
                .mockResolvedValueOnce(createReviewWithFlags(runningAgainReview(), createFlags()));
            await setup.presenter.init({
                ...setup.params(REQUEST("restart")),
                listRefreshed: true
            });

            await setup.presenter.submit();

            expect(setup.presenter.vm.conflict?.message).toMatch(
                /so your restart was not saved\. The list has been refreshed\.$/
            );
        });

        it("fails the load when the request names a step the review does not have", async () => {
            await setup.presenter.init(
                setup.params({ kind: "restart", reviewId: "review-1", stepId: "missing" })
            );

            expect(setup.presenter.vm.status).toBe("failed");
            expect(setup.presenter.vm.confirmLabel).toBe("");
        });
    });

    it("shows the running suffix in the cancel dialog of a running AI step (frame 23)", async () => {
        setup.useCases.getReview.mockResolvedValue(
            createReviewWithFlags(runningAgainReview(), createFlags({ canCancel: true }))
        );

        await setup.presenter.init(
            setup.params({ kind: "cancel", reviewId: "review-1", stepId: null })
        );

        expect(setup.presenter.vm.body).toBe(
            "Review progress is lost. Editing is unlocked, and a new request starts again from the first step. AI tone check is running and will be stopped."
        );
    });
```

Modify `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.test.tsx`: add `import { at } from "~/review/testing/at.js";` after the `createStep` import, and add after the `createUseCases` function:

```tsx
const FAILED_AT = at(10, 20);

const createFailedUseCases = () => {
    const useCases = createFakeUseCases();
    const failed = createReview({
        currentStepId: "step-1",
        steps: [
            createStep({
                title: "AI tone check",
                type: "ai",
                state: StepState.Failed,
                owner: createActor({ type: "ai" }),
                comment: "Provider unavailable: request timed out after 60 s",
                finishedOn: FAILED_AT
            })
        ]
    });
    useCases.getReview.mockResolvedValue(
        createReviewWithFlags(failed, createFlags({ canRestart: true }))
    );
    return useCases;
};
```

and add two tests inside the `describe`, before the last test:

```tsx
    it("shows the restart dialog with the failed attempt and restarts on confirm", async () => {
        const useCases = createFailedUseCases();
        renderWithContainer(
            <ReviewActionDialogs
                useCases={useCases}
                request={{ kind: "restart", reviewId: "review-1", stepId: "step-1" }}
                reviewsUrl={null}
                onDone={onDone}
                onClose={onClose}
            />,
            createContainer()
        );

        expect(await screen.findByText("Restart “AI tone check”?")).toBeTruthy();
        expect(
            screen.getByText(
                "Last attempt failed at 10:20: Provider unavailable: request timed out after 60 s. Restarting runs the step again from the beginning."
            )
        ).toBeTruthy();
        fireEvent.click(screen.getByText("Restart", { selector: "button *, button" }));

        await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
        expect(useCases.restartStep).toHaveBeenCalledWith({
            reviewId: "review-1",
            stepId: "step-1"
        });
    });

    it("collapses to Close with the restart conflict when the step is running again", async () => {
        const useCases = createFailedUseCases();
        const running = createReview({
            currentStepId: "step-1",
            steps: [
                createStep({
                    title: "AI tone check",
                    type: "ai",
                    state: StepState.InReview,
                    owner: createActor({ type: "ai" })
                })
            ]
        });
        useCases.getReview
            .mockResolvedValueOnce(
                createReviewWithFlags(
                    createReview({
                        currentStepId: "step-1",
                        steps: [
                            createStep({
                                title: "AI tone check",
                                type: "ai",
                                state: StepState.Failed,
                                owner: createActor({ type: "ai" }),
                                finishedOn: FAILED_AT
                            })
                        ]
                    }),
                    createFlags({ canRestart: true })
                )
            )
            .mockResolvedValueOnce(createReviewWithFlags(running, createFlags()));
        useCases.restartStep.mockRejectedValue(
            new GraphQLOperationError({ message: "Conflict.", code: ReviewErrorCode.InvalidState })
        );
        renderWithContainer(
            <ReviewActionDialogs
                useCases={useCases}
                request={{ kind: "restart", reviewId: "review-1", stepId: "step-1" }}
                reviewsUrl={null}
                onDone={onDone}
                onClose={onClose}
            />,
            createContainer()
        );
        await screen.findByText("Restart “AI tone check”?");

        fireEvent.click(screen.getByText("Restart", { selector: "button *, button" }));

        expect(await screen.findByText("Someone else acted first")).toBeTruthy();
        expect(
            screen.getByText(
                /Someone restarted “AI tone check” at .+\. It is running again, so your restart was not saved\./
            )
        ).toBeTruthy();
        expect(screen.getByText("Close")).toBeTruthy();
        expect(onDone).not.toHaveBeenCalled();
    });
```

Modify `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx`: add after `it("renders message, tag, meta, lock text and the actions in view model order", ...)`:

```tsx
    it("renders Restart from the actions of the view model and opens it for the failed step (R266)", () => {
        const { presenter } = renderBar(
            createViewModel({
                actions: [
                    {
                        kind: "cancel",
                        label: "Cancel review",
                        icon: "block",
                        stepId: "step-2",
                        emphasis: "ghost"
                    },
                    {
                        kind: "restart",
                        label: "Restart",
                        icon: "refresh",
                        stepId: "step-2",
                        emphasis: "primary"
                    }
                ]
            })
        );

        const labels = screen
            .getAllByRole("button")
            .map(button => button.textContent)
            .filter(text => ["Cancel review", "Restart"].includes(text ?? ""));
        expect(labels).toEqual(["Cancel review", "Restart"]);

        fireEvent.click(screen.getByText("Restart"));
        expect(presenter.openAction).toHaveBeenCalledWith("restart", "step-2");
    });

    it("renders no Restart when the view model offers none", () => {
        renderBar(createViewModel({ actions: [] }));

        expect(screen.queryByText("Restart")).toBeNull();
    });
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview/isStepRunning.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/review/presentation/actionDialog/classifyReviewActionError.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/review/presentation/actionDialog/getActionDialogCopy.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/getReviewActions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/toasts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx 2>&1 | tail -30
```

Expected: `isStepRunning.test.ts` fails with `Failed to resolve import "./isStepRunning.js"`; `classifyReviewActionError.test.ts` fails on `targetSync` (`generic` is not `targetSync`); `getActionDialogCopy.test.ts` fails (restart returns the empty base copy, cancel has no suffix); the conflict tests fail for restart (the generic text); `getReviewActions.test.ts` and `reviewListPure.test.ts` fail (no restart action); the toast tests fail (`getReviewToastText` returns `undefined` for `restarted`); the presenter tests fail (`restartStep` is never called, TargetSync is a dialog error); the dialog and bar component tests fail (no restart copy, no icon `refresh` in `REVIEW_ACTION_ICONS` so the bar throws on render).

- [ ] **Step 3: Implementation**

Create `packages/app-workflows/src/review/presentation/targetReview/isStepRunning.ts`:

```ts
import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";

/*
 * A step is running when it is in review and its owner is not a person, that is an AI or an
 * automation (R263). There is no separate `running` state on the server. Pure.
 */
export const isStepRunning = (step: ReviewStep): boolean => {
    return step.state === StepState.InReview && step.owner !== null && step.owner.type !== "user";
};
```

Create `packages/app-workflows/src/review/presentation/actionDialog/getRestartDialogBody.ts`:

```ts
import type { ReviewStep } from "~/review/domain/types.js";
import { formatTimeOfDay } from "~/review/presentation/time/formatTimeOfDay.js";

const RESTART_NOTE = "Restarting runs the step again from the beginning.";

/*
 * The body of the restart dialog (R266, R264): the end of the last attempt (the step's
 * `finishedOn`) and the reason (the step's `comment`) when they are known. Four texts, from the
 * design's editor text down to the one derived string of 8b. Pure.
 */
export const getRestartDialogBody = (step: ReviewStep | undefined): string => {
    let reason = "";
    let failedAt = "";
    if (step && step.comment !== null) {
        reason = step.comment.trim();
    }
    if (step && step.finishedOn !== null) {
        failedAt = formatTimeOfDay(new Date(step.finishedOn));
    }

    if (failedAt !== "" && reason !== "") {
        return `Last attempt failed at ${failedAt}: ${reason}. ${RESTART_NOTE}`;
    }
    if (reason !== "") {
        return `Last attempt failed: ${reason}. ${RESTART_NOTE}`;
    }
    if (failedAt !== "") {
        return `Last attempt failed at ${failedAt}. ${RESTART_NOTE}`;
    }
    return `Last attempt failed. ${RESTART_NOTE}`;
};
```

Create `packages/app-workflows/src/review/presentation/actionDialog/getCancelDialogBody.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { isStepRunning } from "../targetReview/isStepRunning.js";

const CANCEL_BODY =
    "Review progress is lost. Editing is unlocked, and a new request starts again from the first step.";

/*
 * The body of the cancel dialog (QBZ-51): the 8a text, with the design's suffix when the current
 * step is running and will be stopped (design 4c, frame 23). Pure.
 */
export const getCancelDialogBody = (review: Review): string => {
    const current = review.steps.find(step => step.id === review.currentStepId);
    if (current && isStepRunning(current)) {
        return `${CANCEL_BODY} ${current.title} is running and will be stopped.`;
    }
    return CANCEL_BODY;
};
```

Modify `packages/app-workflows/src/review/presentation/actionDialog/getActionDialogCopy.ts`.

Hunk 1, imports (one per line):

```ts
import { getCancelDialogBody } from "./getCancelDialogBody.js";
import { getRestartDialogBody } from "./getRestartDialogBody.js";
```

Hunk 2, the cancel branch and the new restart branch:

```ts
// before
    if (kind === "cancel") {
        return {
            ...base,
            title: "Cancel review?",
            body: "Review progress is lost. Editing is unlocked, and a new request starts again from the first step.",
            confirmLabel: "Cancel review",
            cancelLabel: "Keep review"
        };
    }

// after
    if (kind === "cancel") {
        return {
            ...base,
            title: "Cancel review?",
            body: getCancelDialogBody(review),
            confirmLabel: "Cancel review",
            cancelLabel: "Keep review"
        };
    }

    if (kind === "restart") {
        return {
            ...base,
            title: `Restart “${stepTitle}”?`,
            body: getRestartDialogBody(step),
            confirmLabel: "Restart"
        };
    }
```

and change its doc comment `The design copy of the five dialogs (README 6, QBZ-5, QBZ-31, QBZ-50, QBZ-51).` to `The design copy of the six dialogs (README 6, QBZ-5, QBZ-31, QBZ-50, QBZ-51, design 4c).`.

Modify `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionKind.ts`:

```ts
// before
// The step actions that open a confirmation dialog.
export type ReviewActionKind = "start" | "takeOver" | "reassign" | "approve" | "reject" | "cancel";

// after
// The step actions that open a confirmation dialog.
export type ReviewActionKind =
    | "start"
    | "takeOver"
    | "reassign"
    | "approve"
    | "reject"
    | "cancel"
    | "restart";
```

Modify `packages/app-workflows/src/review/presentation/targetReview/abstractions.ts`:

```ts
// before
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

// after
    | "approve"
    | "reject"
    | "cancel"
    | "restart";

export type TargetReviewActionIcon =
    | "send"
    | "play_arrow"
    | "check"
    | "close"
    | "front_hand"
    | "swap_horiz"
    | "block"
    | "refresh";
```

Modify `packages/app-workflows/src/review/presentation/targetReview/components/reviewBarAppearance.ts`:

```ts
// add after the BlockIcon import
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";

// before
    swap_horiz: SwapHorizIcon,
    block: BlockIcon
};

// after
    swap_horiz: SwapHorizIcon,
    block: BlockIcon,
    refresh: RefreshIcon
};
```

Modify `packages/app-workflows/src/review/presentation/targetReview/getReviewActions.ts`: change the comment `Only server flags decide what is offered (D5, D54); Restart is 8b.` to `Only server flags decide what is offered (D5, D54).` and add after the `canApprove` block (before `return actions;`):

```ts
    if (flags.canRestart) {
        actions.push({
            kind: "restart",
            label: "Restart",
            icon: "refresh",
            stepId,
            emphasis: "primary"
        });
    }
```

Modify `packages/app-workflows/src/review/presentation/reviewList/getListRowActions.ts`:

```ts
// before
 * limited to start, take over, reassign and cancel. Approve and reject are not list actions
 * (design: "Open the content to approve or reject"); request never applies to an existing review.

// after
 * limited to start, take over, reassign, cancel and restart. Approve and reject are not list
 * actions (design: "Open the content to approve or reject"); request never applies to an existing
 * review.
```

```ts
// before
            action.kind === "reassign" ||
            action.kind === "cancel"
        );

// after
            action.kind === "reassign" ||
            action.kind === "cancel" ||
            action.kind === "restart"
        );
```

Modify `packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.ts`.

Hunk 1, import (after the `getStepOwnerLabel` import):

```ts
import { isStepRunning } from "../targetReview/isStepRunning.js";
```

Hunk 2, the noun table:

```ts
// before
    reject: "rejection",
    cancel: "cancellation"
};

// after
    reject: "rejection",
    cancel: "cancellation",
    restart: "restart"
};
```

Hunk 3, the new branch, right after `const name = getStepOwnerLabel(step);`:

```ts
// before
    const name = getStepOwnerLabel(step);

    if (step.state === StepState.Approved) {

// after
    const name = getStepOwnerLabel(step);

    // R266: a restart that lost a race with another restart. The review does not store who
    // restarted, so the text says "Someone" (the design names the person).
    if (kind === "restart" && isStepRunning(step)) {
        return {
            title: TITLE,
            message: `Someone restarted “${step.title}” at ${time}. It is running again, so your ${noun} was not saved.`
        };
    }

    if (step.state === StepState.Approved) {
```

Modify `packages/app-workflows/src/review/presentation/actionDialog/classifyReviewActionError.ts`:

```ts
// before
    | "notAuthorized"
    | "notFound"
    | "generic";

// after
    | "notAuthorized"
    | "notFound"
    | "targetSync"
    | "generic";
```

```ts
// before
    if (error.code === ReviewErrorCode.NotFound) {
        return "notFound";
    }
    return "generic";

// after
    if (error.code === ReviewErrorCode.NotFound) {
        return "notFound";
    }
    // R266: the review was saved, only the content sync failed.
    if (error.code === ReviewErrorCode.TargetSync) {
        return "targetSync";
    }
    return "generic";
```

Modify `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.ts`.

Hunk 1, the submit branches:

```ts
// before
            } else if (request.kind === "cancel") {
                await useCases.cancelReview({ reviewId: request.reviewId });
            }
        } catch (error) {

// after
            } else if (request.kind === "cancel") {
                await useCases.cancelReview({ reviewId: request.reviewId });
            } else if (request.kind === "restart") {
                await useCases.restartStep({ reviewId: request.reviewId, stepId });
                toast = { kind: "restarted", stepTitle, personName: null, reviewsUrl };
            }
        } catch (error) {
```

Hunk 2, the catch block: replace the whole block (from `} catch (error) {` to the `}` that closes it, ahead of the success tail `if (token !== this.token) { return; }` and `this.toasts.show(toast);`) with:

```ts
        } catch (error) {
            if (token !== this.token) {
                return;
            }

            const errorKind = classifyReviewActionError(error);

            if (errorKind === "targetSync" && request.kind === "restart") {
                // R266: the restart was saved and only the content sync failed, so it is done.
                toast = { kind: "restarted", stepTitle, personName: null, reviewsUrl };
            } else if (errorKind === "conflict") {
                let fresh: ReviewWithFlags | null = null;
                try {
                    fresh = await useCases.getReview(request.reviewId);
                } catch {
                    fresh = null;
                }
                if (token !== this.token) {
                    return;
                }
                const now = new Date();
                const message = getConflictMessage({
                    kind: request.kind,
                    stepId: request.stepId,
                    review: fresh ? fresh.review : null,
                    now,
                    listRefreshed: params.listRefreshed === true
                });
                this.applyConflict(message.title, message.message, fresh);
                if (params.onConflict) {
                    params.onConflict();
                }
                return;
            } else if (errorKind === "validation" && error instanceof GraphQLOperationError) {
                this.applyFieldError(error.message);
                return;
            } else {
                this.applyDialogError(getActionErrorMessage(errorKind, error));
                return;
            }
        }
```

After the block the unchanged tail runs for the restart-with-`TargetSync` case: token check, `this.toasts.show(toast)`, `finishSubmit()`, `params.onDone()`.

Modify `packages/app-workflows/src/review/toasts/abstractions.ts`:

```ts
// before
export type ReviewToastKind =
    | "requested"
    | "started"
    | "tookOver"

// after
export type ReviewToastKind =
    | "requested"
    | "started"
    | "restarted"
    | "tookOver"
```

```ts
// before
// `requested` (the first step of the workflow), `started` and `rejected` name one step.
export interface StepReviewToastParams extends ReviewToastBase {
    kind: "requested" | "started" | "rejected";

// after
// `requested` (the first step of the workflow), `started`, `restarted` and `rejected` name one step.
export interface StepReviewToastParams extends ReviewToastBase {
    kind: "requested" | "started" | "restarted" | "rejected";
```

Modify `packages/app-workflows/src/review/toasts/getReviewToastText.ts`: change the doc comment line `every text has what it needs. "Restarted" is 8b and has no kind.` to `every text has what it needs.` and add the case after `started`:

```ts
        case "restarted":
            return {
                title: `Restarted “${params.stepTitle}”`,
                description: "The step is running again."
            };
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview/isStepRunning.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/review/presentation/actionDialog/classifyReviewActionError.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/review/presentation/actionDialog/getActionDialogCopy.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/getReviewActions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/toasts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx 2>&1 | tail -30
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests that cover the changed code, and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/actionDialog 2>&1 | tail -50
yarn test packages/app-workflows/src/review/presentation/targetReview 2>&1 | tail -50
yarn test packages/app-workflows/src/review/presentation/reviewList 2>&1 | tail -50
yarn test packages/app-workflows/src/review/presentation/reviewDetails 2>&1 | tail -50
yarn test packages/app-workflows/src/review/toasts 2>&1 | tail -50
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: no failures, no type errors. The details drawer and Content Reviews tests pass unchanged: their action lists come from the flags, none of which set `canRestart`. If the build reports an exhaustive `Record<ReviewActionKind, ...>` or `Record<TargetReviewActionIcon, ...>` this plan missed, add the `restart` or `refresh` entry the same way (the research found only `ACTION_NOUNS` and `REVIEW_ACTION_ICONS`).

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
git commit -m "feat(app-workflows): add the restart action to the bar, the drawer and the Content Reviews rows" \
  -m "Restart goes through the same action tables, dialog presenter, conflict message and toast as the other step actions. TargetSync counts as a successful restart. The cancel dialog warns that a running AI or automation step will be stopped." \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" \
  -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step fails and you fix something, rerun the chain from the start. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`.

**Contract notes:**
- The contract lists `getActionDialogCopy.ts` for both the restart copy and the cancel suffix; the two bodies live in two small pure files (`getRestartDialogBody.ts`, `getCancelDialogBody.ts`) because the code style allows one exported function per file. `getActionDialogCopy` calls them.
- `TargetSync` needs a classifier kind (`targetSync`) that the contract does not name; the alternative (reading `error.code` in the presenter) would bypass the one place that maps codes to behaviour.
- The restart conflict says `Someone` where the design names the restarter, and the list note follows the generic R220 position (both named under "Conflicts with design copy" above, R266).
- The restart dialog shows the end time of the last attempt even on Content Reviews, whose design text omits it; the dialog has one copy table (R266 allows this: the time is shown when the step has one).
- Checked in the consistency pass: the failed step's `finishedOn` is still set on a review read before the restart (`Review.restart` clears it only when it restarts); the dialog loads the review by id when it opens, so it always reads the failed attempt.
