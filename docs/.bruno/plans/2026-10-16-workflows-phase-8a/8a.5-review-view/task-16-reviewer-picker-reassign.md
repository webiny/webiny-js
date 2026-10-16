### Task 16: `ReviewerPicker` and the reassign dialog

R209, R212, R214, R220, R230, R234, R-c, R-e, R-g, R-i, R-k, R-l; D72, D97, D111; QBZ-6, QBZ-34, QBZ-78, QBZ-80, QBZ-85, QBZ-93; README 5, 6, 9. A small picker over admin-ui `AutoComplete` (Q8, generalised in 9b) and the Reassign dialog built on it. Candidates arrive unpaged from `listReviewStepCandidates`, so the picker filters client-side. Excluded people are listed disabled as "{name} (Unavailable[: reason])" (the server sends `excludedReason` only to viewers who may see it, D97); the current owner is disabled as "{name} (Current owner)". A rejecting load shows "Could not load results." with Retry (QBZ-6). The Reassign dialog loads the review by id (R234), then the candidates through a **private** `ReviewerPickerPresenter` (non-VM accessor `getPickerPresenter()`, R234); nobody eligible shows only "Nobody else is eligible to review this step." and Close (QBZ-34); submit calls `reassignStep`, then the toast "Reassigned “{step}” to {name}" (R214, R-g: the `reassigned` member with `stepTitle: string` and `personName: string`); a dialog that is submitting ignores a close request so the success path is not lost; errors go through the Task 15 `classifyReviewActionError`.

- **Copy:** title `Reassign “{step}”`; picker placeholder "Search reviewers by name"; hint "The previous owner (if any) and the new owner are notified."; buttons "Cancel" / "Reassign" (disabled until a person is chosen); conflict text per QBZ-2 with the noun "reassignment".
- **Mounting:** `ReviewActionKind` gains `"reassign"`; `ReviewActionDialogs` renders `ReassignDialogHost` for it; `toActionRequest` stops dropping it.

**Files:**
- Create: `packages/app-workflows/src/review/presentation/reviewerPicker/abstractions.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewerPicker/getPickerOptions.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewerPicker/ReviewerPickerPresenter.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewerPicker/ReviewerPickerFactory.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewerPicker/feature.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewerPicker/components/ReviewerPicker.tsx`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/reassignAbstractions.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/ReassignDialogPresenter.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/reassignFeature.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/components/ReassignDialog.tsx`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/components/ReassignDialogHost.tsx`
- Create: `packages/app-workflows/src/review/presentation/reviewerPicker/ReviewerPickerPresenter.test.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewerPicker/components/ReviewerPicker.test.tsx`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/ReassignDialogPresenter.test.ts`
- Create: `packages/app-workflows/src/review/presentation/actionDialog/components/ReassignDialog.test.tsx`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionKind.ts`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/toActionRequest.ts`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.ts`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialogs.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx`
- Modify: `packages/app-workflows/src/app.tsx`
- Modify: `packages/app-workflows/__tests__/setup/setupDom.ts`

**Interfaces:**
- Consumes: Task 15 (`ReviewActionKind`, `ReviewActionRequest`, `ReviewActionDialogs`, `classifyReviewActionError`, `getConflictMessage`, `ReviewActionConflictVm`, `NO_ACCESS_MESSAGE` from Task 13), Task 14 (`renderWithAdminUi`, test helpers), Task 13 builders and Task 8's `createReview`/`createReviewWithFlags`, Task 10 (`ReviewToasts`, kind `reassigned`), Task 8 (`StepCandidate`, `IReviewUseCases.listReviewStepCandidates/reassignStep/getReview`), Task 6. Existing (verified in `packages/admin-ui/src/AutoComplete/primitives/AutoCompletePrimitive.tsx`): `AutoComplete` props `options` (`{ label, value, disabled? }`), `value`, `loading`, `loadingMessage`, `emptyMessage`, `placeholder`, `onValueSearch`, `onValueChange`, `label`, `description`.
- Produces: `ReviewerPickerInitParams { load: () => Promise<StepCandidate[]>; currentOwnerId: string | null; selectedId: string | null }`; VM `{ options: ReviewerPickerOptionVm[]; value: string | null; loading; error: string | null; query; emptyMessage; eligibleCount }` (`eligibleCount` is additive); presenter `{ vm; init; search(query); select(id); retry(): Promise<void>; dispose() }`; token `ReviewerPickerPresenter` (`"Workflows/ReviewerPickerPresenter"`, transient); `ReviewerPickerPresenterFeature`; `ReviewerPicker` props `{ presenter; label; hint? }`; `ReassignDialogPresenter` (`"Workflows/ReassignDialogPresenter"`, transient), `ReassignDialogPresenterFeature`, `IReassignDialogPresenter` with `getPickerPresenter()`; `ReviewActionKind` gains `"reassign"`. Consumed by Tasks 17, 26.

**Test runner note:** admin package, `yarn test <path>` only.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/review/presentation/reviewerPicker/ReviewerPickerPresenter.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ReviewerPickerPresenterFeature } from "./feature.js";
import { ReviewerPickerFactory } from "./ReviewerPickerFactory.js";
import type { ReviewerPickerInitParams } from "./abstractions.js";
import type { StepCandidate } from "~/review/domain/types.js";

const CANDIDATES: StepCandidate[] = [
    { id: "u1", displayName: "Ivan Horvat", excluded: false, excludedReason: null },
    { id: "u2", displayName: "Luka Perić", excluded: false, excludedReason: null },
    { id: "u3", displayName: "Petra Novak", excluded: true, excludedReason: "on leave" },
    { id: "u4", displayName: "Hana Radić", excluded: true, excludedReason: null }
];

const createPresenter = () => {
    const container = new Container();
    ReviewerPickerPresenterFeature.register(container);
    return ReviewerPickerPresenterFeature.resolve(container).presenter;
};

const params = (overrides: Partial<ReviewerPickerInitParams> = {}): ReviewerPickerInitParams => {
    return {
        load: vi.fn().mockResolvedValue(CANDIDATES),
        currentOwnerId: null,
        selectedId: null,
        ...overrides
    };
};

describe("ReviewerPickerPresenter", () => {
    let presenter: ReturnType<typeof createPresenter>;

    beforeEach(() => {
        presenter = createPresenter();
    });

    it("is loading until the candidates arrive", async () => {
        const pending = presenter.init(params());
        expect(presenter.vm.loading).toBe(true);

        await pending;

        expect(presenter.vm.loading).toBe(false);
        expect(presenter.vm.error).toBeNull();
    });

    it("lists excluded people as disabled 'Unavailable', with the reason only when sent (D97)", async () => {
        await presenter.init(params());

        expect(presenter.vm.options).toEqual([
            { label: "Ivan Horvat", value: "u1", disabled: false },
            { label: "Luka Perić", value: "u2", disabled: false },
            { label: "Petra Novak (Unavailable: on leave)", value: "u3", disabled: true },
            { label: "Hana Radić (Unavailable)", value: "u4", disabled: true }
        ]);
        expect(presenter.vm.eligibleCount).toBe(2);
    });

    it("lists the current owner as disabled 'Current owner' (R209)", async () => {
        await presenter.init(params({ currentOwnerId: "u2" }));

        expect(presenter.vm.options[1]).toEqual({
            label: "Luka Perić (Current owner)",
            value: "u2",
            disabled: true
        });
        expect(presenter.vm.eligibleCount).toBe(1);
    });

    it("filters client-side by name, case-insensitively", async () => {
        await presenter.init(params());

        presenter.search("ivan");

        expect(presenter.vm.options.map(option => option.value)).toEqual(["u1"]);
        expect(presenter.vm.query).toBe("ivan");
    });

    it("explains an empty search result", async () => {
        await presenter.init(params());

        presenter.search("zzz");

        expect(presenter.vm.options).toEqual([]);
        expect(presenter.vm.emptyMessage).toBe("Nothing matches “zzz”.");
    });

    it("selects a selectable person and ignores disabled and unknown ids", async () => {
        await presenter.init(params({ currentOwnerId: "u2" }));

        presenter.select("u1");
        expect(presenter.vm.value).toBe("u1");

        presenter.select("u2");
        presenter.select("u3");
        presenter.select("nobody");
        expect(presenter.vm.value).toBe("u1");
    });

    it("keeps a preselected person", async () => {
        await presenter.init(params({ selectedId: "u2" }));

        expect(presenter.vm.value).toBe("u2");
    });

    it("shows 'Could not load results.' when the load rejects and retries with the selection kept", async () => {
        const load = vi.fn().mockRejectedValueOnce(new Error("Network.")).mockResolvedValue(CANDIDATES);
        await presenter.init(params({ load, selectedId: "u1" }));

        expect(presenter.vm.error).toBe("Could not load results.");
        expect(presenter.vm.options).toEqual([]);

        await presenter.retry();

        expect(load).toHaveBeenCalledTimes(2);
        expect(presenter.vm.error).toBeNull();
        expect(presenter.vm.value).toBe("u1");
        expect(presenter.vm.options).toHaveLength(4);
    });

    it("ignores a late response after dispose and resets", async () => {
        let release: (value: StepCandidate[]) => void = () => undefined;
        const load = vi.fn().mockReturnValue(
            new Promise<StepCandidate[]>(resolve => {
                release = resolve;
            })
        );
        const pending = presenter.init(params({ load }));

        presenter.dispose();
        release(CANDIDATES);
        await pending;

        expect(presenter.vm.options).toEqual([]);
        expect(presenter.vm.loading).toBe(false);
    });

    it("hands out a new presenter per factory call", () => {
        const container = new Container();
        ReviewerPickerPresenterFeature.register(container);
        const factory = container.resolve(ReviewerPickerFactory);
        expect(factory.create()).not.toBe(factory.create());
    });

    it("is transient", () => {
        const container = new Container();
        ReviewerPickerPresenterFeature.register(container);
        const first = ReviewerPickerPresenterFeature.resolve(container).presenter;
        const second = ReviewerPickerPresenterFeature.resolve(container).presenter;
        expect(first).not.toBe(second);
    });
});
```

Create `packages/app-workflows/src/review/presentation/reviewerPicker/components/ReviewerPicker.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { ReviewerPickerPresenterFeature } from "../feature.js";
import { ReviewerPicker } from "./ReviewerPicker.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import type { StepCandidate } from "~/review/domain/types.js";

const CANDIDATES: StepCandidate[] = [
    { id: "u1", displayName: "Ivan Horvat", excluded: false, excludedReason: null },
    { id: "u2", displayName: "Petra Novak", excluded: true, excludedReason: null }
];

const createPresenter = () => {
    const container = new Container();
    ReviewerPickerPresenterFeature.register(container);
    return ReviewerPickerPresenterFeature.resolve(container).presenter;
};

describe("ReviewerPicker", () => {
    it("renders the label and the hint", async () => {
        const presenter = createPresenter();
        await presenter.init({
            load: vi.fn().mockResolvedValue(CANDIDATES),
            currentOwnerId: null,
            selectedId: null
        });

        renderWithAdminUi(
            <ReviewerPicker presenter={presenter} label={"Reviewer"} hint={"Picks are checked again."} />
        );

        expect(screen.getAllByText("Reviewer").length).toBeGreaterThan(0);
        expect(screen.getByText("Picks are checked again.")).toBeTruthy();
    });

    it("shows the load error with Retry that reloads", async () => {
        const presenter = createPresenter();
        const load = vi.fn().mockRejectedValueOnce(new Error("Network.")).mockResolvedValue(CANDIDATES);
        await presenter.init({ load, currentOwnerId: null, selectedId: null });

        renderWithAdminUi(<ReviewerPicker presenter={presenter} label={"Reviewer"} />);

        expect(screen.getByText("Could not load results.")).toBeTruthy();
        fireEvent.click(screen.getByText("Retry"));
        await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    });

    it("offers the options with the disabled one marked Unavailable", async () => {
        const presenter = createPresenter();
        await presenter.init({
            load: vi.fn().mockResolvedValue(CANDIDATES),
            currentOwnerId: null,
            selectedId: null
        });

        renderWithAdminUi(<ReviewerPicker presenter={presenter} label={"Reviewer"} />);
        const input = screen.getByRole("combobox");
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: "ArrowDown" });

        expect(await screen.findByText("Ivan Horvat")).toBeTruthy();
        expect(screen.getByText("Petra Novak (Unavailable)")).toBeTruthy();
    });
});
```

Create `packages/app-workflows/src/review/presentation/actionDialog/ReassignDialogPresenter.test.ts`:

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
import type { StepCandidate } from "~/review/domain/types.js";
import { ReviewerPickerPresenterFeature } from "../reviewerPicker/feature.js";
import { ReassignDialogPresenterFeature } from "./reassignFeature.js";
import type { ReassignDialogInitParams } from "./reassignAbstractions.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import type { FakeReviewUseCases } from "~/review/testing/fakeReviewUseCases.js";

const LUKA = createActor({ id: "user-2", displayName: "Luka Perić" });

const CANDIDATES: StepCandidate[] = [
    { id: "user-2", displayName: "Luka Perić", excluded: false, excludedReason: null },
    { id: "user-3", displayName: "Ivan Horvat", excluded: false, excludedReason: null },
    { id: "user-4", displayName: "Petra Novak", excluded: true, excludedReason: null }
];

interface Setup {
    presenter: ReturnType<typeof ReassignDialogPresenterFeature.resolve>["presenter"];
    useCases: FakeReviewUseCases;
    toasts: { show: ReturnType<typeof vi.fn> };
    onDone: ReturnType<typeof vi.fn>;
    onClose: ReturnType<typeof vi.fn>;
    params: () => ReassignDialogInitParams;
}

const createSetup = (): Setup => {
    const container = new Container();
    const toasts = { show: vi.fn() };
    container.registerInstance(ReviewToasts, toasts);
    ReviewerPickerPresenterFeature.register(container);
    ReassignDialogPresenterFeature.register(container);
    const { presenter } = ReassignDialogPresenterFeature.resolve(container);
    const useCases = createFakeUseCases();
    const review = createReview({
        currentStepId: "step-1",
        steps: [createStep({ id: "step-1", title: "Legal sign-off", state: StepState.InReview, owner: LUKA })]
    });
    useCases.getReview.mockResolvedValue(createReviewWithFlags(review, createFlags({ canReassign: true })));
    useCases.listReviewStepCandidates.mockResolvedValue(CANDIDATES);
    const onDone = vi.fn();
    const onClose = vi.fn();
    return {
        presenter,
        useCases,
        toasts,
        onDone,
        onClose,
        params: () => ({
            useCases,
            request: { kind: "reassign", reviewId: "review-1", stepId: "step-1" },
            reviewsUrl: "/cms/content-reviews",
            onDone,
            onClose
        })
    };
};

describe("ReassignDialogPresenter", () => {
    let setup: Setup;

    beforeEach(() => {
        setup = createSetup();
    });

    it("loads the review by id, then the candidates of the step (R230, R234)", async () => {
        const pending = setup.presenter.init(setup.params());
        expect(setup.presenter.vm.status).toBe("loading");

        await pending;

        expect(setup.useCases.getReview).toHaveBeenCalledWith("review-1");
        expect(setup.useCases.listReviewStepCandidates).toHaveBeenCalledWith({
            reviewId: "review-1",
            stepId: "step-1"
        });
        const { vm } = setup.presenter;
        expect(vm.status).toBe("ready");
        expect(vm.title).toBe("Reassign “Legal sign-off”");
        expect(vm.hint).toBe("The previous owner (if any) and the new owner are notified.");
        expect(vm.confirmLabel).toBe("Reassign");
        expect(vm.cancelLabel).toBe("Cancel");
        expect(vm.nobodyEligible).toBe(false);
    });

    it("marks the current owner and excluded people disabled in the private picker", async () => {
        await setup.presenter.init(setup.params());

        const picker = setup.presenter.getPickerPresenter();
        expect(picker.vm.options).toEqual([
            { label: "Luka Perić (Current owner)", value: "user-2", disabled: true },
            { label: "Ivan Horvat", value: "user-3", disabled: false },
            { label: "Petra Novak (Unavailable)", value: "user-4", disabled: true }
        ]);
    });

    it("keeps the confirm disabled until a person is chosen", async () => {
        await setup.presenter.init(setup.params());
        expect(setup.presenter.vm.canSubmit).toBe(false);

        setup.presenter.getPickerPresenter().select("user-3");

        expect(setup.presenter.vm.canSubmit).toBe(true);
    });

    it("shows only the message and Close when nobody is eligible (QBZ-34)", async () => {
        setup.useCases.listReviewStepCandidates.mockResolvedValue([
            { id: "user-2", displayName: "Luka Perić", excluded: false, excludedReason: null }
        ]);

        await setup.presenter.init(setup.params());

        const { vm } = setup.presenter;
        expect(vm.nobodyEligible).toBe(true);
        expect(vm.message).toBe("Nobody else is eligible to review this step.");
        expect(vm.hint).toBe("");
        expect(vm.cancelLabel).toBe("Close");
        expect(vm.canSubmit).toBe(false);
    });

    it("reassigns, shows the toast with the new owner's name and calls onDone", async () => {
        await setup.presenter.init(setup.params());
        setup.presenter.getPickerPresenter().select("user-3");

        await setup.presenter.submit();

        expect(setup.useCases.reassignStep).toHaveBeenCalledWith({
            reviewId: "review-1",
            stepId: "step-1",
            userId: "user-3"
        });
        expect(setup.toasts.show).toHaveBeenCalledWith({
            kind: "reassigned",
            stepTitle: "Legal sign-off",
            personName: "Ivan Horvat",
            reviewsUrl: "/cms/content-reviews"
        });
        expect(setup.onDone).toHaveBeenCalledTimes(1);
    });

    it("collapses to Close on a conflict and names who acted (R220)", async () => {
        setup.useCases.reassignStep.mockRejectedValue(
            new GraphQLOperationError({ message: "Conflict.", code: ReviewErrorCode.StepNotReassignable })
        );
        await setup.presenter.init(setup.params());
        setup.presenter.getPickerPresenter().select("user-3");

        await setup.presenter.submit();

        const { vm } = setup.presenter;
        expect(vm.conflict?.title).toBe("Someone else acted first");
        expect(vm.cancelLabel).toBe("Close");
        expect(vm.canSubmit).toBe(false);
        expect(setup.useCases.getReview).toHaveBeenCalledTimes(2);
        expect(setup.toasts.show).not.toHaveBeenCalled();
    });

    it("shows a Validation message as the field error and a transport error as the dialog error", async () => {
        setup.useCases.reassignStep.mockRejectedValueOnce(
            new GraphQLOperationError({ message: "Pick someone else.", code: ReviewErrorCode.Validation })
        );
        await setup.presenter.init(setup.params());
        setup.presenter.getPickerPresenter().select("user-3");

        await setup.presenter.submit();
        expect(setup.presenter.vm.fieldError).toBe("Pick someone else.");

        setup.useCases.reassignStep.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.submit();
        expect(setup.presenter.vm.dialogError).toBe(
            "The server did not respond, so nothing was changed. Try again."
        );
        expect(setup.presenter.vm.fieldError).toBeNull();
        expect(setup.onDone).not.toHaveBeenCalled();
    });

    it("fails the load with a dialog error", async () => {
        setup.useCases.getReview.mockRejectedValue(new Error("Network."));

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.dialogError).toBe(
            "The server did not respond, so nothing was changed. Try again."
        );
        expect(setup.presenter.vm.cancelLabel).toBe("Close");
    });

    it("fails the load when the named step is not in the review (R244, no invented title)", async () => {
        await setup.presenter.init({
            ...setup.params(),
            request: { kind: "reassign", reviewId: "review-1", stepId: "step-unknown" }
        });

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.useCases.listReviewStepCandidates).not.toHaveBeenCalled();
        expect(setup.presenter.vm.cancelLabel).toBe("Close");
    });

    it("keeps the dialog open while submitting", async () => {
        let release: () => void = () => undefined;
        setup.useCases.reassignStep.mockReturnValue(
            new Promise(resolve => {
                release = () => resolve(createReview());
            })
        );
        await setup.presenter.init(setup.params());
        setup.presenter.getPickerPresenter().select("user-3");

        const pending = setup.presenter.submit();
        setup.presenter.dismiss();
        expect(setup.onClose).not.toHaveBeenCalled();

        release();
        await pending;
        expect(setup.onDone).toHaveBeenCalledTimes(1);
    });

    it("shows the shared no-access message for NotAuthorized", async () => {
        setup.useCases.reassignStep.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );
        await setup.presenter.init(setup.params());
        setup.presenter.getPickerPresenter().select("user-3");

        await setup.presenter.submit();

        expect(setup.presenter.vm.dialogError).toBe(NO_ACCESS_MESSAGE);
    });

    it("calls onClose on dismiss and resets on dispose", async () => {
        await setup.presenter.init(setup.params());
        setup.presenter.getPickerPresenter().select("user-3");

        setup.presenter.dismiss();
        expect(setup.onClose).toHaveBeenCalledTimes(1);

        setup.presenter.dispose();
        expect(setup.presenter.vm.status).toBe("loading");
        expect(setup.presenter.getPickerPresenter().vm.value).toBeNull();
    });
});
```

Create `packages/app-workflows/src/review/presentation/actionDialog/components/ReassignDialog.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { StepState } from "~/review/domain/StepState.js";
import { ReviewerPickerPresenterFeature } from "../../reviewerPicker/feature.js";
import { ReassignDialogPresenterFeature } from "../reassignFeature.js";
import { ReviewActionDialogs } from "./ReviewActionDialogs.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";

const createContainer = () => {
    const container = new Container();
    container.registerInstance(ReviewToasts, { show: vi.fn() });
    ReviewerPickerPresenterFeature.register(container);
    ReassignDialogPresenterFeature.register(container);
    return container;
};

describe("ReassignDialog through ReviewActionDialogs", () => {
    it("shows the nobody-eligible message and only Close", async () => {
        const useCases = createFakeUseCases();
        const owner = createActor({ id: "user-2", displayName: "Luka Perić" });
        useCases.getReview.mockResolvedValue(
            createReviewWithFlags(
                createReview({
                    steps: [createStep({ title: "Legal sign-off", state: StepState.InReview, owner })]
                }),
                createFlags({ canReassign: true })
            )
        );
        useCases.listReviewStepCandidates.mockResolvedValue([
            { id: "user-2", displayName: "Luka Perić", excluded: false, excludedReason: null }
        ]);

        renderWithContainer(
            <ReviewActionDialogs
                useCases={useCases}
                request={{ kind: "reassign", reviewId: "review-1", stepId: "step-1" }}
                reviewsUrl={null}
                onDone={vi.fn()}
                onClose={vi.fn()}
            />,
            createContainer()
        );

        expect(await screen.findByText("Reassign “Legal sign-off”")).toBeTruthy();
        expect(await screen.findByText("Nobody else is eligible to review this step.")).toBeTruthy();
        expect(screen.getByText("Close")).toBeTruthy();
        expect(screen.queryByText("Reassign")).toBeNull();
        expect(screen.queryByText("The previous owner (if any) and the new owner are notified.")).toBeNull();
    });

    it("shows the picker, the hint and a disabled Reassign when people are eligible", async () => {
        const useCases = createFakeUseCases();
        const owner = createActor({ id: "user-2", displayName: "Luka Perić" });
        useCases.getReview.mockResolvedValue(
            createReviewWithFlags(
                createReview({
                    steps: [createStep({ title: "Legal sign-off", state: StepState.InReview, owner })]
                }),
                createFlags({ canReassign: true })
            )
        );
        useCases.listReviewStepCandidates.mockResolvedValue([
            { id: "user-3", displayName: "Ivan Horvat", excluded: false, excludedReason: null }
        ]);

        renderWithContainer(
            <ReviewActionDialogs
                useCases={useCases}
                request={{ kind: "reassign", reviewId: "review-1", stepId: "step-1" }}
                reviewsUrl={null}
                onDone={vi.fn()}
                onClose={vi.fn()}
            />,
            createContainer()
        );

        expect(
            await screen.findByText("The previous owner (if any) and the new owner are notified.")
        ).toBeTruthy();
        const confirm = screen.getByText("Reassign", { selector: "button *, button" });
        expect(confirm.closest("button")?.getAttribute("aria-disabled")).toBe("true");
    });
});
```

Extend Task 10's `packages/app-workflows/src/app.test.tsx` ("WorkflowsAdminApp review view" `describe`, Task 13): import the tokens and add one line to each of its three tests.

```tsx
import { ReviewerPickerPresenter } from "~/review/presentation/reviewerPicker/abstractions.js";
import { ReassignDialogPresenter } from "~/review/presentation/actionDialog/reassignAbstractions.js";
```

```tsx
// in "registers the review view presenters when the flag is on"
        expect(container.resolve(ReviewerPickerPresenter)).toBeDefined();
        expect(container.resolve(ReassignDialogPresenter)).toBeDefined();

// in "registers the presenters transient: every resolve is a new instance (R212)"
        const firstPicker = container.resolve(ReviewerPickerPresenter);
        const secondPicker = container.resolve(ReviewerPickerPresenter);
        expect(firstPicker).not.toBe(secondPicker);

// in "registers no review view presenter when the flag is off (R211)"
        expect(() => container.resolve(ReviewerPickerPresenter)).toThrow();
        expect(() => container.resolve(ReassignDialogPresenter)).toThrow();
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewerPicker/ReviewerPickerPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewerPicker/components/ReviewerPicker.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/ReassignDialogPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/components/ReassignDialog.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: `Failed to resolve import` for the new modules. Record the RED output.

- [ ] **Step 3: Implement**

Modify `packages/app-workflows/__tests__/setup/setupDom.ts` (cmdk, used by `AutoComplete`, scrolls the highlighted option into view; jsdom has no `scrollIntoView`):

```ts
// before
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
// after
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

// cmdk scrolls the selected item into view; jsdom has no scrollIntoView.
Element.prototype.scrollIntoView = () => undefined;
```

Create `packages/app-workflows/src/review/presentation/reviewerPicker/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { StepCandidate } from "~/review/domain/types.js";

export interface ReviewerPickerInitParams {
    load: () => Promise<StepCandidate[]>;
    currentOwnerId: string | null;
    selectedId: string | null;
}

export interface ReviewerPickerOptionVm {
    label: string;
    value: string;
    disabled: boolean;
}

/** Render-ready (R234). `eligibleCount` counts selectable people, ignoring the search. */
export interface IReviewerPickerViewModel {
    options: ReviewerPickerOptionVm[];
    value: string | null;
    loading: boolean;
    error: string | null;
    query: string;
    emptyMessage: string;
    eligibleCount: number;
}

export interface IReviewerPickerPresenter {
    readonly vm: IReviewerPickerViewModel;
    init(params: ReviewerPickerInitParams): Promise<void>;
    search(query: string): void;
    select(id: string): void;
    retry(): Promise<void>;
    dispose(): void;
}

export const ReviewerPickerPresenter = createAbstraction<IReviewerPickerPresenter>(
    "Workflows/ReviewerPickerPresenter"
);

export namespace ReviewerPickerPresenter {
    export type Interface = IReviewerPickerPresenter;
    export type ViewModel = IReviewerPickerViewModel;
}
```

Create `packages/app-workflows/src/review/presentation/reviewerPicker/getPickerOptions.ts`:

```ts
import type { StepCandidate } from "~/review/domain/types.js";
import type { ReviewerPickerOptionVm } from "./abstractions.js";

/**
 * The picker options (R209, R230): the current owner "Current owner", excluded people
 * "Unavailable[: reason]" (the reason only when the server sent it, D97), both disabled. Pure.
 */
export const getPickerOptions = (
    candidates: StepCandidate[],
    currentOwnerId: string | null
): ReviewerPickerOptionVm[] => {
    return candidates.map(candidate => {
        if (candidate.id === currentOwnerId) {
            return {
                label: `${candidate.displayName} (Current owner)`,
                value: candidate.id,
                disabled: true
            };
        }
        if (candidate.excluded) {
            let suffix = "Unavailable";
            if (candidate.excludedReason) {
                suffix = `Unavailable: ${candidate.excludedReason}`;
            }
            return {
                label: `${candidate.displayName} (${suffix})`,
                value: candidate.id,
                disabled: true
            };
        }
        return { label: candidate.displayName, value: candidate.id, disabled: false };
    });
};
```

Create `packages/app-workflows/src/review/presentation/reviewerPicker/ReviewerPickerPresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import type { StepCandidate } from "~/review/domain/types.js";
import { ReviewerPickerPresenter as Abstraction } from "./abstractions.js";
import type { ReviewerPickerInitParams } from "./abstractions.js";
import { getPickerOptions } from "./getPickerOptions.js";

class ReviewerPickerPresenterImpl implements Abstraction.Interface {
    private params: ReviewerPickerInitParams | null = null;
    private candidates: StepCandidate[] = [];
    private value: string | null = null;
    private loading = false;
    private error: string | null = null;
    private query = "";
    private token = 0;

    constructor() {
        makeAutoObservable<ReviewerPickerPresenterImpl, "token" | "params" | "candidates">(this, {
            token: false,
            params: observableRef,
            candidates: observableRef
        });
    }

    get vm(): Abstraction.ViewModel {
        const currentOwnerId = this.params ? this.params.currentOwnerId : null;
        const all = getPickerOptions(this.candidates, currentOwnerId);
        const needle = this.query.trim().toLowerCase();
        const options = all.filter(option => option.label.toLowerCase().includes(needle));
        const eligibleCount = all.filter(option => !option.disabled).length;

        let emptyMessage = "No reviewers to show.";
        if (needle !== "") {
            emptyMessage = `Nothing matches “${this.query.trim()}”.`;
        }

        return {
            options,
            value: this.value,
            loading: this.loading,
            error: this.error,
            query: this.query,
            emptyMessage,
            eligibleCount
        };
    }

    async init(params: ReviewerPickerInitParams): Promise<void> {
        const token = this.begin(params);

        try {
            const loaded = await params.load();
            if (token !== this.token) {
                return;
            }
            this.applyLoaded(loaded);
        } catch {
            if (token !== this.token) {
                return;
            }
            this.applyFailure();
        }
    }

    search(query: string): void {
        this.query = query;
    }

    select(id: string): void {
        const option = this.vm.options.find(item => item.value === id);
        const known = getPickerOptions(this.candidates, this.params ? this.params.currentOwnerId : null);
        const selectable = known.find(item => item.value === id);
        if (!selectable || selectable.disabled || !option) {
            return;
        }
        this.value = id;
    }

    async retry(): Promise<void> {
        if (!this.params) {
            return;
        }
        await this.init({ ...this.params, selectedId: this.value });
    }

    dispose(): void {
        this.token += 1;
        this.params = null;
        this.candidates = [];
        this.value = null;
        this.loading = false;
        this.error = null;
        this.query = "";
    }

    private begin(params: ReviewerPickerInitParams): number {
        this.token += 1;
        this.params = params;
        this.candidates = [];
        this.value = params.selectedId;
        this.loading = true;
        this.error = null;
        this.query = "";
        return this.token;
    }

    private applyLoaded(candidates: StepCandidate[]): void {
        this.candidates = candidates;
        this.loading = false;
    }

    private applyFailure(): void {
        this.loading = false;
        this.error = "Could not load results.";
    }
}

export const ReviewerPickerPresenter = Abstraction.createImplementation({
    implementation: ReviewerPickerPresenterImpl,
    dependencies: []
});
```

Create `packages/app-workflows/src/review/presentation/reviewerPicker/ReviewerPickerFactory.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewerPickerPresenter } from "./abstractions.js";

export interface IReviewerPickerFactory {
    create(): ReviewerPickerPresenter.Interface;
}

/**
 * Creates a new picker presenter per call, for a presenter that owns several pickers (Task 17's
 * request dialog has one per step). A constructor dependency is one instance, so a factory is
 * the way to get many without the presenter touching the container.
 */
export const ReviewerPickerFactory = createAbstraction<IReviewerPickerFactory>(
    "Workflows/ReviewerPickerFactory"
);

export namespace ReviewerPickerFactory {
    export type Interface = IReviewerPickerFactory;
}
```

Create `packages/app-workflows/src/review/presentation/reviewerPicker/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ReviewerPickerPresenter as Abstraction } from "./abstractions.js";
import { ReviewerPickerFactory } from "./ReviewerPickerFactory.js";
import { ReviewerPickerPresenter } from "./ReviewerPickerPresenter.js";

export const ReviewerPickerPresenterFeature = createFeature({
    name: "Workflows/ReviewerPickerPresenter",
    register(container) {
        // Transient (R212): each picker instance has its own candidates and search.
        container.register(ReviewerPickerPresenter);
        // The factory hands out transient instances; the closure is the DI wiring, no class
        // holds the container.
        container.registerFactory(ReviewerPickerFactory, () => {
            return { create: () => container.resolve(Abstraction) };
        });
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
```

Create `packages/app-workflows/src/review/presentation/reviewerPicker/components/ReviewerPicker.tsx`:

```tsx
import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert } from "@webiny/admin-ui";
import { AutoComplete } from "@webiny/admin-ui";
import type { ReviewerPickerPresenter } from "../abstractions.js";

export interface ReviewerPickerProps {
    presenter: ReviewerPickerPresenter.Interface;
    label: string;
    hint?: string;
}

/** The reviewer picker over `AutoComplete` (R209): client-side search, disabled people, retry. */
export const ReviewerPicker = createReactiveComponent(function ReviewerPicker(
    props: ReviewerPickerProps
) {
    const { presenter, label, hint } = props;
    const { vm } = presenter;

    if (vm.error !== null) {
        return (
            <Alert
                type={"danger"}
                variant={"subtle"}
                actions={<Alert.Action text={"Retry"} onClick={() => presenter.retry()} />}
            >
                {vm.error}
            </Alert>
        );
    }

    return (
        <AutoComplete
            label={label}
            description={hint}
            placeholder={"Search reviewers by name"}
            options={vm.options}
            value={vm.value ?? undefined}
            loading={vm.loading}
            loadingMessage={"Searching…"}
            emptyMessage={vm.emptyMessage}
            onValueSearch={query => presenter.search(query)}
            onValueChange={id => presenter.select(id)}
        />
    );
});
```

Create `packages/app-workflows/src/review/presentation/actionDialog/reassignAbstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewerPickerPresenter } from "../reviewerPicker/abstractions.js";
import type { ReviewActionConflictVm } from "./abstractions.js";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";

export interface ReassignDialogInitParams {
    useCases: IReviewUseCases;
    request: ReviewActionRequest;
    reviewsUrl: string | null;
    onDone: () => void;
    onClose: () => void;
}

/** Render-ready (R234); the picker is reached through `getPickerPresenter`, not the view model. */
export interface IReassignDialogViewModel {
    status: "loading" | "ready" | "failed";
    title: string;
    hint: string;
    message: string;
    nobodyEligible: boolean;
    confirmLabel: string;
    cancelLabel: string;
    canSubmit: boolean;
    submitting: boolean;
    fieldError: string | null;
    dialogError: string | null;
    conflict: ReviewActionConflictVm | null;
}

export interface IReassignDialogPresenter {
    readonly vm: IReassignDialogViewModel;
    init(params: ReassignDialogInitParams): Promise<void>;
    getPickerPresenter(): ReviewerPickerPresenter.Interface;
    submit(): Promise<void>;
    dismiss(): void;
    dispose(): void;
}

export const ReassignDialogPresenter = createAbstraction<IReassignDialogPresenter>(
    "Workflows/ReassignDialogPresenter"
);

export namespace ReassignDialogPresenter {
    export type Interface = IReassignDialogPresenter;
    export type ViewModel = IReassignDialogViewModel;
}
```

Create `packages/app-workflows/src/review/presentation/actionDialog/ReassignDialogPresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewerPickerPresenter } from "../reviewerPicker/abstractions.js";
import { ReassignDialogPresenter as Abstraction } from "./reassignAbstractions.js";
import type { ReassignDialogInitParams } from "./reassignAbstractions.js";
import type { ReviewActionConflictVm } from "./abstractions.js";
import { classifyReviewActionError } from "./classifyReviewActionError.js";
import { getConflictMessage } from "./getConflictMessage.js";

const GENERIC_ERROR = "The server did not respond, so nothing was changed. Try again.";
const NOBODY = "Nobody else is eligible to review this step.";
const HINT = "The previous owner (if any) and the new owner are notified.";

class ReassignDialogPresenterImpl implements Abstraction.Interface {
    private params: ReassignDialogInitParams | null = null;
    private review: ReviewWithFlags | null = null;
    private status: "loading" | "ready" | "failed" = "loading";
    private submitting = false;
    private fieldError: string | null = null;
    private dialogError: string | null = null;
    private conflict: ReviewActionConflictVm | null = null;
    private token = 0;

    constructor(
        private picker: ReviewerPickerPresenter.Interface,
        private toasts: ReviewToasts.Interface
    ) {
        makeAutoObservable<
            ReassignDialogPresenterImpl,
            "picker" | "toasts" | "token" | "params" | "review"
        >(this, {
            picker: false,
            toasts: false,
            token: false,
            params: observableRef,
            review: observableRef
        });
    }

    get vm(): Abstraction.ViewModel {
        const params = this.params;
        const review = this.review;
        const stepId = params ? params.request.stepId : null;
        const step = review ? review.review.steps.find(item => item.id === stepId) : undefined;
        const ready = this.status === "ready";
        const nobodyEligible = ready && this.picker.vm.error === null && this.picker.vm.eligibleCount === 0;
        const closeOnly = nobodyEligible || this.conflict !== null || this.status === "failed";

        let hint = "";
        if (ready && !nobodyEligible && this.conflict === null) {
            hint = HINT;
        }
        let message = "";
        if (nobodyEligible) {
            message = NOBODY;
        }

        return {
            status: this.status,
            title: step ? `Reassign “${step.title}”` : "",
            hint,
            message,
            nobodyEligible,
            confirmLabel: "Reassign",
            cancelLabel: closeOnly ? "Close" : "Cancel",
            canSubmit:
                ready &&
                !nobodyEligible &&
                this.conflict === null &&
                !this.submitting &&
                this.picker.vm.value !== null,
            submitting: this.submitting,
            fieldError: this.fieldError,
            dialogError: this.dialogError,
            conflict: this.conflict
        };
    }

    getPickerPresenter(): ReviewerPickerPresenter.Interface {
        return this.picker;
    }

    async init(params: ReassignDialogInitParams): Promise<void> {
        const token = this.begin(params);
        const { useCases, request } = params;
        const stepId = request.stepId ?? "";

        try {
            const loaded = await useCases.getReview(request.reviewId);
            if (token !== this.token) {
                return;
            }
            const step = loaded.review.steps.find(item => item.id === request.stepId);
            if (!step) {
                this.applyLoadFailure();
                return;
            }
            let currentOwnerId: string | null = null;
            if (step.owner !== null && step.owner.type === "user") {
                currentOwnerId = step.owner.id;
            }

            await this.picker.init({
                load: () => useCases.listReviewStepCandidates({ reviewId: request.reviewId, stepId }),
                currentOwnerId,
                selectedId: null
            });
            if (token !== this.token) {
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

    async submit(): Promise<void> {
        const params = this.params;
        const loaded = this.review;
        const userId = this.picker.vm.value;
        const step = loaded && params ? loaded.review.steps.find(item => item.id === params.request.stepId) : undefined;
        if (!params || !loaded || !step || userId === null || !this.vm.canSubmit) {
            return;
        }

        const { useCases, request } = params;
        const candidate = this.picker.vm.options.find(option => option.value === userId);
        const newOwnerName = candidate ? candidate.label : "";
        const token = this.token;

        this.startSubmit();

        try {
            await useCases.reassignStep({
                reviewId: request.reviewId,
                stepId: request.stepId ?? "",
                userId
            });
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
                    kind: "reassign",
                    stepId: request.stepId,
                    review: fresh ? fresh.review : null,
                    now,
                    listRefreshed: false
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

        this.toasts.show({
            kind: "reassigned",
            stepTitle: step.title,
            personName: newOwnerName,
            reviewsUrl: params.reviewsUrl
        });
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
        this.picker.dispose();
        this.params = null;
        this.review = null;
        this.status = "loading";
        this.submitting = false;
        this.fieldError = null;
        this.dialogError = null;
        this.conflict = null;
    }

    private begin(params: ReassignDialogInitParams): number {
        this.token += 1;
        this.params = params;
        this.review = null;
        this.status = "loading";
        this.submitting = false;
        this.fieldError = null;
        this.dialogError = null;
        this.conflict = null;
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
        this.conflict = { title, message, commentKept: false };
        if (fresh) {
            this.review = fresh;
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

export const ReassignDialogPresenter = Abstraction.createImplementation({
    implementation: ReassignDialogPresenterImpl,
    dependencies: [ReviewerPickerPresenter, ReviewToasts]
});
```

Note: the toast `personName` is the new owner's **name**: the picker option label of an eligible person is exactly the display name (disabled options cannot be chosen), so `candidate.label` is the name.

Create `packages/app-workflows/src/review/presentation/actionDialog/reassignFeature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ReassignDialogPresenter as Abstraction } from "./reassignAbstractions.js";
import { ReassignDialogPresenter } from "./ReassignDialogPresenter.js";

export const ReassignDialogPresenterFeature = createFeature({
    name: "Workflows/ReassignDialogPresenter",
    register(container) {
        // Transient (R212): one instance, and one private picker, per mounted dialog.
        container.register(ReassignDialogPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
```

Create `packages/app-workflows/src/review/presentation/actionDialog/components/ReassignDialog.tsx`:

```tsx
import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReviewerPicker } from "../../reviewerPicker/components/ReviewerPicker.js";
import type { ReassignDialogPresenter } from "../reassignAbstractions.js";

export interface ReassignDialogProps {
    presenter: ReassignDialogPresenter.Interface;
}

export const ReassignDialog = createReactiveComponent(function ReassignDialog(
    props: ReassignDialogProps
) {
    const { presenter } = props;
    const { vm } = presenter;
    const closeOnly = vm.nobodyEligible || vm.conflict !== null || vm.status === "failed";

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
    if (closeOnly) {
        actions = <Dialog.CancelAction text={"Close"} />;
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
                    </Alert>
                ) : null}
                {vm.dialogError ? (
                    <Alert type={"danger"} variant={"subtle"}>
                        {vm.dialogError}
                    </Alert>
                ) : null}
                {vm.message ? (
                    <div className={"rounded-md border-sm border-dashed border-neutral-muted p-md text-center"}>
                        <Text size={"md"}>{vm.message}</Text>
                    </div>
                ) : null}
                {vm.status === "ready" && !vm.nobodyEligible && vm.conflict === null ? (
                    <ReviewerPicker
                        presenter={presenter.getPickerPresenter()}
                        label={"Reviewer"}
                        hint={vm.hint}
                    />
                ) : null}
                {vm.fieldError ? (
                    <Text size={"sm"} className={"text-destructive-default"}>
                        {vm.fieldError}
                    </Text>
                ) : null}
            </div>
        </Dialog>
    );
});
```

Create `packages/app-workflows/src/review/presentation/actionDialog/components/ReassignDialogHost.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { ReassignDialogPresenterFeature } from "../reassignFeature.js";
import type { ReviewActionRequest } from "../ReviewActionRequest.js";
import { ReassignDialog } from "./ReassignDialog.js";

export interface ReassignDialogHostProps {
    useCases: IReviewUseCases;
    request: ReviewActionRequest;
    reviewsUrl: string | null;
    onDone: () => void;
    onClose: () => void;
}

/** One presenter, with its private picker, per mounted dialog (transient, R212). */
export const ReassignDialogHost = (props: ReassignDialogHostProps) => {
    const { useCases, request, reviewsUrl, onDone, onClose } = props;
    const { presenter } = useFeature(ReassignDialogPresenterFeature);

    useEffect(() => {
        presenter.init({ useCases, request, reviewsUrl, onDone, onClose });
        return () => presenter.dispose();
    }, [presenter, request.kind, request.reviewId, request.stepId]);

    return <ReassignDialog presenter={presenter} />;
};
```

Modify `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionKind.ts`:

```ts
// before
export type ReviewActionKind = "start" | "takeOver" | "approve" | "reject" | "cancel";
// after
export type ReviewActionKind = "start" | "takeOver" | "reassign" | "approve" | "reject" | "cancel";
```

Modify `toActionRequest.ts`: delete the three lines added for Task 15:

```ts
// delete
    // "reassign" joins ReviewActionKind in Task 16, which removes these three lines.
    if (openAction.kind === "reassign") {
        return null;
    }
```

Modify `getConflictMessage.ts` (the noun table):

```ts
// before
    takeOver: "take-over",
    approve: "approval",
// after
    takeOver: "take-over",
    reassign: "reassignment",
    approve: "approval",
```

Modify `components/ReviewActionDialogs.tsx`:

```tsx
// before
import { ReviewActionDialogHost } from "./ReviewActionDialogHost.js";
// after
import { ReassignDialogHost } from "./ReassignDialogHost.js";
import { ReviewActionDialogHost } from "./ReviewActionDialogHost.js";
```

```tsx
// before
    const key = `${request.kind}:${request.reviewId}:${request.stepId}`;
    return <ReviewActionDialogHost key={key} {...props} request={request} />;
// after
    const key = `${request.kind}:${request.reviewId}:${request.stepId}`;
    if (request.kind === "reassign") {
        return <ReassignDialogHost key={key} {...props} request={request} />;
    }
    return <ReviewActionDialogHost key={key} {...props} request={request} />;
```

Modify `app.tsx` (imports and registrations after `ReviewActionDialogPresenterFeature`):

```tsx
import { ReviewerPickerPresenterFeature } from "~/review/presentation/reviewerPicker/feature.js";
import { ReassignDialogPresenterFeature } from "~/review/presentation/actionDialog/reassignFeature.js";
```

```tsx
            <RegisterFeature feature={ReviewActionDialogPresenterFeature} />
            <RegisterFeature feature={ReviewerPickerPresenterFeature} />
            <RegisterFeature feature={ReassignDialogPresenterFeature} />
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewerPicker/ReviewerPickerPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewerPicker/components/ReviewerPicker.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/ReassignDialogPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/actionDialog/components/ReassignDialog.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: PASS. If the `ReviewerPicker` "offers the options" test cannot open the cmdk list with `focus` and `ArrowDown`, open it with a `click` on the combobox input instead; the assertions stay.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewerPicker/ReviewerPickerPresenter.test.ts packages/app-workflows/src/review/presentation/reviewerPicker/components/ReviewerPicker.test.tsx packages/app-workflows/src/review/presentation/actionDialog/ReassignDialogPresenter.test.ts packages/app-workflows/src/review/presentation/actionDialog/components/ReassignDialog.test.tsx packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass (the Task 15 tests still pass after the `reassign` additions), no TypeScript errors (R-e: `yarn build -p @webiny/app-workflows` is the type check).

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
git commit -m "feat(app-workflows): add the reviewer picker and the reassign dialog" -m "The picker lists candidates over AutoComplete with client-side search, disabled Unavailable and Current owner entries and a retry on load failure. The reassign dialog loads the review and the step candidates through a private picker presenter, shows only Close when nobody is eligible, and reuses the shared action error classification." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- The reassign title `Reassign “{step}”`, the placeholder "Search reviewers by name" and the empty message come from the design prototype (`Content Review.dc.html`); the picker's own empty messages ("No reviewers to show.", `Nothing matches “{q}”.`) follow README 9.
- Picker search does not use a server query (R209: candidates arrive unpaged), so the design's "Searching…" row only shows while the candidates load.
- **`ReviewerPickerFactory` closure:** `container.registerFactory(ReviewerPickerFactory, () => ({ create: () => container.resolve(...) }))` sits in the feature's `register`, the one place allowed to touch the container; no class holds it. No admin-package precedent for `registerFactory` was found (`packages/app` and `packages/app-admin` use `register` and `registerInstance`); `@webiny/di` documents `registerFactory` (README "Factory Registration") and `Container.registerFactory` exists in its typings.
- `ReviewActionDialogPresenter.ts` is not modified here: Task 15 builds the toast per kind without a lookup table, so the `reassign` kind needs nothing there.
- Size: large (ten source files, four test files, six small modifications).
