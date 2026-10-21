### Task 17: Request review dialog

R202, R212, R215, R217, R218, R220, R234, R-c, R-e, R-f, R-g, R-i, R-j, R-k, R-l; D22, D100, D120, D128, D135; QBZ-4, QBZ-6, QBZ-37, QBZ-48, QBZ-49, QBZ-93; README 5; Review Focus 14. The dialog behind the bar's "Request review". It shows the workflow steps as a read-only preview, a title prefilled with the content title (at least 5 characters after trim, "Use at least 5 characters."), and for every step that allows picks the radios "Automatic" / "Choose a person" with a reviewer picker. `picks` are sent only for steps in "Choose a person" with a person chosen (R218). The title and the picks follow D100/D120/D128; the server stays authoritative (`Workflows/Review/Validation` shows under the title).

- **Steps** come from `useCases.getBoundWorkflow(namespace)` (`ReviewWorkflow.steps`; a workflow that disappeared is a steps failure). While they load: four skeleton rows; on failure "Could not load the steps for this review." with "Try again"; Request review is disabled until the steps are ready (QBZ-6).
- **Picks:** a step with `allowManualPick` gets a private `ReviewerPickerPresenter` (from the Task 16 `ReviewerPickerFactory`) loading `useCases.listStepCandidates({ workflowId, stepId, target })` once, eagerly, so "Choose a person" can be disabled with nobody to pick (QBZ-48: the step stays on Automatic); each pick step needs its own person before Request review is enabled (QBZ-49). Hint under every picker: "Picks are checked again when the step is reached. If the person is no longer eligible, a reviewer is assigned automatically." With nobody eligible (QBZ-4, QBZ-48) the picker is hidden, "Choose a person" is disabled and the step stays on Automatic, with the QBZ-4 copy "No one other than you can review this step right now. It may wait in the team pool until someone reassigns it."
- **Tags** (README 5): the type tag (People, AI, Automation) and the label tag ("Assigned automatically" for a people step whose `assignedAutomatically` is true (R-j: assignment strategy other than none), "Team pool" for the other people steps, "AI", "Automation").
- **Errors:** `AlreadyActive` (any conflict code) = alert "Someone else acted first" with "Someone else already requested a review for this revision.", buttons collapse to Close; `Validation` = under the title; any other failure "Could not request the review: the server did not respond. Try again." (README 5). A workflow without steps is a steps failure. A dialog that is submitting ignores a close request. `NotAuthorized` shows the shared `NO_ACCESS_MESSAGE`. Success: toast kind `requested` with the first step as the non-null `stepTitle` ("Editorial check is the first step.", QBZ-93), then `onDone`.

**Files:**
- Create: `packages/app-workflows/src/review/presentation/requestReview/abstractions.ts`
- Create: `packages/app-workflows/src/review/presentation/requestReview/getStepTypeLabel.ts`
- Create: `packages/app-workflows/src/review/presentation/requestReview/RequestReviewPresenter.ts`
- Create: `packages/app-workflows/src/review/presentation/requestReview/feature.ts`
- Create: `packages/app-workflows/src/review/presentation/requestReview/components/RequestReviewDialog.tsx`
- Create: `packages/app-workflows/src/review/presentation/requestReview/RequestReviewPresenter.test.ts`
- Create: `packages/app-workflows/src/review/presentation/requestReview/components/RequestReviewDialog.test.tsx`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx`
- Modify: `packages/app-workflows/src/app.tsx`

**Interfaces:**
- Consumes: Task 16 (`ReviewerPickerFactory`, `ReviewerPickerPresenter.Interface` (R-l), `ReviewerPicker`, `ReviewerPickerPresenterFeature`), Task 15 (`classifyReviewActionError`), Task 14 (`ReviewBar`, `renderWithContainer` from Task 15), Task 13 (`TargetReviewOpenAction`, `NO_ACCESS_MESSAGE`, `createWorkflow`, `reviewTarget`, `createFakeUseCases`), Task 10 (`ReviewToasts`, member `requested` with `stepTitle: string`), Task 8 (`ReviewWorkflow`, `ReviewWorkflowStep` with `assignedAutomatically`, `ReviewTarget`, `RequestReviewPick` (`~/review/gateway/IReviewGateway.js`), `StepCandidate`, `REVIEW_TITLE_MIN_LENGTH`, `IReviewUseCases.getBoundWorkflow/listStepCandidates/requestReview`), Task 6. Existing (verified): admin-ui `Input` (`label`, `value`, `onChange(value)`, `validation`, `required`), `RadioGroup` (`items: { label, value, disabled? }[]`, `value`, `onChange(value)`), `Skeleton`, `Tag`, `Alert`, `Dialog`.
- Produces: `RequestReviewInitParams { useCases; target; targetTitle; reviewsUrl; onDone; onClose }`; `RequestReviewStepVm`; VM `{ status; title; titleError; steps; dialogError; conflict; canSubmit }`; presenter `{ vm; init; setTitle; setMode; getPickerPresenter(stepId); retrySteps; submit; dismiss; dispose }`; token `RequestReviewPresenter` (`"Workflows/RequestReviewPresenter"`, transient, dependencies `[ReviewerPickerFactory, ReviewToasts]`); `RequestReviewPresenterFeature`; `RequestReviewDialog` props `{ useCases; target; targetTitle; reviewsUrl; onDone; onClose }`. Consumed by the bar only.

**Test runner note:** admin package, `yarn test <path>` only.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/review/presentation/requestReview/RequestReviewPresenter.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import type { StepCandidate } from "~/review/domain/types.js";
import { ReviewerPickerPresenterFeature } from "../reviewerPicker/feature.js";
import { RequestReviewPresenterFeature } from "./feature.js";
import type { RequestReviewInitParams } from "./abstractions.js";
import { TARGET } from "~/review/testing/reviewTarget.js";
import { createWorkflow } from "~/review/testing/createWorkflow.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import type { FakeReviewUseCases } from "~/review/testing/fakeReviewUseCases.js";

const WORKFLOW: ReviewWorkflow = createWorkflow({
    steps: [
        {
            id: "editorial",
            title: "Editorial check",
            color: "#FA5723",
            description: "Reads the copy.",
            type: "review",
            allowManualPick: true,
            assignedAutomatically: false
        },
        {
            id: "legal",
            title: "Legal sign-off",
            color: "#0D9488",
            description: null,
            type: "review",
            allowManualPick: true,
            assignedAutomatically: true
        },
        {
            id: "tone",
            title: "AI tone check",
            color: "#7C3AED",
            description: null,
            type: "ai",
            allowManualPick: false,
            assignedAutomatically: false
        },
        {
            id: "hook",
            title: "Notify web team",
            color: "#2563EB",
            description: null,
            type: "automation",
            allowManualPick: false,
            assignedAutomatically: false
        }
    ]
});

const PEOPLE: StepCandidate[] = [
    { id: "u1", displayName: "Ivan Horvat", excluded: false, excludedReason: null },
    { id: "u2", displayName: "Luka Perić", excluded: false, excludedReason: null }
];

interface Setup {
    presenter: ReturnType<typeof RequestReviewPresenterFeature.resolve>["presenter"];
    useCases: FakeReviewUseCases;
    toasts: { show: ReturnType<typeof vi.fn> };
    onDone: ReturnType<typeof vi.fn>;
    onClose: ReturnType<typeof vi.fn>;
    params: (overrides?: Partial<RequestReviewInitParams>) => RequestReviewInitParams;
}

const createSetup = (): Setup => {
    const container = new Container();
    const toasts = { show: vi.fn() };
    container.registerInstance(ReviewToasts, toasts);
    ReviewerPickerPresenterFeature.register(container);
    RequestReviewPresenterFeature.register(container);
    const { presenter } = RequestReviewPresenterFeature.resolve(container);
    const useCases = createFakeUseCases();
    useCases.getBoundWorkflow.mockResolvedValue(WORKFLOW);
    useCases.listStepCandidates.mockResolvedValue(PEOPLE);
    const onDone = vi.fn();
    const onClose = vi.fn();
    return {
        presenter,
        useCases,
        toasts,
        onDone,
        onClose,
        params: (overrides = {}) => ({
            useCases,
            target: TARGET,
            targetTitle: "Spring campaign",
            reviewsUrl: "/cms/content-reviews",
            onDone,
            onClose,
            ...overrides
        })
    };
};

describe("RequestReviewPresenter", () => {
    let setup: Setup;

    beforeEach(() => {
        setup = createSetup();
    });

    it("loads the steps and is loadingSteps before that (QBZ-6)", async () => {
        const pending = setup.presenter.init(setup.params());
        expect(setup.presenter.vm.status).toBe("loadingSteps");
        expect(setup.presenter.vm.canSubmit).toBe(false);

        await pending;

        expect(setup.useCases.getBoundWorkflow).toHaveBeenCalledWith(TARGET.namespace);
        expect(setup.presenter.vm.status).toBe("ready");
        expect(setup.presenter.vm.canSubmit).toBe(true);
    });

    it("prefills the title with the content title", async () => {
        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.title).toBe("Spring campaign");
        expect(setup.presenter.vm.titleError).toBeNull();
    });

    it("describes each step with number, colour, type and label tags (R218)", async () => {
        await setup.presenter.init(setup.params());

        const steps = setup.presenter.vm.steps;
        expect(steps.map(step => [step.index, step.title, step.typeLabel, step.labelTag])).toEqual([
            [1, "Editorial check", "People", "Team pool"],
            [2, "Legal sign-off", "People", "Assigned automatically"],
            [3, "AI tone check", "AI", "AI"],
            [4, "Notify web team", "Automation", "Automation"]
        ]);
        expect(steps[0].color).toBe("#FA5723");
        expect(steps[0].description).toBe("Reads the copy.");
        expect(steps[2].description).toBeNull();
        expect(steps.map(step => step.allowManualPick)).toEqual([true, true, false, false]);
        expect(steps.map(step => step.mode)).toEqual(["automatic", "automatic", "automatic", "automatic"]);
        expect(steps.map(step => step.hasPicker)).toEqual([true, true, false, false]);
    });

    it("loads candidates only for steps that allow picks", async () => {
        await setup.presenter.init(setup.params());

        expect(setup.useCases.listStepCandidates).toHaveBeenCalledTimes(2);
        expect(setup.useCases.listStepCandidates).toHaveBeenCalledWith({
            workflowId: "workflow-1",
            stepId: "editorial",
            target: TARGET
        });
        expect(setup.presenter.getPickerPresenter("tone")).toBeNull();
        expect(setup.presenter.getPickerPresenter("editorial")).not.toBeNull();
    });

    it("keeps one independent picker per pick step (QBZ-49)", async () => {
        await setup.presenter.init(setup.params());

        const first = setup.presenter.getPickerPresenter("editorial");
        const second = setup.presenter.getPickerPresenter("legal");
        expect(first).not.toBe(second);
        first?.select("u1");
        expect(second?.vm.value).toBeNull();
    });

    it("fails the steps with a retry (QBZ-6)", async () => {
        setup.useCases.getBoundWorkflow.mockRejectedValueOnce(new Error("Network."));

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.status).toBe("stepsFailed");
        expect(setup.presenter.vm.canSubmit).toBe(false);

        await setup.presenter.retrySteps();

        expect(setup.presenter.vm.status).toBe("ready");
    });

    it("keeps an edited title across a steps retry", async () => {
        setup.useCases.getBoundWorkflow.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.init(setup.params());
        setup.presenter.setTitle("My own title");

        await setup.presenter.retrySteps();

        expect(setup.presenter.vm.title).toBe("My own title");
    });

    it("treats a workflow without steps as a steps failure", async () => {
        setup.useCases.getBoundWorkflow.mockResolvedValue(createWorkflow({ steps: [] }));

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.status).toBe("stepsFailed");
    });

    it("keeps the dialog open while submitting, so the success path is not lost", async () => {
        let release: () => void = () => undefined;
        setup.useCases.requestReview.mockReturnValue(
            new Promise(resolve => {
                release = () => resolve({} as never);
            })
        );
        await setup.presenter.init(setup.params());

        const pending = setup.presenter.submit();
        setup.presenter.dismiss();
        expect(setup.onClose).not.toHaveBeenCalled();

        release();
        await pending;
        expect(setup.onDone).toHaveBeenCalledTimes(1);
    });

    it("shows the shared no-access message for NotAuthorized", async () => {
        setup.useCases.requestReview.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );
        await setup.presenter.init(setup.params());

        await setup.presenter.submit();

        expect(setup.presenter.vm.dialogError).toBe(NO_ACCESS_MESSAGE);
    });

    it("treats a workflow that vanished as a steps failure", async () => {
        setup.useCases.getBoundWorkflow.mockResolvedValue(null);

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.status).toBe("stepsFailed");
    });

    it("requires at least 5 characters after trim (R215, D100)", async () => {
        await setup.presenter.init(setup.params());

        setup.presenter.setTitle("  ab  ");
        expect(setup.presenter.vm.titleError).toBe("Use at least 5 characters.");
        expect(setup.presenter.vm.canSubmit).toBe(false);
        await setup.presenter.submit();
        expect(setup.useCases.requestReview).not.toHaveBeenCalled();

        setup.presenter.setTitle("  abcde  ");
        expect(setup.presenter.vm.titleError).toBeNull();
        expect(setup.presenter.vm.canSubmit).toBe(true);
    });

    it("needs a person for every pick step that is set to Choose a person (QBZ-49)", async () => {
        await setup.presenter.init(setup.params());

        setup.presenter.setMode("editorial", "pick");
        setup.presenter.setMode("legal", "pick");
        expect(setup.presenter.vm.canSubmit).toBe(false);

        setup.presenter.getPickerPresenter("editorial")?.select("u1");
        expect(setup.presenter.vm.canSubmit).toBe(false);

        setup.presenter.getPickerPresenter("legal")?.select("u2");
        expect(setup.presenter.vm.canSubmit).toBe(true);
    });

    it("sends picks only for pick steps with a person chosen (Review Focus 14)", async () => {
        await setup.presenter.init(setup.params());
        setup.presenter.setMode("editorial", "pick");
        setup.presenter.getPickerPresenter("editorial")?.select("u1");
        setup.presenter.getPickerPresenter("legal")?.select("u2");
        setup.presenter.setTitle("  Spring campaign v2  ");

        await setup.presenter.submit();

        expect(setup.useCases.requestReview).toHaveBeenCalledWith({
            target: TARGET,
            title: "Spring campaign v2",
            picks: [{ stepId: "editorial", userId: "u1" }]
        });
    });

    it("sends no picks when every step stays on Automatic", async () => {
        await setup.presenter.init(setup.params());

        await setup.presenter.submit();

        expect(setup.useCases.requestReview).toHaveBeenCalledWith({
            target: TARGET,
            title: "Spring campaign",
            picks: []
        });
    });

    it("drops a pick when the step goes back to Automatic", async () => {
        await setup.presenter.init(setup.params());
        setup.presenter.setMode("editorial", "pick");
        setup.presenter.getPickerPresenter("editorial")?.select("u1");
        setup.presenter.setMode("editorial", "automatic");

        await setup.presenter.submit();

        expect(setup.useCases.requestReview.mock.calls[0][0].picks).toEqual([]);
    });

    it("disables Choose a person when nobody can be picked and keeps the step on Automatic (QBZ-48)", async () => {
        setup.useCases.listStepCandidates.mockResolvedValue([
            { id: "u1", displayName: "Ivan Horvat", excluded: true, excludedReason: null }
        ]);

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.steps[0].noCandidates).toBe(true);
        setup.presenter.setMode("editorial", "pick");
        expect(setup.presenter.vm.steps[0].mode).toBe("automatic");
        expect(setup.presenter.vm.canSubmit).toBe(true);
    });

    it("ignores a mode change for a step that allows no picks", async () => {
        await setup.presenter.init(setup.params());

        setup.presenter.setMode("tone", "pick");

        expect(setup.presenter.vm.steps[2].mode).toBe("automatic");
    });

    it("shows the toast with the first step and calls onDone after success (QBZ-93)", async () => {
        await setup.presenter.init(setup.params());

        await setup.presenter.submit();

        expect(setup.toasts.show).toHaveBeenCalledWith({
            kind: "requested",
            stepTitle: "Editorial check",
            personName: null,
            reviewsUrl: "/cms/content-reviews"
        });
        expect(setup.onDone).toHaveBeenCalledTimes(1);
    });

    it("does not submit twice while submitting", async () => {
        let release: () => void = () => undefined;
        setup.useCases.requestReview.mockReturnValue(
            new Promise(resolve => {
                release = () => resolve({} as never);
            })
        );
        await setup.presenter.init(setup.params());

        const first = setup.presenter.submit();
        expect(setup.presenter.vm.status).toBe("submitting");
        const second = setup.presenter.submit();
        release();
        await first;
        await second;

        expect(setup.useCases.requestReview).toHaveBeenCalledTimes(1);
    });

    it("shows 'Someone else acted first' and collapses on AlreadyActive", async () => {
        setup.useCases.requestReview.mockRejectedValue(
            new GraphQLOperationError({ message: "Active.", code: ReviewErrorCode.AlreadyActive })
        );
        await setup.presenter.init(setup.params());

        await setup.presenter.submit();

        const { vm } = setup.presenter;
        expect(vm.conflict).toEqual({
            title: "Someone else acted first",
            message: "Someone else already requested a review for this revision."
        });
        expect(vm.canSubmit).toBe(false);
        expect(setup.toasts.show).not.toHaveBeenCalled();
        expect(setup.onDone).not.toHaveBeenCalled();
    });

    it("shows a Validation error under the title and clears it on edit", async () => {
        setup.useCases.requestReview.mockRejectedValue(
            new GraphQLOperationError({
                message: "Use 120 characters or fewer.",
                code: ReviewErrorCode.Validation
            })
        );
        await setup.presenter.init(setup.params());

        await setup.presenter.submit();
        expect(setup.presenter.vm.titleError).toBe("Use 120 characters or fewer.");
        expect(setup.presenter.vm.status).toBe("ready");

        setup.presenter.setTitle("Spring campaign 2");
        expect(setup.presenter.vm.titleError).toBeNull();
    });

    it("shows the server-error alert and allows a retry", async () => {
        setup.useCases.requestReview.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.init(setup.params());

        await setup.presenter.submit();

        expect(setup.presenter.vm.dialogError).toBe(
            "Could not request the review: the server did not respond. Try again."
        );
        expect(setup.presenter.vm.status).toBe("ready");
        expect(setup.onDone).not.toHaveBeenCalled();

        await setup.presenter.submit();
        expect(setup.presenter.vm.dialogError).toBeNull();
        expect(setup.onDone).toHaveBeenCalledTimes(1);
    });

    it("calls onClose on dismiss and resets on dispose", async () => {
        await setup.presenter.init(setup.params());

        setup.presenter.dismiss();
        expect(setup.onClose).toHaveBeenCalledTimes(1);

        setup.presenter.dispose();
        expect(setup.presenter.vm.status).toBe("loadingSteps");
        expect(setup.presenter.vm.steps).toEqual([]);
        expect(setup.presenter.getPickerPresenter("editorial")).toBeNull();
    });
});
```

Create `packages/app-workflows/src/review/presentation/requestReview/components/RequestReviewDialog.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { ReviewerPickerPresenterFeature } from "../../reviewerPicker/feature.js";
import { RequestReviewPresenterFeature } from "../feature.js";
import { RequestReviewDialog } from "./RequestReviewDialog.js";
import { ReviewBar } from "~/review/presentation/targetReview/components/ReviewBar.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createFakePresenter } from "~/review/testing/targetReviewFakes.js";
import { createViewModel } from "~/review/testing/targetReviewFakes.js";
import { TARGET } from "~/review/testing/reviewTarget.js";
import { createWorkflow } from "~/review/testing/createWorkflow.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";

const createContainer = () => {
    const container = new Container();
    container.registerInstance(ReviewToasts, { show: vi.fn() });
    ReviewerPickerPresenterFeature.register(container);
    RequestReviewPresenterFeature.register(container);
    return container;
};

const createUseCases = () => {
    const useCases = createFakeUseCases();
    useCases.getBoundWorkflow.mockResolvedValue(
        createWorkflow({
            steps: [
                {
                    id: "editorial",
                    title: "Editorial check",
                    color: "#FA5723",
                    description: "Reads the copy.",
                    type: "review",
                    allowManualPick: true,
                    assignedAutomatically: false
                },
                {
                    id: "tone",
                    title: "AI tone check",
                    color: "#7C3AED",
                    description: null,
                    type: "ai",
                    allowManualPick: false,
                    assignedAutomatically: false
                }
            ]
        })
    );
    useCases.listStepCandidates.mockResolvedValue([
        { id: "u1", displayName: "Ivan Horvat", excluded: false, excludedReason: null }
    ]);
    return useCases;
};

const renderDialog = (useCases = createUseCases(), onClose = vi.fn(), onDone = vi.fn()) => {
    renderWithContainer(
        <RequestReviewDialog
            useCases={useCases}
            target={TARGET}
            targetTitle={"Spring campaign"}
            reviewsUrl={null}
            onDone={onDone}
            onClose={onClose}
        />,
        createContainer()
    );
    return { useCases, onClose, onDone };
};

describe("RequestReviewDialog", () => {
    it("shows the steps with their tags once loaded", async () => {
        renderDialog();

        expect(await screen.findByText("Editorial check")).toBeTruthy();
        expect(screen.getByText("AI tone check")).toBeTruthy();
        expect(screen.getByText("Reads the copy.")).toBeTruthy();
        expect(screen.getAllByText("People").length).toBeGreaterThan(0);
        expect(screen.getByText("Team pool")).toBeTruthy();
        expect(screen.getAllByText("AI").length).toBeGreaterThan(0);
    });

    it("disables Request review until the steps are ready", async () => {
        renderDialog();

        const loadingButton = screen.getByText("Request review", { selector: "button *, button" });
        expect(loadingButton.closest("button")?.getAttribute("aria-disabled")).toBe("true");

        await screen.findByText("Editorial check");
        const readyButton = screen.getByText("Request review", { selector: "button *, button" });
        expect(readyButton.closest("button")?.getAttribute("aria-disabled")).not.toBe("true");
    });

    it("shows 'Use at least 5 characters.' for a short title", async () => {
        renderDialog();
        await screen.findByText("Editorial check");

        fireEvent.change(screen.getByDisplayValue("Spring campaign"), { target: { value: "abc" } });

        expect(await screen.findByText("Use at least 5 characters.")).toBeTruthy();
    });

    it("shows the picker and the hint when Choose a person is selected", async () => {
        renderDialog();
        await screen.findByText("Editorial check");

        fireEvent.click(screen.getByRole("radio", { name: "Choose a person" }));

        expect(
            await screen.findByText(
                "Picks are checked again when the step is reached. If the person is no longer eligible, a reviewer is assigned automatically."
            )
        ).toBeTruthy();
    });

    it("shows the QBZ-4 note and no picker when nobody else can be picked", async () => {
        const useCases = createUseCases();
        useCases.listStepCandidates.mockResolvedValue([
            { id: "u1", displayName: "Ivan Horvat", excluded: true, excludedReason: null }
        ]);
        renderDialog(useCases);

        expect(
            await screen.findByText(
                "No one other than you can review this step right now. It may wait in the team pool until someone reassigns it."
            )
        ).toBeTruthy();
        expect(screen.queryByText("Reviewer")).toBeNull();
        const choose = screen.getByRole("radio", { name: "Choose a person" });
        expect(choose.hasAttribute("disabled")).toBe(true);
    });

    it("shows the steps failure with Try again that reloads", async () => {
        const useCases = createUseCases();
        useCases.getBoundWorkflow.mockRejectedValueOnce(new Error("Network."));
        renderDialog(useCases);

        expect(await screen.findByText("Could not load the steps for this review.")).toBeTruthy();
        fireEvent.click(screen.getByText("Try again"));

        expect(await screen.findByText("Editorial check")).toBeTruthy();
    });

    it("is mounted by the review bar for the request action", async () => {
        const presenter = createFakePresenter(
            createViewModel({
                status: "none",
                reviewKind: "none",
                progress: null,
                reviewId: null,
                openAction: { kind: "request", stepId: null }
            })
        );
        renderWithContainer(
            <ReviewBar
                presenter={presenter}
                useCases={createUseCases()}
                reviewsUrl={null}
            />,
            createContainer()
        );

        expect(await screen.findByText("Editorial check")).toBeTruthy();
        fireEvent.click(screen.getByText("Cancel"));
        expect(presenter.closeAction).toHaveBeenCalledTimes(1);
    });
});
```

Extend Task 10's `packages/app-workflows/src/app.test.tsx` ("WorkflowsAdminApp review view" `describe`, Task 13): import the token and add one line to each of its three tests.

```tsx
import { RequestReviewPresenter } from "~/review/presentation/requestReview/abstractions.js";
```

```tsx
// in "registers the review view presenters when the flag is on"
        expect(container.resolve(RequestReviewPresenter)).toBeDefined();

// in "registers the presenters transient: every resolve is a new instance (R212)"
        const firstRequest = container.resolve(RequestReviewPresenter);
        const secondRequest = container.resolve(RequestReviewPresenter);
        expect(firstRequest).not.toBe(secondRequest);

// in "registers no review view presenter when the flag is off (R211)"
        expect(() => container.resolve(RequestReviewPresenter)).toThrow();
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/presentation/requestReview/RequestReviewPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/requestReview/components/RequestReviewDialog.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: `Failed to resolve import "./feature.js"` and so on. Record the RED output.

- [ ] **Step 3: Implement**

The bar mounts this dialog from its own view model: `ReviewBar` builds the target from `vm.namespace` and `vm.targetRevisionId` and takes the title from `vm.targetTitle` (R-f); `ReviewBar` keeps its props and `EditorReviewBar` stays `{ session, reviewsRoute }`.

Create `packages/app-workflows/src/review/presentation/requestReview/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewerPickerPresenter } from "../reviewerPicker/abstractions.js";

export interface RequestReviewInitParams {
    useCases: IReviewUseCases;
    target: ReviewTarget;
    targetTitle: string;
    reviewsUrl: string | null;
    onDone: () => void;
    onClose: () => void;
}

export type RequestReviewMode = "automatic" | "pick";

export interface RequestReviewStepVm {
    stepId: string;
    index: number;
    title: string;
    color: string;
    typeLabel: string;
    labelTag: string;
    description: string | null;
    allowManualPick: boolean;
    mode: RequestReviewMode;
    hasPicker: boolean;
    noCandidates: boolean;
}

export interface RequestReviewConflictVm {
    title: string;
    message: string;
}

/** Render-ready (R234): the pickers are reached through `getPickerPresenter`, not the view model. */
export interface IRequestReviewViewModel {
    status: "loadingSteps" | "stepsFailed" | "ready" | "submitting";
    title: string;
    titleError: string | null;
    steps: RequestReviewStepVm[];
    dialogError: string | null;
    conflict: RequestReviewConflictVm | null;
    canSubmit: boolean;
}

export interface IRequestReviewPresenter {
    readonly vm: IRequestReviewViewModel;
    init(params: RequestReviewInitParams): Promise<void>;
    setTitle(title: string): void;
    setMode(stepId: string, mode: RequestReviewMode): void;
    getPickerPresenter(stepId: string): ReviewerPickerPresenter.Interface | null;
    retrySteps(): Promise<void>;
    submit(): Promise<void>;
    dismiss(): void;
    dispose(): void;
}

export const RequestReviewPresenter = createAbstraction<IRequestReviewPresenter>(
    "Workflows/RequestReviewPresenter"
);

export namespace RequestReviewPresenter {
    export type Interface = IRequestReviewPresenter;
    export type ViewModel = IRequestReviewViewModel;
}
```

Create `packages/app-workflows/src/review/presentation/requestReview/getStepTypeLabel.ts`:

```ts
/** README 5: step types as people read them. A "review" step is a People step. Pure. */
export const getStepTypeLabel = (type: string): string => {
    if (type === "ai") {
        return "AI";
    }
    if (type === "automation") {
        return "Automation";
    }
    return "People";
};
```

Create `packages/app-workflows/src/review/presentation/requestReview/RequestReviewPresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import type { RequestReviewPick } from "~/review/gateway/IReviewGateway.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import { REVIEW_TITLE_MIN_LENGTH } from "~/review/domain/constants.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import { ReviewerPickerFactory } from "../reviewerPicker/ReviewerPickerFactory.js";
import { classifyReviewActionError } from "../actionDialog/classifyReviewActionError.js";
import { RequestReviewPresenter as Abstraction } from "./abstractions.js";
import type { RequestReviewConflictVm } from "./abstractions.js";
import type { RequestReviewInitParams } from "./abstractions.js";
import type { RequestReviewMode } from "./abstractions.js";
import type { RequestReviewStepVm } from "./abstractions.js";
import { getStepTypeLabel } from "./getStepTypeLabel.js";
import type { ReviewerPickerPresenter } from "../reviewerPicker/abstractions.js";

const SERVER_ERROR = "Could not request the review: the server did not respond. Try again.";
const SHORT_TITLE = "Use at least 5 characters.";

type Status = "loadingSteps" | "stepsFailed" | "ready" | "submitting";

const getLabelTag = (type: string, assignedAutomatically: boolean): string => {
    if (type === "ai") {
        return "AI";
    }
    if (type === "automation") {
        return "Automation";
    }
    if (assignedAutomatically) {
        return "Assigned automatically";
    }
    return "Team pool";
};

class RequestReviewPresenterImpl implements Abstraction.Interface {
    private params: RequestReviewInitParams | null = null;
    private workflow: ReviewWorkflow | null = null;
    private pickers = new Map<string, ReviewerPickerPresenter.Interface>();
    private modes: Record<string, RequestReviewMode> = {};
    private title = "";
    private serverTitleError: string | null = null;
    private status: Status = "loadingSteps";
    private dialogError: string | null = null;
    private conflict: RequestReviewConflictVm | null = null;
    private token = 0;

    constructor(
        private pickerFactory: ReviewerPickerFactory.Interface,
        private toasts: ReviewToasts.Interface
    ) {
        makeAutoObservable<
            RequestReviewPresenterImpl,
            "pickerFactory" | "toasts" | "token" | "params" | "workflow" | "pickers" | "modes"
        >(this, {
            pickerFactory: false,
            toasts: false,
            token: false,
            params: observableRef,
            workflow: observableRef,
            pickers: observableRef,
            modes: observableRef
        });
    }

    get vm(): Abstraction.ViewModel {
        const workflow = this.workflow;
        const steps: RequestReviewStepVm[] = [];

        if (workflow) {
            workflow.steps.forEach((step, index) => {
                const picker = this.pickers.get(step.id);
                const typeLabel = getStepTypeLabel(step.type);
                const labelTag = getLabelTag(step.type, step.assignedAutomatically);
                const noCandidates =
                    picker !== undefined &&
                    !picker.vm.loading &&
                    picker.vm.error === null &&
                    picker.vm.eligibleCount === 0;
                steps.push({
                    stepId: step.id,
                    index: index + 1,
                    title: step.title,
                    color: step.color,
                    typeLabel,
                    labelTag,
                    description: step.description,
                    allowManualPick: step.allowManualPick,
                    mode: this.modes[step.id] ?? "automatic",
                    hasPicker: picker !== undefined,
                    noCandidates
                });
            });
        }

        const trimmed = this.title.trim();
        let titleError = this.serverTitleError;
        if (titleError === null && trimmed.length < REVIEW_TITLE_MIN_LENGTH) {
            titleError = SHORT_TITLE;
        }

        const pickMissing = steps.some(step => {
            if (step.mode !== "pick") {
                return false;
            }
            const picker = this.pickers.get(step.stepId);
            return picker === undefined || picker.vm.value === null;
        });

        return {
            status: this.status,
            title: this.title,
            titleError,
            steps,
            dialogError: this.dialogError,
            conflict: this.conflict,
            canSubmit:
                this.status === "ready" &&
                this.conflict === null &&
                trimmed.length >= REVIEW_TITLE_MIN_LENGTH &&
                !pickMissing
        };
    }

    async init(params: RequestReviewInitParams): Promise<void> {
        const token = this.begin(params);

        try {
            const workflow = await params.useCases.getBoundWorkflow(params.target.namespace);
            if (token !== this.token) {
                return;
            }
            if (workflow === null || workflow.steps.length === 0) {
                this.applyStepsFailed();
                return;
            }

            const created = new Map<string, ReviewerPickerPresenter.Interface>();
            for (const step of workflow.steps) {
                if (step.allowManualPick) {
                    const picker = this.pickerFactory.create();
                    created.set(step.id, picker);
                }
            }
            this.applyWorkflow(workflow, created);

            const loads = Array.from(created.entries()).map(([stepId, picker]) => {
                return picker.init({
                    load: () =>
                        params.useCases.listStepCandidates({
                            workflowId: workflow.id,
                            stepId,
                            target: params.target
                        }),
                    currentOwnerId: null,
                    selectedId: null
                });
            });
            await Promise.all(loads);
            if (token !== this.token) {
                return;
            }
            this.applyReady();
        } catch {
            if (token !== this.token) {
                return;
            }
            this.applyStepsFailed();
        }
    }

    setTitle(title: string): void {
        this.title = title;
        this.serverTitleError = null;
    }

    setMode(stepId: string, mode: RequestReviewMode): void {
        const step = this.vm.steps.find(item => item.stepId === stepId);
        if (!step || !step.allowManualPick) {
            return;
        }
        if (mode === "pick" && step.noCandidates) {
            return;
        }
        this.modes = { ...this.modes, [stepId]: mode };
    }

    getPickerPresenter(stepId: string): ReviewerPickerPresenter.Interface | null {
        return this.pickers.get(stepId) ?? null;
    }

    async retrySteps(): Promise<void> {
        if (!this.params) {
            return;
        }
        await this.init({ ...this.params, targetTitle: this.title });
    }

    async submit(): Promise<void> {
        const params = this.params;
        const workflow = this.workflow;
        if (!params || !workflow || !this.vm.canSubmit) {
            return;
        }

        const picks: RequestReviewPick[] = [];
        this.vm.steps.forEach(step => {
            const picker = this.pickers.get(step.stepId);
            const userId = picker ? picker.vm.value : null;
            if (step.mode === "pick" && userId !== null) {
                picks.push({ stepId: step.stepId, userId });
            }
        });
        const firstStepTitle = workflow.steps[0].title;
        const token = this.token;

        this.startSubmit();

        try {
            await params.useCases.requestReview({
                target: params.target,
                title: this.title.trim(),
                picks
            });
        } catch (error) {
            if (token !== this.token) {
                return;
            }

            const errorKind = classifyReviewActionError(error);

            if (errorKind === "conflict") {
                this.applyConflict();
                return;
            }
            if (errorKind === "validation" && error instanceof GraphQLOperationError) {
                this.applyTitleError(error.message);
                return;
            }
            if (errorKind === "notAuthorized") {
                this.applyDialogError(NO_ACCESS_MESSAGE);
                return;
            }
            this.applyDialogError(SERVER_ERROR);
            return;
        }

        if (token !== this.token) {
            return;
        }

        this.toasts.show({
            kind: "requested",
            stepTitle: firstStepTitle,
            personName: null,
            reviewsUrl: params.reviewsUrl
        });
        this.finishSubmit();
        params.onDone();
    }

    dismiss(): void {
        // A dialog that is submitting stays open: closing it would lose the success path.
        if (this.params && this.status !== "submitting") {
            this.params.onClose();
        }
    }

    dispose(): void {
        this.token += 1;
        this.pickers.forEach(picker => picker.dispose());
        this.params = null;
        this.workflow = null;
        this.pickers = new Map();
        this.modes = {};
        this.title = "";
        this.serverTitleError = null;
        this.status = "loadingSteps";
        this.dialogError = null;
        this.conflict = null;
    }

    private begin(params: RequestReviewInitParams): number {
        this.token += 1;
        this.pickers.forEach(picker => picker.dispose());
        this.params = params;
        this.workflow = null;
        this.pickers = new Map();
        this.modes = {};
        this.title = params.targetTitle;
        this.serverTitleError = null;
        this.status = "loadingSteps";
        this.dialogError = null;
        this.conflict = null;
        return this.token;
    }

    private applyWorkflow(workflow: ReviewWorkflow, pickers: Map<string, ReviewerPickerPresenter.Interface>): void {
        this.workflow = workflow;
        this.pickers = pickers;
    }

    private applyReady(): void {
        this.status = "ready";
    }

    private applyStepsFailed(): void {
        this.status = "stepsFailed";
    }

    private startSubmit(): void {
        this.status = "submitting";
        this.dialogError = null;
        this.serverTitleError = null;
    }

    private finishSubmit(): void {
        this.status = "ready";
    }

    private applyConflict(): void {
        this.status = "ready";
        this.conflict = {
            title: "Someone else acted first",
            message: "Someone else already requested a review for this revision."
        };
    }

    private applyTitleError(message: string): void {
        this.status = "ready";
        this.serverTitleError = message;
    }

    private applyDialogError(message: string): void {
        this.status = "ready";
        this.dialogError = message;
    }
}

export const RequestReviewPresenter = Abstraction.createImplementation({
    implementation: RequestReviewPresenterImpl,
    dependencies: [ReviewerPickerFactory, ReviewToasts]
});
```

Create `packages/app-workflows/src/review/presentation/requestReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { RequestReviewPresenter as Abstraction } from "./abstractions.js";
import { RequestReviewPresenter } from "./RequestReviewPresenter.js";

export const RequestReviewPresenterFeature = createFeature({
    name: "Workflows/RequestReviewPresenter",
    register(container) {
        // Transient (R212): one instance, and its pickers, per mounted dialog.
        container.register(RequestReviewPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
```

Create `packages/app-workflows/src/review/presentation/requestReview/components/RequestReviewDialog.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { Alert } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { RadioGroup } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewTarget } from "~/review/domain/types.js";
import { ReviewerPicker } from "../../reviewerPicker/components/ReviewerPicker.js";
import { RequestReviewPresenterFeature } from "../feature.js";
import type { RequestReviewMode } from "../abstractions.js";
import type { RequestReviewPresenter } from "../abstractions.js";

const PICK_HINT =
    "Picks are checked again when the step is reached. If the person is no longer eligible, a reviewer is assigned automatically.";
const NOBODY_NOTE =
    "No one other than you can review this step right now. It may wait in the team pool until someone reassigns it.";

export interface RequestReviewDialogProps {
    useCases: IReviewUseCases;
    target: ReviewTarget;
    targetTitle: string;
    reviewsUrl: string | null;
    onDone: () => void;
    onClose: () => void;
}

interface RequestReviewDialogViewProps {
    presenter: RequestReviewPresenter.Interface;
}

const RequestReviewDialogView = createReactiveComponent(function RequestReviewDialogView(
    props: RequestReviewDialogViewProps
) {
    const { presenter } = props;
    const { vm } = presenter;
    const collapsed = vm.conflict !== null;

    let titleValidation;
    if (vm.titleError !== null) {
        titleValidation = { isValid: false, message: vm.titleError };
    }

    let actions = (
        <>
            <Dialog.CancelAction />
            <Dialog.ConfirmAction
                text={"Request review"}
                disabled={!vm.canSubmit}
                onClick={() => presenter.submit()}
            />
        </>
    );
    if (collapsed) {
        actions = <Dialog.CancelAction text={"Close"} />;
    }

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open && vm.status !== "submitting") {
                    presenter.dismiss();
                }
            }}
            title={"Request review"}
            loading={vm.status === "submitting"}
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
                <Input
                    label={"Title *"}
                    value={vm.title}
                    onChange={value => presenter.setTitle(value)}
                    disabled={collapsed}
                    validation={titleValidation}
                />
                {vm.status === "loadingSteps" ? (
                    <div className={"flex flex-col gap-sm"}>
                        <Skeleton type={"text"} size={"lg"} />
                        <Skeleton type={"text"} size={"lg"} />
                        <Skeleton type={"text"} size={"lg"} />
                        <Skeleton type={"text"} size={"lg"} />
                    </div>
                ) : null}
                {vm.status === "stepsFailed" ? (
                    <Alert
                        type={"danger"}
                        variant={"subtle"}
                        actions={
                            <Alert.Action text={"Try again"} onClick={() => presenter.retrySteps()} />
                        }
                    >
                        {"Could not load the steps for this review."}
                    </Alert>
                ) : null}
                {vm.steps.map(step => {
                    const picker = presenter.getPickerPresenter(step.stepId);
                    return (
                        <div key={step.stepId} className={"flex flex-col gap-sm"}>
                            <div className={"flex flex-wrap items-center gap-sm"}>
                                <span
                                    className={
                                        "flex h-[24px] w-[24px] items-center justify-center rounded-full text-sm text-neutral-light"
                                    }
                                    style={{ backgroundColor: step.color }}
                                >
                                    {step.index}
                                </span>
                                <Text size={"md"} className={"font-semibold"}>
                                    {step.title}
                                </Text>
                                <Tag variant={"neutral-base-outline"} content={step.typeLabel} />
                                <Tag variant={"neutral-light"} content={step.labelTag} />
                            </div>
                            {step.description ? (
                                <Text size={"sm"} className={"text-neutral-strong"}>
                                    {step.description}
                                </Text>
                            ) : null}
                            {step.allowManualPick ? (
                                <RadioGroup
                                    items={[
                                        { label: "Automatic", value: "automatic" },
                                        {
                                            label: "Choose a person",
                                            value: "pick",
                                            disabled: step.noCandidates
                                        }
                                    ]}
                                    value={step.mode}
                                    onChange={value =>
                                        presenter.setMode(step.stepId, value as RequestReviewMode)
                                    }
                                />
                            ) : null}
                            {step.noCandidates ? (
                                <Alert type={"warning"} variant={"subtle"}>
                                    {NOBODY_NOTE}
                                </Alert>
                            ) : null}
                            {step.mode === "pick" && picker ? (
                                <ReviewerPicker presenter={picker} label={"Reviewer"} hint={PICK_HINT} />
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </Dialog>
    );
});

/** One presenter per mounted dialog (transient, R212): init on mount, dispose on unmount. */
export const RequestReviewDialog = (props: RequestReviewDialogProps) => {
    const { useCases, target, targetTitle, reviewsUrl, onDone, onClose } = props;
    const { presenter } = useFeature(RequestReviewPresenterFeature);

    useEffect(() => {
        presenter.init({ useCases, target, targetTitle, reviewsUrl, onDone, onClose });
        return () => presenter.dispose();
    }, [presenter, target.namespace, target.targetRevisionId]);

    return <RequestReviewDialogView presenter={presenter} />;
};
```

Modify `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.tsx`: mount the request dialog next to the action dialogs, from the view model.

```tsx
// before (imports)
import { ReviewActionDialogs } from "../../actionDialog/components/ReviewActionDialogs.js";
// after
import { ReviewActionDialogs } from "../../actionDialog/components/ReviewActionDialogs.js";
import { RequestReviewDialog } from "../../requestReview/components/RequestReviewDialog.js";
```

```tsx
// before
    const request = toActionRequest(vm.openAction, vm.reviewId);
// after
    const request = toActionRequest(vm.openAction, vm.reviewId);
    const target = { namespace: vm.namespace, targetRevisionId: vm.targetRevisionId };
```

```tsx
// before
        <ReviewActionDialogs
// after
        {vm.openAction !== null && vm.openAction.kind === "request" ? (
            <RequestReviewDialog
                useCases={useCases}
                target={target}
                targetTitle={vm.targetTitle}
                reviewsUrl={reviewsUrl}
                onDone={() => presenter.actionDone()}
                onClose={() => presenter.closeAction()}
            />
        ) : null}
        <ReviewActionDialogs
```

Modify `app.tsx` (import and registration after `ReassignDialogPresenterFeature`):

```tsx
import { RequestReviewPresenterFeature } from "~/review/presentation/requestReview/feature.js";
```

```tsx
            <RegisterFeature feature={ReassignDialogPresenterFeature} />
            <RegisterFeature feature={RequestReviewPresenterFeature} />
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/presentation/requestReview/RequestReviewPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/requestReview/components/RequestReviewDialog.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: PASS. If a radio lookup by name fails, query `screen.getByLabelText("Choose a person")`.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/requestReview/RequestReviewPresenter.test.ts packages/app-workflows/src/review/presentation/requestReview/components/RequestReviewDialog.test.tsx packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
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
git commit -m "feat(app-workflows): add the request review dialog" -m "The dialog previews the workflow steps, prefills the title (at least 5 characters), offers Automatic or Choose a person for steps that allow picks with one private picker per step, and sends picks only for steps with a person chosen. Conflicts, field errors and server errors follow the review dialog rules; the bar mounts the dialog for its request action." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **String the design does not give** (proposal to confirm, R242): the conflict message "Someone else already requested a review for this revision." (README 5 names only the alert title). The server-error text is README 5's; `NotAuthorized` uses the shared QBZ-59 sentence.
- Size: large (five source files, two test files, three small modifications).
