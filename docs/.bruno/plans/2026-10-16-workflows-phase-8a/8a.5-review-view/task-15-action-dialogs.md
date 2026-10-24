### Task 15: Action dialogs (start, take over, approve, reject, cancel)

R202, R212, R214, R215, R220, R234, R-c, R-e, R-g, R-i, R-k, R-l; D111, D114, D135; QBZ-2, QBZ-5, QBZ-31, QBZ-37, QBZ-50, QBZ-51, QBZ-54, QBZ-93; README 6; Review Focus 6, 12. One dialog presenter and one dialog component serve the five step actions. The dialog **loads what it needs by id** (`useCases.getReview(request.reviewId)`, R234: fresh data, and the request carries only ids and strings), shows the confirmation copy of the design, submits through the matching use case, shows the own-action toast (`ReviewToasts`, R214) and calls `onDone`. Errors never become toasts (R214, R220): a **conflict code** keeps the dialog open, collapses the buttons to Close, re-reads the review so the text names who acted, and keeps a typed comment ("Your comment is kept below so you can copy it."); `Validation` shows under the comment field; `NotAuthorized` and `NotFound` and any other error are dialog-level messages. The task also mounts the dialogs inside `ReviewBar` (Task 14) from `vm.openAction`.

- **Copy** (verbatim from the design prototype `Content Review.dc.html`, README 6, QBZ-5/31/50/51):
  - Start: title `Start “{step}”?`, body `You become the owner of this step on “{title}” and it leaves the team pool.`, buttons "Cancel" / "Start".
  - Take over: title "Take over this step?", body `{Owner} is reviewing “{step}”. If you take over, you become the owner and {first name} can no longer approve or reject it.`, checkbox `Notify {Owner} that you took over` checked by default (D111, only when the previous owner is a person), buttons "Cancel" / "Take over".
  - Approve: title `Approve “{step}”`, comment label "Comment (optional)", buttons "Cancel" / "Approve"; an empty comment is sent as `null`.
  - Reject: title `Reject “{step}”`, body "Rejection is final for this revision. The requester will need to create a new revision, fix the issues and request a new review.", comment label "Comment *", counter "n / 10 min." (n = trimmed length), confirm disabled until 10 trimmed characters (`REJECT_COMMENT_MIN_LENGTH`, R215), buttons "Cancel" / "Reject".
  - Cancel: title "Cancel review?", body "Review progress is lost. Editing is unlocked, and a new request starts again from the first step.", buttons "Keep review" / "Cancel review" (QBZ-51).
  - Conflict (QBZ-2): title "Someone else acted first"; one message per cause, built by the pure `getConflictMessage`; after a cancel underneath the dialog title becomes the step name.
  - Errors: field error = the server message under the comment; `NotAuthorized` the shared `NO_ACCESS_MESSAGE` (R-i); `NotFound` "This review no longer exists."; any other failure "The server did not respond, so nothing was changed. Try again." (QBZ-37).
  - **Toasts (R-g):** each submit builds the exact `ReviewToastParams` member of its kind: `started`, `rejected` with `stepTitle`; `tookOver` with `personName` set only when notify is ticked and the previous owner is a person; `approved` with `nextStepTitle` read from the review the approval returned by the pure `getNextStepTitle` (its current step, `null` after the last step); `cancelled` with `stepTitle: null`. A step action whose step the re-read review does not have fails the load (the dialog shows the server-error text and Close only).
  - **Submitting:** a dialog that is submitting ignores a close request (`onOpenChange(false)`, Escape, the X, `dismiss()`), so the success path (toast and `onDone`) is never lost.
  - **Content Reviews (QBZ-31):** `ReviewActionDialogs` takes an optional `listRefreshed`; when true the "started first" conflict message ends "The list has been refreshed."
- **Time format** (QBZ-54): the pure `formatReviewTime(iso, now)` ("14:20", "Yesterday 14:20", "6 Oct, 14:20", "6 Oct 2025, 14:20"); Task 18 reuses it.
- **Mounting:** `ReviewActionDialogs` takes `request: ReviewActionRequest | null`; a non-null request renders `ReviewActionDialogHost`, which resolves a **new** presenter per mount (`useFeature` memoises per component instance, R212), runs `init` in an effect and `dispose` on unmount. `ReviewBar` builds the request from `vm.openAction` and `vm.reviewId` with the pure `toActionRequest`; its `onDone` is `presenter.actionDone()` (refresh + activity signal, Task 13) and `onClose` is `presenter.closeAction()`.

**Files:**
- Create: `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionKind.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionRequest.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/abstractions.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/toActionRequest.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/formatReviewTime.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/getNextStepTitle.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/classifyReviewActionError.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/getActionDialogCopy.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/feature.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialog.tsx`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogHost.tsx`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.tsx`
- Create: `packages/app-workflows/src/review/testing/renderWithContainer.tsx`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/formatReviewTime.test.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.test.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.test.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.test.tsx`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx`
- Modify: `packages/app-workflows/src/app.tsx`

**Interfaces:**
- Consumes: Task 13 (`TargetReviewOpenAction`, `getStepOwnerLabel`, `NO_ACCESS_MESSAGE`, the builders `~/review/testing/{createActor,createStep,createFlags,reviewTarget}.js`, Task 8's `createReview` and `createReviewWithFlags` from `~/review/testing/reviewFixtures.js`, `createFakeUseCases` from `fakeReviewUseCases.js`), Task 14 (`ReviewBar`, `renderWithAdminUi`, `createFakePresenter`, `createViewModel`), Task 10 (`ReviewToasts` from `~/review/toasts/abstractions.js`, `ReviewToasts.Interface.show(params)` with the `ReviewToastParams` union: `started` and `rejected` carry `stepTitle: string`, `approved` also `nextStepTitle: string | null`, `tookOver` `personName: string | null`, `cancelled` `stepTitle: null`), Task 8 (`IReviewUseCases`, `Review`, `ReviewWithFlags`, `ReviewErrorCode`, `REJECT_COMMENT_MIN_LENGTH`), Task 6 (`GraphQLOperationError`). Existing (verified): admin-ui `Dialog` (`open`, `onOpenChange`, `title`, `actions`, `loading`, `Dialog.CancelAction`, `Dialog.ConfirmAction`), `Alert`, `Textarea` (`label`, `description`, `value`, `onChange(value)`, `validation`), `Checkbox` (`label`, `checked`, `onChange(checked)`), `DiContainerProvider` (`@webiny/app`).
- Produces: `ReviewActionKind` (`"start" | "takeOver" | "approve" | "reject" | "cancel"`, Task 16 adds `"reassign"`), `ReviewActionRequest { kind; reviewId; stepId: string | null }`, `ReviewActionDialogInitParams` (with optional `listRefreshed`), `IReviewActionDialogViewModel`, `IReviewActionDialogPresenter` (use `ReviewActionDialogPresenter.Interface` / `.ViewModel` outside the declaring file, R-l), token `ReviewActionDialogPresenter` (`"Workflows/ReviewActionDialogPresenter"`, transient), `ReviewActionDialogPresenterFeature`, `ReviewActionDialogs` props `{ useCases; request; reviewsUrl; listRefreshed?; onDone; onClose }`, `getNextStepTitle`, `formatReviewTime`, `getConflictMessage`, `toActionRequest` (consumed by Tasks 16, 18, 26, 34).

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/review/testing/renderWithContainer.tsx`:

```tsx
import React from "react";
import type { RenderResult } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { renderWithAdminUi } from "./renderWithAdminUi.js";

/** Renders inside `AdminUiProvider` and a DI container, for components that call `useFeature`. */
export const renderWithContainer = (ui: React.ReactElement, container: Container): RenderResult => {
    return renderWithAdminUi(<DiContainerProvider container={container}>{ui}</DiContainerProvider>);
};
```

Create `packages/app-workflows/src/review/presentation/actionDialog/formatReviewTime.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { formatReviewTime } from "./formatReviewTime.js";

const NOW = new Date(2026, 9, 16, 15, 0);

const at = (year: number, month: number, day: number, hour: number, minute: number): string => {
    return new Date(year, month, day, hour, minute).toISOString();
};

describe("formatReviewTime (QBZ-54)", () => {
    it("shows today as the time only", () => {
        expect(formatReviewTime(at(2026, 9, 16, 14, 20), NOW)).toBe("14:20");
    });

    it("pads minutes and hours", () => {
        expect(formatReviewTime(at(2026, 9, 16, 9, 5), NOW)).toBe("09:05");
    });

    it("shows yesterday", () => {
        expect(formatReviewTime(at(2026, 9, 15, 14, 20), NOW)).toBe("Yesterday 14:20");
    });

    it("shows earlier this year with the day and month", () => {
        expect(formatReviewTime(at(2026, 9, 6, 14, 20), NOW)).toBe("6 Oct, 14:20");
    });

    it("shows older dates with the year", () => {
        expect(formatReviewTime(at(2025, 9, 6, 14, 20), NOW)).toBe("6 Oct 2025, 14:20");
    });
});
```

Create `packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getConflictMessage } from "./getConflictMessage.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";

const NOW = new Date(2026, 9, 16, 15, 0);
const WHEN = new Date(2026, 9, 16, 10, 51).toISOString();
const LUKA = createActor({ id: "user-2", displayName: "Luka Perić" });

const review = (stepOverrides = {}, reviewOverrides = {}) => {
    return createReview({
        lastChangedOn: WHEN,
        currentStepId: "step-1",
        steps: [createStep({ title: "Legal sign-off", ...stepOverrides })],
        ...reviewOverrides
    });
};

describe("getConflictMessage (QBZ-2)", () => {
    it("always uses the title 'Someone else acted first'", () => {
        const result = getConflictMessage({ kind: "approve", stepId: "step-1", review: review(), now: NOW, listRefreshed: false });
        expect(result.title).toBe("Someone else acted first");
    });

    it("names who took the step over", () => {
        const result = getConflictMessage({
            kind: "approve",
            stepId: "step-1",
            review: review({
                state: StepState.InReview,
                owner: LUKA,
                assignment: { source: "takeOver", ruleId: null, reason: null, by: LUKA }
            }),
            now: NOW,
            listRefreshed: false
        });
        expect(result.message).toBe(
            "Luka Perić took over “Legal sign-off” at 10:51, so your approval was not saved."
        );
    });

    it("tells that someone started the step from the pool first", () => {
        const result = getConflictMessage({
            kind: "start",
            stepId: "step-1",
            review: review({ state: StepState.InReview, owner: LUKA }),
            now: NOW,
            listRefreshed: false
        });
        expect(result.message).toBe(
            "Luka Perić started “Legal sign-off” at 10:51. You can still take it over."
        );
    });

    it("adds 'The list has been refreshed.' to the started-first message for Content Reviews (QBZ-31)", () => {
        const result = getConflictMessage({
            kind: "start",
            stepId: "step-1",
            review: review({ state: StepState.InReview, owner: LUKA }),
            now: NOW,
            listRefreshed: true
        });
        expect(result.message).toBe(
            "Luka Perić started “Legal sign-off” at 10:51. You can still take it over. The list has been refreshed."
        );
    });

    it("tells that the step was approved first", () => {
        const result = getConflictMessage({
            kind: "reject",
            stepId: "step-1",
            review: review({ state: StepState.Approved, owner: LUKA }),
            now: NOW,
            listRefreshed: false
        });
        expect(result.message).toBe(
            "Luka Perić approved “Legal sign-off” at 10:51, so your rejection was not saved. The review moved on to the next step."
        );
    });

    it("tells that the step was rejected first", () => {
        const result = getConflictMessage({
            kind: "approve",
            stepId: "step-1",
            review: review({ state: StepState.Rejected, owner: LUKA }),
            now: NOW,
            listRefreshed: false
        });
        expect(result.message).toBe(
            "Luka Perić rejected “Legal sign-off” at 10:51, so your approval was not saved. This revision is now rejected."
        );
    });

    it("names the operator and the new owner of a reassigned step", () => {
        const operator = createActor({ id: "user-3", displayName: "Jana Dolenc" });
        const result = getConflictMessage({
            kind: "approve",
            stepId: "step-1",
            review: review({
                state: StepState.InReview,
                owner: LUKA,
                assignment: { source: "reassign", ruleId: null, reason: null, by: operator }
            }),
            now: NOW,
            listRefreshed: false
        });
        expect(result.message).toBe(
            "Jana Dolenc reassigned “Legal sign-off” to Luka Perić at 10:51, so your approval was not saved."
        );
    });

    it("tells that the review was cancelled", () => {
        const result = getConflictMessage({
            kind: "approve",
            stepId: "step-1",
            review: review({}, { state: ReviewState.Cancelled, isActive: false }),
            now: NOW,
            listRefreshed: false
        });
        expect(result.message).toBe(
            "Someone cancelled this review at 10:51, so your approval was not saved. The revision has no review now."
        );
    });

    it("falls back to a generic text without a fresh review", () => {
        const result = getConflictMessage({ kind: "cancel", stepId: null, review: null, now: NOW, listRefreshed: false });
        expect(result.message).toBe("Someone else changed this review, so your cancellation was not saved.");
    });
});
```

Create `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { StepState } from "~/review/domain/StepState.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import { ReviewActionDialogPresenterFeature } from "./feature.js";
import type { ReviewActionDialogInitParams } from "./abstractions.js";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import type { FakeReviewUseCases } from "~/review/testing/fakeReviewUseCases.js";

const LUKA = createActor({ id: "user-2", displayName: "Luka Perić" });

const inReviewReview = () => {
    return createReview({
        currentStepId: "step-1",
        currentStepState: StepState.InReview,
        steps: [
            createStep({ id: "step-1", title: "Legal sign-off", state: StepState.InReview, owner: LUKA })
        ]
    });
};

interface Setup {
    presenter: ReturnType<typeof ReviewActionDialogPresenterFeature.resolve>["presenter"];
    useCases: FakeReviewUseCases;
    toasts: { show: ReturnType<typeof vi.fn> };
    onDone: ReturnType<typeof vi.fn>;
    onClose: ReturnType<typeof vi.fn>;
    params: (request: ReviewActionRequest) => ReviewActionDialogInitParams;
}

const createSetup = (): Setup => {
    const container = new Container();
    const toasts = { show: vi.fn() };
    container.registerInstance(ReviewToasts, toasts);
    ReviewActionDialogPresenterFeature.register(container);
    const { presenter } = ReviewActionDialogPresenterFeature.resolve(container);
    const useCases = createFakeUseCases();
    useCases.getReview.mockResolvedValue(createReviewWithFlags(inReviewReview(), createFlags()));
    const onDone = vi.fn();
    const onClose = vi.fn();
    return {
        presenter,
        useCases,
        toasts,
        onDone,
        onClose,
        params: request => ({ useCases, request, reviewsUrl: "/cms/content-reviews", onDone, onClose })
    };
};

const REQUEST = (kind: ReviewActionRequest["kind"]): ReviewActionRequest => {
    return { kind, reviewId: "review-1", stepId: "step-1" };
};

describe("ReviewActionDialogPresenter", () => {
    let setup: Setup;

    beforeEach(() => {
        setup = createSetup();
    });

    it("loads the review by id (R234) and is loading before that", async () => {
        const pending = setup.presenter.init(setup.params(REQUEST("approve")));
        expect(setup.presenter.vm.status).toBe("loading");

        await pending;

        expect(setup.useCases.getReview).toHaveBeenCalledWith("review-1");
        expect(setup.presenter.vm.status).toBe("ready");
    });

    it("fails the load with a dialog error and no confirm", async () => {
        setup.useCases.getReview.mockRejectedValue(new Error("Network."));

        await setup.presenter.init(setup.params(REQUEST("approve")));

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.dialogError).toBe(
            "The server did not respond, so nothing was changed. Try again."
        );
    });

    it("builds the start copy", async () => {
        await setup.presenter.init(setup.params(REQUEST("start")));

        const { vm } = setup.presenter;
        expect(vm.title).toBe("Start “Legal sign-off”?");
        expect(vm.body).toBe(
            "You become the owner of this step on “Spring campaign” and it leaves the team pool."
        );
        expect(vm.confirmLabel).toBe("Start");
        expect(vm.cancelLabel).toBe("Cancel");
        expect(vm.showComment).toBe(false);
        expect(vm.showNotify).toBe(false);
    });

    it("builds the take over copy with a checked notify box (D111)", async () => {
        await setup.presenter.init(setup.params(REQUEST("takeOver")));

        const { vm } = setup.presenter;
        expect(vm.title).toBe("Take over this step?");
        expect(vm.body).toBe(
            "Luka Perić is reviewing “Legal sign-off”. If you take over, you become the owner and Luka can no longer approve or reject it."
        );
        expect(vm.showNotify).toBe(true);
        expect(vm.notify).toBe(true);
        expect(vm.notifyLabel).toBe("Notify Luka Perić that you took over");
        expect(vm.confirmLabel).toBe("Take over");
    });

    it("hides the notify box when the previous owner is not a person", async () => {
        const review = createReview({
            currentStepId: "step-1",
            steps: [
                createStep({
                    title: "AI check",
                    state: StepState.InReview,
                    owner: createActor({ type: "ai", displayName: "model" })
                })
            ]
        });
        setup.useCases.getReview.mockResolvedValue(createReviewWithFlags(review));

        await setup.presenter.init(setup.params(REQUEST("takeOver")));

        expect(setup.presenter.vm.showNotify).toBe(false);
    });

    it("builds the approve copy", async () => {
        await setup.presenter.init(setup.params(REQUEST("approve")));

        const { vm } = setup.presenter;
        expect(vm.title).toBe("Approve “Legal sign-off”");
        expect(vm.showComment).toBe(true);
        expect(vm.commentLabel).toBe("Comment (optional)");
        expect(vm.commentCounter).toBeNull();
        expect(vm.confirmLabel).toBe("Approve");
    });

    it("builds the reject copy and the counter", async () => {
        await setup.presenter.init(setup.params(REQUEST("reject")));

        const { vm } = setup.presenter;
        expect(vm.title).toBe("Reject “Legal sign-off”");
        expect(vm.body).toBe(
            "Rejection is final for this revision. The requester will need to create a new revision, fix the issues and request a new review."
        );
        expect(vm.commentLabel).toBe("Comment *");
        expect(vm.commentCounter).toBe("0 / 10 min.");
        expect(vm.confirmLabel).toBe("Reject");
    });

    it("builds the cancel copy with Keep review", async () => {
        await setup.presenter.init(setup.params(REQUEST("cancel")));

        const { vm } = setup.presenter;
        expect(vm.title).toBe("Cancel review?");
        expect(vm.body).toBe(
            "Review progress is lost. Editing is unlocked, and a new request starts again from the first step."
        );
        expect(vm.cancelLabel).toBe("Keep review");
        expect(vm.confirmLabel).toBe("Cancel review");
    });

    it("blocks a reject under 10 trimmed characters and counts the trimmed text (R215)", async () => {
        await setup.presenter.init(setup.params(REQUEST("reject")));

        setup.presenter.setComment("  too short  ");
        expect(setup.presenter.vm.commentCounter).toBe("9 / 10 min.");
        expect(setup.presenter.vm.canSubmit).toBe(false);
        await setup.presenter.submit();
        expect(setup.useCases.rejectStep).not.toHaveBeenCalled();

        setup.presenter.setComment("Missing the disclaimer.");
        expect(setup.presenter.vm.canSubmit).toBe(true);
    });

    it("sends null for an approve without a comment and the trimmed comment otherwise", async () => {
        await setup.presenter.init(setup.params(REQUEST("approve")));
        await setup.presenter.submit();
        expect(setup.useCases.approveStep).toHaveBeenCalledWith({
            reviewId: "review-1",
            stepId: "step-1",
            comment: null
        });

        const second = createSetup();
        second.useCases.getReview.mockResolvedValue(
            createReviewWithFlags(inReviewReview(), createFlags())
        );
        await second.presenter.init(second.params(REQUEST("approve")));
        second.presenter.setComment("  Looks good.  ");
        await second.presenter.submit();
        expect(second.useCases.approveStep).toHaveBeenCalledWith({
            reviewId: "review-1",
            stepId: "step-1",
            comment: "Looks good."
        });
    });

    it("calls the matching use case per kind with the right arguments", async () => {
        await setup.presenter.init(setup.params(REQUEST("start")));
        await setup.presenter.submit();
        expect(setup.useCases.startStep).toHaveBeenCalledWith({ reviewId: "review-1", stepId: "step-1" });

        const cancel = createSetup();
        await cancel.presenter.init(cancel.params({ kind: "cancel", reviewId: "review-1", stepId: null }));
        await cancel.presenter.submit();
        expect(cancel.useCases.cancelReview).toHaveBeenCalledWith({ reviewId: "review-1" });

        const reject = createSetup();
        await reject.presenter.init(reject.params(REQUEST("reject")));
        reject.presenter.setComment("Missing the disclaimer.");
        await reject.presenter.submit();
        expect(reject.useCases.rejectStep).toHaveBeenCalledWith({
            reviewId: "review-1",
            stepId: "step-1",
            comment: "Missing the disclaimer."
        });
    });

    it("sends notifyPreviousOwner from the checkbox", async () => {
        await setup.presenter.init(setup.params(REQUEST("takeOver")));
        setup.presenter.setNotify(false);
        await setup.presenter.submit();

        expect(setup.useCases.takeOverStep).toHaveBeenCalledWith({
            reviewId: "review-1",
            stepId: "step-1",
            notifyPreviousOwner: false
        });
    });

    it("shows the own-action toast and calls onDone after success (R214)", async () => {
        await setup.presenter.init(setup.params(REQUEST("start")));

        await setup.presenter.submit();

        expect(setup.toasts.show).toHaveBeenCalledWith({
            kind: "started",
            stepTitle: "Legal sign-off",
            personName: null,
            reviewsUrl: "/cms/content-reviews"
        });
        expect(setup.onDone).toHaveBeenCalledTimes(1);
        expect(setup.presenter.vm.submitting).toBe(false);
    });

    it("shows the approve toast with the next step from the returned review (R-g)", async () => {
        setup.useCases.approveStep.mockResolvedValue(
            createReview({
                currentStepId: "step-2",
                steps: [
                    createStep({ id: "step-1", title: "Legal sign-off", state: StepState.Approved }),
                    createStep({ id: "step-2", title: "Legal check", state: StepState.Awaiting })
                ]
            })
        );
        await setup.presenter.init(setup.params(REQUEST("approve")));

        await setup.presenter.submit();

        expect(setup.toasts.show).toHaveBeenCalledWith({
            kind: "approved",
            stepTitle: "Legal sign-off",
            personName: null,
            nextStepTitle: "Legal check",
            reviewsUrl: "/cms/content-reviews"
        });
    });

    it("passes nextStepTitle null when the approval finished the review", async () => {
        setup.useCases.approveStep.mockResolvedValue(
            createReview({ state: "approved", currentStepId: null })
        );
        await setup.presenter.init(setup.params(REQUEST("approve")));

        await setup.presenter.submit();

        expect(setup.toasts.show).toHaveBeenCalledWith(
            expect.objectContaining({ kind: "approved", nextStepTitle: null })
        );
    });

    it("shows the reject and cancel toasts with the exact members (R-g)", async () => {
        await setup.presenter.init(setup.params(REQUEST("reject")));
        setup.presenter.setComment("Missing the disclaimer.");
        await setup.presenter.submit();
        expect(setup.toasts.show).toHaveBeenCalledWith({
            kind: "rejected",
            stepTitle: "Legal sign-off",
            personName: null,
            reviewsUrl: "/cms/content-reviews"
        });

        const cancel = createSetup();
        await cancel.presenter.init(cancel.params({ kind: "cancel", reviewId: "review-1", stepId: null }));
        await cancel.presenter.submit();
        expect(cancel.toasts.show).toHaveBeenCalledWith({
            kind: "cancelled",
            stepTitle: null,
            personName: null,
            reviewsUrl: "/cms/content-reviews"
        });
    });

    it("fails the load when a step action names a step the review does not have", async () => {
        await setup.presenter.init(
            setup.params({ kind: "approve", reviewId: "review-1", stepId: null })
        );

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.canSubmit).toBe(false);
    });

    it("keeps the dialog open while submitting, so the success path is not lost", async () => {
        let release: () => void = () => undefined;
        setup.useCases.startStep.mockReturnValue(
            new Promise(resolve => {
                release = () => resolve(createReview());
            })
        );
        await setup.presenter.init(setup.params(REQUEST("start")));

        const pending = setup.presenter.submit();
        setup.presenter.dismiss();
        expect(setup.onClose).not.toHaveBeenCalled();

        release();
        await pending;
        expect(setup.onDone).toHaveBeenCalledTimes(1);
    });

    it("names the notified person in the take over toast only when notify is ticked", async () => {
        await setup.presenter.init(setup.params(REQUEST("takeOver")));
        await setup.presenter.submit();
        expect(setup.toasts.show).toHaveBeenCalledWith({
            kind: "tookOver",
            stepTitle: "Legal sign-off",
            personName: "Luka Perić",
            reviewsUrl: "/cms/content-reviews"
        });

        const quiet = createSetup();
        await quiet.presenter.init(quiet.params(REQUEST("takeOver")));
        quiet.presenter.setNotify(false);
        await quiet.presenter.submit();
        expect(quiet.toasts.show).toHaveBeenCalledWith({
            kind: "tookOver",
            stepTitle: "Legal sign-off",
            personName: null,
            reviewsUrl: "/cms/content-reviews"
        });
    });

    it("does not submit twice while submitting", async () => {
        let release: () => void = () => undefined;
        setup.useCases.startStep.mockReturnValue(
            new Promise(resolve => {
                release = () => resolve(createReview());
            })
        );
        await setup.presenter.init(setup.params(REQUEST("start")));

        const first = setup.presenter.submit();
        const second = setup.presenter.submit();
        release();
        await first;
        await second;

        expect(setup.useCases.startStep).toHaveBeenCalledTimes(1);
    });

    const CONFLICT_CODES = [
        ReviewErrorCode.StepNotCurrent,
        ReviewErrorCode.InvalidState,
        ReviewErrorCode.NotOwner,
        ReviewErrorCode.AlreadyOwner,
        ReviewErrorCode.StepNotTakeable,
        ReviewErrorCode.StepNotReassignable,
        ReviewErrorCode.ReassignTargetInvalid,
        ReviewErrorCode.AlreadyActive
    ];

    it.each(CONFLICT_CODES)(
        "treats %s as a conflict: stays open, re-reads the review, collapses to Close (Review Focus 6)",
        async code => {
            setup.useCases.approveStep.mockRejectedValue(
                new GraphQLOperationError({ message: "Conflict.", code })
            );
            await setup.presenter.init(setup.params(REQUEST("approve")));
            setup.presenter.setComment("My comment");

            await setup.presenter.submit();

            const { vm } = setup.presenter;
            expect(setup.useCases.getReview).toHaveBeenCalledTimes(2);
            expect(vm.conflict?.title).toBe("Someone else acted first");
            expect(vm.conflict?.commentKept).toBe(true);
            expect(vm.comment).toBe("My comment");
            expect(vm.submitting).toBe(false);
            expect(setup.toasts.show).not.toHaveBeenCalled();
            expect(setup.onDone).not.toHaveBeenCalled();
        }
    );

    it("passes listRefreshed from Content Reviews into the started-first message (QBZ-31)", async () => {
        setup.useCases.startStep.mockRejectedValue(
            new GraphQLOperationError({ message: "Conflict.", code: ReviewErrorCode.StepNotCurrent })
        );
        await setup.presenter.init({ ...setup.params(REQUEST("start")), listRefreshed: true });

        await setup.presenter.submit();

        expect(setup.presenter.vm.conflict?.message).toContain("The list has been refreshed.");
    });

    it("does not claim a kept comment when none was typed", async () => {
        setup.useCases.startStep.mockRejectedValue(
            new GraphQLOperationError({ message: "Conflict.", code: ReviewErrorCode.StepNotCurrent })
        );
        await setup.presenter.init(setup.params(REQUEST("start")));

        await setup.presenter.submit();

        expect(setup.presenter.vm.conflict?.commentKept).toBe(false);
    });

    it("still reports a conflict when the re-read fails", async () => {
        setup.useCases.approveStep.mockRejectedValue(
            new GraphQLOperationError({ message: "Conflict.", code: ReviewErrorCode.NotOwner })
        );
        await setup.presenter.init(setup.params(REQUEST("approve")));
        setup.useCases.getReview.mockRejectedValue(new Error("Network."));

        await setup.presenter.submit();

        expect(setup.presenter.vm.conflict?.message).toBe(
            "Someone else changed this review, so your approval was not saved."
        );
    });

    it("shows a Validation error under the comment field", async () => {
        setup.useCases.rejectStep.mockRejectedValue(
            new GraphQLOperationError({
                message: "Use 500 characters or fewer.",
                code: ReviewErrorCode.Validation
            })
        );
        await setup.presenter.init(setup.params(REQUEST("reject")));
        setup.presenter.setComment("Missing the disclaimer.");

        await setup.presenter.submit();

        expect(setup.presenter.vm.fieldError).toBe("Use 500 characters or fewer.");
        expect(setup.presenter.vm.dialogError).toBeNull();
        expect(setup.presenter.vm.conflict).toBeNull();

        setup.presenter.setComment("Missing the disclaimer!");
        expect(setup.presenter.vm.fieldError).toBeNull();
    });

    it("shows dialog-level messages for NotAuthorized and NotFound", async () => {
        setup.useCases.startStep.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );
        await setup.presenter.init(setup.params(REQUEST("start")));
        await setup.presenter.submit();
        expect(setup.presenter.vm.dialogError).toBe(NO_ACCESS_MESSAGE);

        const missing = createSetup();
        missing.useCases.startStep.mockRejectedValue(
            new GraphQLOperationError({ message: "Gone.", code: ReviewErrorCode.NotFound })
        );
        await missing.presenter.init(missing.params(REQUEST("start")));
        await missing.presenter.submit();
        expect(missing.presenter.vm.dialogError).toBe("This review no longer exists.");
    });

    it("keeps the dialog open with the transport error text and allows a retry", async () => {
        setup.useCases.startStep.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.init(setup.params(REQUEST("start")));

        await setup.presenter.submit();

        expect(setup.presenter.vm.dialogError).toBe(
            "The server did not respond, so nothing was changed. Try again."
        );
        expect(setup.onDone).not.toHaveBeenCalled();

        await setup.presenter.submit();
        expect(setup.presenter.vm.dialogError).toBeNull();
        expect(setup.onDone).toHaveBeenCalledTimes(1);
    });

    it("uses the step name as the title after the review was cancelled underneath", async () => {
        setup.useCases.approveStep.mockRejectedValue(
            new GraphQLOperationError({ message: "Conflict.", code: ReviewErrorCode.InvalidState })
        );
        await setup.presenter.init(setup.params(REQUEST("approve")));
        setup.useCases.getReview.mockResolvedValue(
            createReviewWithFlags(
                createReview({ state: "cancelled", isActive: false, steps: inReviewReview().steps })
            )
        );

        await setup.presenter.submit();

        expect(setup.presenter.vm.title).toBe("Legal sign-off");
    });

    it("calls onClose on dismiss", async () => {
        await setup.presenter.init(setup.params(REQUEST("approve")));

        setup.presenter.dismiss();

        expect(setup.onClose).toHaveBeenCalledTimes(1);
    });

    it("resets on dispose and is transient", async () => {
        await setup.presenter.init(setup.params(REQUEST("reject")));
        setup.presenter.setComment("Some comment here.");

        setup.presenter.dispose();

        expect(setup.presenter.vm.status).toBe("loading");
        expect(setup.presenter.vm.comment).toBe("");
        expect(setup.presenter.vm.title).toBe("");
    });
});
```

Create `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.test.tsx`:

```tsx
import React from "react";
import { beforeEach } from "vitest";
import type { Mock } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { StepState } from "~/review/domain/StepState.js";
import { ReviewActionDialogPresenterFeature } from "../feature.js";
import { ReviewActionDialogs } from "./ReviewActionDialogs.js";
import { ReviewBar } from "~/review/presentation/targetReview/components/ReviewBar.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createFakePresenter } from "~/review/testing/targetReviewFakes.js";
import { createViewModel } from "~/review/testing/targetReviewFakes.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";

const createContainer = () => {
    const container = new Container();
    container.registerInstance(ReviewToasts, { show: vi.fn() });
    ReviewActionDialogPresenterFeature.register(container);
    return container;
};

const createUseCases = () => {
    const useCases = createFakeUseCases();
    const review = createReview({
        currentStepId: "step-1",
        steps: [
            createStep({
                title: "Legal sign-off",
                state: StepState.InReview,
                owner: createActor({ id: "user-2", displayName: "Luka Perić" })
            })
        ]
    });
    useCases.getReview.mockResolvedValue(createReviewWithFlags(review, createFlags()));
    return useCases;
};

describe("ReviewActionDialogs", () => {
    let onDone: Mock<() => void>;
    let onClose: Mock<() => void>;

    beforeEach(() => {
        onDone = vi.fn<() => void>();
        onClose = vi.fn<() => void>();
    });

    it("renders nothing without a request", () => {
        renderWithContainer(
            <ReviewActionDialogs
                useCases={createUseCases()}
                request={null}
                reviewsUrl={null}
                onDone={onDone}
                onClose={onClose}
            />,
            createContainer()
        );

        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("loads the review and shows the reject dialog with the counter and a disabled confirm", async () => {
        renderWithContainer(
            <ReviewActionDialogs
                useCases={createUseCases()}
                request={{ kind: "reject", reviewId: "review-1", stepId: "step-1" }}
                reviewsUrl={null}
                onDone={onDone}
                onClose={onClose}
            />,
            createContainer()
        );

        expect(await screen.findByText("Reject “Legal sign-off”")).toBeTruthy();
        expect(screen.getByText("0 / 10 min.")).toBeTruthy();
        expect(screen.getByText("Reject").closest("button")?.getAttribute("aria-disabled")).toBe("true");
    });

    it("submits an approve and calls onDone", async () => {
        const useCases = createUseCases();
        renderWithContainer(
            <ReviewActionDialogs
                useCases={useCases}
                request={{ kind: "approve", reviewId: "review-1", stepId: "step-1" }}
                reviewsUrl={null}
                onDone={onDone}
                onClose={onClose}
            />,
            createContainer()
        );
        await screen.findByText("Approve “Legal sign-off”");

        fireEvent.click(screen.getByText("Approve", { selector: "button *, button" }));

        await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
        expect(useCases.approveStep).toHaveBeenCalledTimes(1);
    });

    it("collapses to Close after a conflict", async () => {
        const useCases = createUseCases();
        const { GraphQLOperationError } = await import("@webiny/app/errors/index.js");
        useCases.startStep.mockRejectedValue(
            new GraphQLOperationError({ message: "Conflict.", code: "Workflows/Review/StepNotCurrent" })
        );
        renderWithContainer(
            <ReviewActionDialogs
                useCases={useCases}
                request={{ kind: "start", reviewId: "review-1", stepId: "step-1" }}
                reviewsUrl={null}
                onDone={onDone}
                onClose={onClose}
            />,
            createContainer()
        );
        await screen.findByText("Start “Legal sign-off”?");

        fireEvent.click(screen.getByText("Start", { selector: "button *, button" }));

        expect(await screen.findByText("Someone else acted first")).toBeTruthy();
        expect(screen.getByText("Close")).toBeTruthy();
        expect(screen.queryByText("Cancel")).toBeNull();
        fireEvent.click(screen.getByText("Close"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("is mounted by the review bar from the open action and closes through the presenter", async () => {
        const presenter = createFakePresenter(
            createViewModel({ openAction: { kind: "approve", stepId: "step-1" }, reviewId: "review-1" })
        );
        renderWithContainer(
            <ReviewBar
                presenter={presenter}
                useCases={createUseCases()}
                reviewsUrl={null}
            />,
            createContainer()
        );

        expect(await screen.findByText("Approve “Legal sign-off”")).toBeTruthy();
        fireEvent.click(screen.getByText("Cancel"));
        expect(presenter.closeAction).toHaveBeenCalledTimes(1);
    });
});
```

Extend Task 10's `packages/app-workflows/src/app.test.tsx` (Task 13 added the "WorkflowsAdminApp review view" `describe`): import the token and add one line to each of its three tests.

```tsx
import { ReviewActionDialogPresenter } from "~/review/presentation/actionDialog/abstractions.js";
```

```tsx
// in "registers the review view presenters when the flag is on"
        expect(container.resolve(ReviewActionDialogPresenter)).toBeDefined();

// in "registers the presenters transient: every resolve is a new instance (R212)"
        const firstDialog = container.resolve(ReviewActionDialogPresenter);
        const secondDialog = container.resolve(ReviewActionDialogPresenter);
        expect(firstDialog).not.toBe(secondDialog);

// in "registers no review view presenter when the flag is off (R211)"
        expect(() => container.resolve(ReviewActionDialogPresenter)).toThrow();
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/presentation/actionDialog/formatReviewTime.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: each fails with `Failed to resolve import` for the missing modules. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionKind.ts`:

```ts
/** The step actions that open a confirmation dialog (Task 16 adds "reassign"). */
export type ReviewActionKind = "start" | "takeOver" | "approve" | "reject" | "cancel";
```

Create `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionRequest.ts`:

```ts
import type { ReviewActionKind } from "./ReviewActionKind.js";

/** What a dialog needs: ids and strings only. The dialog loads the review itself (R234). */
export interface ReviewActionRequest {
    kind: ReviewActionKind;
    reviewId: string;
    stepId: string | null;
}
```

Create `packages/app-workflows/src/review/presentation/actionDialog/toActionRequest.ts`:

```ts
import type { TargetReviewOpenAction } from "../targetReview/abstractions.js";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";

/** The bar's open action as a dialog request; "request" has its own dialog (Task 17). */
export const toActionRequest = (
    openAction: TargetReviewOpenAction | null,
    reviewId: string | null
): ReviewActionRequest | null => {
    if (openAction === null || reviewId === null || openAction.kind === "request") {
        return null;
    }
    // "reassign" joins ReviewActionKind in Task 16, which removes these three lines.
    if (openAction.kind === "reassign") {
        return null;
    }
    return { kind: openAction.kind, reviewId, stepId: openAction.stepId };
};
```

Create `packages/app-workflows/src/review/presentation/actionDialog/formatReviewTime.ts`:

```ts
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 24 * 60 * 60 * 1000;

const pad = (value: number): string => {
    return String(value).padStart(2, "0");
};

const startOfDay = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

/**
 * QBZ-54, in the viewer's timezone, 24-hour: "14:20" today, "Yesterday 14:20", "6 Oct, 14:20"
 * this year, "6 Oct 2025, 14:20" older. `now` is a parameter so the function stays pure.
 */
export const formatReviewTime = (iso: string, now: Date): string => {
    const date = new Date(iso);
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const time = `${hours}:${minutes}`;
    const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY);

    if (days === 0) {
        return time;
    }
    if (days === 1) {
        return `Yesterday ${time}`;
    }

    const day = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
    if (date.getFullYear() === now.getFullYear()) {
        return `${day}, ${time}`;
    }
    return `${day} ${date.getFullYear()}, ${time}`;
};
```

Create `packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { getStepOwnerLabel } from "../targetReview/getStepOwnerLabel.js";
import { formatReviewTime } from "./formatReviewTime.js";
import type { ReviewActionKind } from "./ReviewActionKind.js";

export interface ConflictMessageParams {
    kind: ReviewActionKind;
    stepId: string | null;
    /** The review re-read after the conflict; `null` when the re-read failed. */
    review: Review | null;
    now: Date;
    /** Content Reviews refreshes its list behind a conflicting Start (QBZ-31). */
    listRefreshed: boolean;
}

export interface ConflictMessage {
    title: string;
    message: string;
}

const TITLE = "Someone else acted first";

/** `{action}` of QBZ-2: the user's action as a noun. */
const ACTION_NOUNS: Record<ReviewActionKind, string> = {
    start: "start",
    takeOver: "take-over",
    approve: "approval",
    reject: "rejection",
    cancel: "cancellation"
};

/**
 * One message per cause (QBZ-2), read from the re-read review. Pure. The time is the review's
 * `lastChangedOn`; a review that cannot be re-read gets a generic text.
 */
export const getConflictMessage = (params: ConflictMessageParams): ConflictMessage => {
    const { kind, stepId, review, now, listRefreshed } = params;
    const noun = ACTION_NOUNS[kind];

    if (review === null) {
        return { title: TITLE, message: `Someone else changed this review, so your ${noun} was not saved.` };
    }

    const time = formatReviewTime(review.lastChangedOn, now);

    if (review.state === ReviewState.Cancelled || !review.isActive) {
        return {
            title: TITLE,
            message: `Someone cancelled this review at ${time}, so your ${noun} was not saved. The revision has no review now.`
        };
    }

    const step = review.steps.find(item => item.id === stepId);
    if (!step) {
        return { title: TITLE, message: `Someone else changed this review, so your ${noun} was not saved.` };
    }

    const name = getStepOwnerLabel(step);

    if (step.state === StepState.Approved) {
        return {
            title: TITLE,
            message: `${name} approved “${step.title}” at ${time}, so your ${noun} was not saved. The review moved on to the next step.`
        };
    }
    if (step.state === StepState.Rejected) {
        return {
            title: TITLE,
            message: `${name} rejected “${step.title}” at ${time}, so your ${noun} was not saved. This revision is now rejected.`
        };
    }

    const assignment = step.assignment;
    if (assignment && assignment.source === "reassign") {
        const operator = assignment.by ? assignment.by.displayName : "Someone";
        return {
            title: TITLE,
            message: `${operator} reassigned “${step.title}” to ${name} at ${time}, so your ${noun} was not saved.`
        };
    }
    if (kind === "start" && step.owner !== null) {
        let started = `${name} started “${step.title}” at ${time}. You can still take it over.`;
        if (listRefreshed) {
            started = `${started} The list has been refreshed.`;
        }
        return { title: TITLE, message: started };
    }
    if (assignment && assignment.source === "takeOver") {
        return {
            title: TITLE,
            message: `${name} took over “${step.title}” at ${time}, so your ${noun} was not saved.`
        };
    }

    return {
        title: TITLE,
        message: `Someone else changed “${step.title}” at ${time}, so your ${noun} was not saved.`
    };
};
```

Create `packages/app-workflows/src/review/presentation/actionDialog/classifyReviewActionError.ts`:

```ts
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";

export type ReviewActionErrorKind =
    | "conflict"
    | "validation"
    | "notAuthorized"
    | "notFound"
    | "generic";

const CONFLICT_CODES: string[] = [
    ReviewErrorCode.StepNotCurrent,
    ReviewErrorCode.InvalidState,
    ReviewErrorCode.NotOwner,
    ReviewErrorCode.AlreadyOwner,
    ReviewErrorCode.StepNotTakeable,
    ReviewErrorCode.StepNotReassignable,
    ReviewErrorCode.ReassignTargetInvalid,
    ReviewErrorCode.AlreadyActive
];

/** R220: how a failed review action maps to dialog behaviour, by error code. Pure. */
export const classifyReviewActionError = (error: unknown): ReviewActionErrorKind => {
    if (!(error instanceof GraphQLOperationError) || error.code === null) {
        return "generic";
    }
    if (CONFLICT_CODES.includes(error.code)) {
        return "conflict";
    }
    if (error.code === ReviewErrorCode.Validation) {
        return "validation";
    }
    if (error.code === ReviewErrorCode.NotAuthorized) {
        return "notAuthorized";
    }
    if (error.code === ReviewErrorCode.NotFound) {
        return "notFound";
    }
    return "generic";
};
```

Create `packages/app-workflows/src/review/presentation/actionDialog/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";

export interface ReviewActionDialogInitParams {
    useCases: IReviewUseCases;
    request: ReviewActionRequest;
    reviewsUrl: string | null;
    /** Content Reviews refreshes its list behind a conflicting Start; the message says so (QBZ-31). */
    listRefreshed?: boolean;
    onDone: () => void;
    onClose: () => void;
}

export interface ReviewActionConflictVm {
    title: string;
    message: string;
    commentKept: boolean;
}

/** Render-ready (R234). */
export interface IReviewActionDialogViewModel {
    status: "loading" | "ready" | "failed";
    title: string;
    body: string;
    showComment: boolean;
    commentLabel: string;
    comment: string;
    commentCounter: string | null;
    showNotify: boolean;
    notify: boolean;
    notifyLabel: string | null;
    confirmLabel: string;
    cancelLabel: string;
    canSubmit: boolean;
    submitting: boolean;
    fieldError: string | null;
    dialogError: string | null;
    conflict: ReviewActionConflictVm | null;
}

export interface IReviewActionDialogPresenter {
    readonly vm: IReviewActionDialogViewModel;
    init(params: ReviewActionDialogInitParams): Promise<void>;
    setComment(comment: string): void;
    setNotify(notify: boolean): void;
    submit(): Promise<void>;
    dismiss(): void;
    dispose(): void;
}

export const ReviewActionDialogPresenter = createAbstraction<IReviewActionDialogPresenter>(
    "Workflows/ReviewActionDialogPresenter"
);

export namespace ReviewActionDialogPresenter {
    export type Interface = IReviewActionDialogPresenter;
    export type ViewModel = IReviewActionDialogViewModel;
}
```

Create `packages/app-workflows/src/review/presentation/actionDialog/getNextStepTitle.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";

/**
 * The title of the step that is next after an approval, from the review the approval returned:
 * its current step, or `null` when that was the last step (QBZ-93: "Next: {step}." or "All steps
 * approved."). Pure.
 */
export const getNextStepTitle = (review: Review): string | null => {
    if (review.state === ReviewState.Approved || review.currentStepId === null) {
        return null;
    }
    const next = review.steps.find(step => step.id === review.currentStepId);
    if (!next) {
        return null;
    }
    return next.title;
};
```

Create `packages/app-workflows/src/review/presentation/actionDialog/getActionDialogCopy.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import { REJECT_COMMENT_MIN_LENGTH } from "~/review/domain/constants.js";
import { getStepOwnerLabel } from "../targetReview/getStepOwnerLabel.js";
import type { ReviewActionKind } from "./ReviewActionKind.js";

export interface ActionDialogCopyParams {
    kind: ReviewActionKind;
    review: Review;
    stepId: string | null;
    comment: string;
}

export interface ActionDialogCopy {
    title: string;
    body: string;
    showComment: boolean;
    commentLabel: string;
    commentCounter: string | null;
    showNotify: boolean;
    notifyLabel: string | null;
    confirmLabel: string;
    cancelLabel: string;
    canSubmit: boolean;
}

/** The design copy of the five dialogs (README 6, QBZ-5, QBZ-31, QBZ-50, QBZ-51). Pure. */
export const getActionDialogCopy = (params: ActionDialogCopyParams): ActionDialogCopy => {
    const { kind, review, stepId, comment } = params;
    const step = review.steps.find(item => item.id === stepId);
    const stepTitle = step ? step.title : "";
    const base: ActionDialogCopy = {
        title: "",
        body: "",
        showComment: false,
        commentLabel: "",
        commentCounter: null,
        showNotify: false,
        notifyLabel: null,
        confirmLabel: "",
        cancelLabel: "Cancel",
        canSubmit: true
    };

    if (kind === "start") {
        return {
            ...base,
            title: `Start “${stepTitle}”?`,
            body: `You become the owner of this step on “${review.title}” and it leaves the team pool.`,
            confirmLabel: "Start"
        };
    }

    if (kind === "takeOver") {
        const owner = step ? getStepOwnerLabel(step) : "";
        const firstName = owner.split(" ")[0];
        const ownerIsPerson = step !== undefined && step.owner !== null && step.owner.type === "user";
        let notifyLabel: string | null = null;
        if (ownerIsPerson) {
            notifyLabel = `Notify ${owner} that you took over`;
        }
        return {
            ...base,
            title: "Take over this step?",
            body: `${owner} is reviewing “${stepTitle}”. If you take over, you become the owner and ${firstName} can no longer approve or reject it.`,
            showNotify: ownerIsPerson,
            notifyLabel,
            confirmLabel: "Take over"
        };
    }

    if (kind === "approve") {
        return {
            ...base,
            title: `Approve “${stepTitle}”`,
            showComment: true,
            commentLabel: "Comment (optional)",
            confirmLabel: "Approve"
        };
    }

    if (kind === "reject") {
        const length = comment.trim().length;
        return {
            ...base,
            title: `Reject “${stepTitle}”`,
            body: "Rejection is final for this revision. The requester will need to create a new revision, fix the issues and request a new review.",
            showComment: true,
            commentLabel: "Comment *",
            commentCounter: `${length} / ${REJECT_COMMENT_MIN_LENGTH} min.`,
            confirmLabel: "Reject",
            canSubmit: length >= REJECT_COMMENT_MIN_LENGTH
        };
    }

    if (kind === "cancel") {
        return {
            ...base,
            title: "Cancel review?",
            body: "Review progress is lost. Editing is unlocked, and a new request starts again from the first step.",
            confirmLabel: "Cancel review",
            cancelLabel: "Keep review"
        };
    }

    // "reassign" has its own presenter (Task 16) and never reaches this table.
    return base;
};
```

Create `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import type { ReviewToastParams } from "~/review/toasts/abstractions.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { Review } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewActionDialogPresenter as Abstraction } from "./abstractions.js";
import type { ReviewActionConflictVm } from "./abstractions.js";
import type { ReviewActionDialogInitParams } from "./abstractions.js";
import { getActionDialogCopy } from "./getActionDialogCopy.js";
import { getConflictMessage } from "./getConflictMessage.js";
import { getNextStepTitle } from "./getNextStepTitle.js";
import { classifyReviewActionError } from "./classifyReviewActionError.js";

const GENERIC_ERROR = "The server did not respond, so nothing was changed. Try again.";

class ReviewActionDialogPresenterImpl implements Abstraction.Interface {
    private params: ReviewActionDialogInitParams | null = null;
    private review: ReviewWithFlags | null = null;
    private status: "loading" | "ready" | "failed" = "loading";
    private comment = "";
    private notify = true;
    private submitting = false;
    private fieldError: string | null = null;
    private dialogError: string | null = null;
    private conflict: ReviewActionConflictVm | null = null;
    private titleOverride: string | null = null;
    private token = 0;

    constructor(private toasts: ReviewToasts.Interface) {
        makeAutoObservable<
            ReviewActionDialogPresenterImpl,
            "toasts" | "token" | "params" | "review"
        >(this, {
            toasts: false,
            token: false,
            params: observableRef,
            review: observableRef
        });
    }

    get vm(): Abstraction.ViewModel {
        const params = this.params;
        const review = this.review;
        if (!params || !review || this.status !== "ready") {
            return {
                status: this.status,
                title: "",
                body: "",
                showComment: false,
                commentLabel: "",
                comment: this.comment,
                commentCounter: null,
                showNotify: false,
                notify: this.notify,
                notifyLabel: null,
                confirmLabel: "",
                cancelLabel: "Cancel",
                canSubmit: false,
                submitting: this.submitting,
                fieldError: this.fieldError,
                dialogError: this.dialogError,
                conflict: this.conflict
            };
        }

        const copy = getActionDialogCopy({
            kind: params.request.kind,
            review: review.review,
            stepId: params.request.stepId,
            comment: this.comment
        });
        let title = copy.title;
        if (this.titleOverride !== null) {
            title = this.titleOverride;
        }

        return {
            status: this.status,
            title,
            body: copy.body,
            showComment: copy.showComment,
            commentLabel: copy.commentLabel,
            comment: this.comment,
            commentCounter: copy.commentCounter,
            showNotify: copy.showNotify,
            notify: this.notify,
            notifyLabel: copy.notifyLabel,
            confirmLabel: copy.confirmLabel,
            cancelLabel: copy.cancelLabel,
            canSubmit: copy.canSubmit && !this.submitting && this.conflict === null,
            submitting: this.submitting,
            fieldError: this.fieldError,
            dialogError: this.dialogError,
            conflict: this.conflict
        };
    }

    async init(params: ReviewActionDialogInitParams): Promise<void> {
        const token = this.begin(params);

        try {
            const loaded = await params.useCases.getReview(params.request.reviewId);
            if (token !== this.token) {
                return;
            }
            const hasStep = loaded.review.steps.some(item => item.id === params.request.stepId);
            if (params.request.kind !== "cancel" && !hasStep) {
                this.applyLoadFailure();
                return;
            }
            this.applyLoaded(loaded);
        } catch {
            if (token !== this.token) {
                return;
            }
            this.applyLoadFailure();
        }
    }

    setComment(comment: string): void {
        this.comment = comment;
        this.fieldError = null;
    }

    setNotify(notify: boolean): void {
        this.notify = notify;
    }

    async submit(): Promise<void> {
        const params = this.params;
        const loaded = this.review;
        if (!params || !loaded || this.status !== "ready" || !this.vm.canSubmit) {
            return;
        }

        const { useCases, request } = params;
        const stepId = request.stepId ?? "";
        const step = loaded.review.steps.find(item => item.id === request.stepId);
        const stepTitle = step ? step.title : "";
        const reviewsUrl = params.reviewsUrl;
        const comment = this.comment.trim();
        const owner = step ? step.owner : null;
        let notifyName: string | null = null;
        if (request.kind === "takeOver" && this.notify && owner !== null && owner.type === "user") {
            notifyName = owner.displayName;
        }
        const token = this.token;
        let toast: ReviewToastParams = {
            kind: "cancelled",
            stepTitle: null,
            personName: null,
            reviewsUrl
        };

        this.startSubmit();

        try {
            if (request.kind === "start") {
                await useCases.startStep({ reviewId: request.reviewId, stepId });
                toast = { kind: "started", stepTitle, personName: null, reviewsUrl };
            } else if (request.kind === "takeOver") {
                await useCases.takeOverStep({
                    reviewId: request.reviewId,
                    stepId,
                    notifyPreviousOwner: this.notify
                });
                toast = { kind: "tookOver", stepTitle, personName: notifyName, reviewsUrl };
            } else if (request.kind === "approve") {
                const approved = await useCases.approveStep({
                    reviewId: request.reviewId,
                    stepId,
                    comment: comment === "" ? null : comment
                });
                const nextStepTitle = getNextStepTitle(approved);
                toast = { kind: "approved", stepTitle, personName: null, nextStepTitle, reviewsUrl };
            } else if (request.kind === "reject") {
                await useCases.rejectStep({ reviewId: request.reviewId, stepId, comment });
                toast = { kind: "rejected", stepTitle, personName: null, reviewsUrl };
            } else if (request.kind === "cancel") {
                await useCases.cancelReview({ reviewId: request.reviewId });
            }
        } catch (error) {
            if (token !== this.token) {
                return;
            }

            const errorKind = classifyReviewActionError(error);

            if (errorKind === "conflict") {
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
                return;
            }

            if (errorKind === "validation" && error instanceof GraphQLOperationError) {
                this.applyFieldError(error.message);
                return;
            }
            if (errorKind === "notAuthorized") {
                this.applyDialogError(NO_ACCESS_MESSAGE);
                return;
            }
            if (errorKind === "notFound") {
                this.applyDialogError("This review no longer exists.");
                return;
            }
            this.applyDialogError(GENERIC_ERROR);
            return;
        }

        if (token !== this.token) {
            return;
        }

        this.toasts.show(toast);
        this.finishSubmit();
        params.onDone();
    }

    dismiss(): void {
        // A dialog that is submitting stays open: closing it would lose the success path.
        if (this.params && !this.submitting) {
            this.params.onClose();
        }
    }

    dispose(): void {
        this.token += 1;
        this.params = null;
        this.review = null;
        this.status = "loading";
        this.comment = "";
        this.notify = true;
        this.submitting = false;
        this.fieldError = null;
        this.dialogError = null;
        this.conflict = null;
        this.titleOverride = null;
    }

    private begin(params: ReviewActionDialogInitParams): number {
        this.token += 1;
        this.params = params;
        this.review = null;
        this.status = "loading";
        this.comment = "";
        this.notify = true;
        this.submitting = false;
        this.fieldError = null;
        this.dialogError = null;
        this.conflict = null;
        this.titleOverride = null;
        return this.token;
    }

    private applyLoaded(loaded: ReviewWithFlags): void {
        this.review = loaded;
        this.status = "ready";
    }

    private applyLoadFailure(): void {
        this.status = "failed";
        this.dialogError = GENERIC_ERROR;
    }

    private startSubmit(): void {
        this.submitting = true;
        this.fieldError = null;
        this.dialogError = null;
    }

    private finishSubmit(): void {
        this.submitting = false;
    }

    private applyConflict(title: string, message: string, fresh: ReviewWithFlags | null): void {
        this.submitting = false;
        this.conflict = { title, message, commentKept: this.comment.trim() !== "" };
        if (fresh) {
            this.review = fresh;
            const cancelled: Review = fresh.review;
            if (cancelled.state === ReviewState.Cancelled || !cancelled.isActive) {
                const step = cancelled.steps.find(item => item.id === this.params?.request.stepId);
                if (step) {
                    this.titleOverride = step.title;
                }
            }
        }
    }

    private applyFieldError(message: string): void {
        this.submitting = false;
        this.fieldError = message;
    }

    private applyDialogError(message: string): void {
        this.submitting = false;
        this.dialogError = message;
    }
}

export const ReviewActionDialogPresenter = Abstraction.createImplementation({
    implementation: ReviewActionDialogPresenterImpl,
    dependencies: [ReviewToasts]
});
```

Create `packages/app-workflows/src/review/presentation/actionDialog/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ReviewActionDialogPresenter as Abstraction } from "./abstractions.js";
import { ReviewActionDialogPresenter } from "./ReviewActionDialogPresenter.js";

export const ReviewActionDialogPresenterFeature = createFeature({
    name: "Workflows/ReviewActionDialogPresenter",
    register(container) {
        // Transient (R212): one instance per mounted dialog.
        container.register(ReviewActionDialogPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
```

Create `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialog.tsx`:

```tsx
import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert } from "@webiny/admin-ui";
import { Checkbox } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { Textarea } from "@webiny/admin-ui";
import type { ReviewActionDialogPresenter } from "../abstractions.js";

export interface ReviewActionDialogProps {
    presenter: ReviewActionDialogPresenter.Interface;
}

/** One dialog for the five step actions, driven entirely by the presenter's view model. */
export const ReviewActionDialog = createReactiveComponent(function ReviewActionDialog(
    props: ReviewActionDialogProps
) {
    const { presenter } = props;
    const { vm } = presenter;
    const collapsed = vm.conflict !== null || vm.status === "failed";

    let actions = (
        <>
            <Dialog.CancelAction text={vm.cancelLabel} />
            <Dialog.ConfirmAction
                text={vm.confirmLabel}
                disabled={!vm.canSubmit}
                onClick={() => presenter.submit()}
            />
        </>
    );
    if (collapsed) {
        actions = <Dialog.CancelAction text={"Close"} />;
    }

    let validation;
    if (vm.fieldError !== null) {
        validation = { isValid: false, message: vm.fieldError };
    }

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open && !vm.submitting) {
                    presenter.dismiss();
                }
            }}
            title={vm.title}
            loading={vm.status === "loading" || vm.submitting}
            actions={actions}
        >
            <div className={"flex flex-col gap-md"}>
                {vm.conflict ? (
                    <Alert type={"warning"} variant={"subtle"}>
                        <div className={"font-semibold"}>{vm.conflict.title}</div>
                        <div>{vm.conflict.message}</div>
                        {vm.conflict.commentKept ? (
                            <div>{"Your comment is kept below so you can copy it."}</div>
                        ) : null}
                    </Alert>
                ) : null}
                {vm.dialogError ? (
                    <Alert type={"danger"} variant={"subtle"}>
                        {vm.dialogError}
                    </Alert>
                ) : null}
                {vm.body ? <Text size={"md"}>{vm.body}</Text> : null}
                {vm.showComment ? (
                    <Textarea
                        label={vm.commentLabel}
                        description={vm.commentCounter}
                        value={vm.comment}
                        onChange={value => presenter.setComment(value)}
                        disabled={vm.conflict === null ? vm.submitting : false}
                        validation={validation}
                    />
                ) : null}
                {vm.showNotify && vm.conflict === null ? (
                    <Checkbox
                        label={vm.notifyLabel}
                        checked={vm.notify}
                        onChange={checked => presenter.setNotify(checked)}
                    />
                ) : null}
            </div>
        </Dialog>
    );
});
```

Create `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogHost.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { ReviewActionDialogPresenterFeature } from "../feature.js";
import type { ReviewActionRequest } from "../ReviewActionRequest.js";
import { ReviewActionDialog } from "./ReviewActionDialog.js";

export interface ReviewActionDialogHostProps {
    useCases: IReviewUseCases;
    request: ReviewActionRequest;
    reviewsUrl: string | null;
    listRefreshed?: boolean;
    onDone: () => void;
    onClose: () => void;
}

/** One presenter per mounted dialog (transient, R212): init on mount, dispose on unmount. */
export const ReviewActionDialogHost = (props: ReviewActionDialogHostProps) => {
    const { useCases, request, reviewsUrl, listRefreshed, onDone, onClose } = props;
    const { presenter } = useFeature(ReviewActionDialogPresenterFeature);

    useEffect(() => {
        presenter.init({ useCases, request, reviewsUrl, listRefreshed, onDone, onClose });
        return () => presenter.dispose();
    }, [presenter, request.kind, request.reviewId, request.stepId]);

    return <ReviewActionDialog presenter={presenter} />;
};
```

Create `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.tsx`:

```tsx
import React from "react";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewActionRequest } from "../ReviewActionRequest.js";
import { ReviewActionDialogHost } from "./ReviewActionDialogHost.js";

export interface ReviewActionDialogsProps {
    useCases: IReviewUseCases;
    request: ReviewActionRequest | null;
    reviewsUrl: string | null;
    /** Set by Content Reviews, which refreshes its list behind a conflicting Start (QBZ-31). */
    listRefreshed?: boolean;
    onDone: () => void;
    onClose: () => void;
}

/** Mounts the dialog of the requested action; nothing without a request. */
export const ReviewActionDialogs = (props: ReviewActionDialogsProps) => {
    const { request } = props;
    if (request === null) {
        return null;
    }

    const key = `${request.kind}:${request.reviewId}:${request.stepId}`;
    return <ReviewActionDialogHost key={key} {...props} request={request} />;
};
```

Modify `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.tsx`. Add imports after the `ReviewProgress` import:

```tsx
import { ReviewActionDialogs } from "../../actionDialog/components/ReviewActionDialogs.js";
import { toActionRequest } from "../../actionDialog/toActionRequest.js";
```

and destructure `useCases` and `reviewsUrl`:

```tsx
// before
    const { presenter, onOpenDetails } = props;
// after
    const { presenter, useCases, reviewsUrl, onOpenDetails } = props;
```

Wrap the returned card in a fragment and mount the dialogs after it:

```tsx
// before
    return (
        <div
            data-role={"review-bar"}
// after
    const request = toActionRequest(vm.openAction, vm.reviewId);

    return (
        <>
        <div
            data-role={"review-bar"}
```

```tsx
// before (the end of the component)
            ) : null}
        </div>
    );
});
// after
            ) : null}
        </div>
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
```

(`yarn format:fix` re-indents the fragment.)

Modify `packages/app-workflows/src/app.tsx`: import and register (after `TargetReviewPresenterFeature`):

```tsx
import { ReviewActionDialogPresenterFeature } from "~/review/presentation/actionDialog/feature.js";
```

```tsx
            <RegisterFeature feature={TargetReviewPresenterFeature} />
            <RegisterFeature feature={ReviewActionDialogPresenterFeature} />
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/presentation/actionDialog/formatReviewTime.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: PASS. Component test notes to check on the first run: `screen.getByText("Approve", { selector: "button *, button" })` must match the confirm button (the dialog title "Approve “Legal sign-off”" does not equal "Approve"); if two matches, scope with `within(screen.getByRole("dialog"))`.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/actionDialog/formatReviewTime.test.ts packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.test.ts packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.test.ts packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.test.tsx packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass (Task 14's `ReviewBar.test.tsx` still passes: without an open action `ReviewActionDialogs` renders nothing and needs no container), no TypeScript errors (R-e: `yarn build -p @webiny/app-workflows` is the type check; co-located tests are included, see Task 13 Step 5).

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
git commit -m "feat(app-workflows): add the review action dialogs" -m "One dialog presenter and component serve start, take over, approve, reject and cancel. The dialog loads the review by id, shows the design copy, submits through the use cases, shows the own-action toast and, on a conflict code, stays open with the cause, a kept comment and a Close button. ReviewBar mounts the dialogs from its open action." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **One generic dialog component** instead of "per-kind dialog components": the five dialogs differ only in copy and in two fields, which the presenter's view model already carries, so one `ReviewActionDialog` avoids five near-identical files. The dialog is a plain admin-ui `Dialog` mounted by `ReviewActionDialogHost` (no named-dialog registration); Task 34's warning dialog is a separate named dialog.
- **Additive view model field `canSubmit`** (the contract VM has none): the reject confirm is disabled until 10 trimmed characters, and a submitting or conflicted dialog cannot submit.
- The conflict `{time}` is the re-read review's `lastChangedOn` (the step carries no event time of its own); the "Start from the pool first" text names the current owner. QBZ-2 "{operator} reassigned ... to {name}" reads the operator from `step.assignment.by`; a conflict whose cause cannot be told from the re-read review gets "Someone else changed “{step}” at {time}, so your {action} was not saved."
- Take over notify label follows the design prototype `Notify {Owner} that you took over`; README 6 only abbreviates the body, the full body text is taken from the prototype.
- Size: large (twelve source files, four test files).
