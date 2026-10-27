import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { ReviewerPickerPresenterFeature } from "../../reviewerPicker/feature.js";
import { RequestReviewPresenterFeature } from "../feature.js";
import { RequestReviewDialog } from "./RequestReviewDialog.js";
import { ReviewBar } from "~/review/presentation/targetReview/components/ReviewBar.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createFakePresenter } from "~/review/testing/fakeTargetReviewPresenter.js";
import { createTargetReviewViewModel } from "~/review/testing/createTargetReviewViewModel.js";
import { TARGET } from "~/review/testing/reviewTarget.js";
import { createWorkflow } from "~/review/testing/createWorkflow.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
import { RequestReviewUseCase } from "~/review/useCases/requestReview/abstractions.js";

// One fake per use case the request presenter injects (R355).
const createUseCaseFakes = () => {
    const workflow = createWorkflow({
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
    });
    const review = createReview();
    return {
        getBoundWorkflow: {
            execute: vi
                .fn<GetBoundWorkflowUseCase.Interface["execute"]>()
                .mockResolvedValue(workflow)
        },
        listStepCandidates: {
            execute: vi.fn<ListStepCandidatesUseCase.Interface["execute"]>().mockResolvedValue([
                {
                    id: "u1",
                    displayName: "Ivan Horvat",
                    teamNames: [],
                    excluded: false,
                    excludedReason: null
                }
            ])
        },
        requestReview: {
            execute: vi.fn<RequestReviewUseCase.Interface["execute"]>().mockResolvedValue(review)
        }
    };
};

type UseCaseFakes = ReturnType<typeof createUseCaseFakes>;

const createContainer = (fakes: UseCaseFakes) => {
    const container = new Container();
    container.registerInstance(GetBoundWorkflowUseCase, fakes.getBoundWorkflow);
    container.registerInstance(ListStepCandidatesUseCase, fakes.listStepCandidates);
    container.registerInstance(RequestReviewUseCase, fakes.requestReview);
    container.registerInstance(ReviewToasts, { show: vi.fn() });
    ReviewerPickerPresenterFeature.register(container);
    RequestReviewPresenterFeature.register(container);
    return container;
};

const renderDialog = (fakes = createUseCaseFakes(), onClose = vi.fn(), onDone = vi.fn()) => {
    renderWithContainer(
        <RequestReviewDialog
            target={TARGET}
            targetTitle={"Spring campaign"}
            reviewsUrl={null}
            onDone={onDone}
            onClose={onClose}
        />,
        createContainer(fakes)
    );
    return { fakes, onClose, onDone };
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

    it("shows no step controls while the candidates are loading", async () => {
        const fakes = createUseCaseFakes();
        fakes.listStepCandidates.execute.mockReturnValue(new Promise(() => undefined));
        renderDialog(fakes);

        await vi.waitFor(() => expect(fakes.listStepCandidates.execute).toHaveBeenCalled());

        expect(screen.queryByText("Editorial check")).toBeNull();
        expect(screen.queryByRole("radio", { name: "Choose a person" })).toBeNull();
        expect(
            document.querySelectorAll("[data-role='skeleton'], [class*='skeleton']").length
        ).toBeGreaterThanOrEqual(4);
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

    it("marks the Title as required with the admin-ui marker and a white Cancel", async () => {
        renderDialog();
        await screen.findByText("Editorial check");

        expect(screen.queryByText("Title *")).toBeNull();
        const label = screen.getByText("Title").closest("label");
        expect(label?.textContent).toBe("Title*");
        expect(within(label as HTMLElement).getByText("*").className).toContain(
            "text-destructive-primary"
        );
        expect(screen.getByText("Cancel").closest("button")?.className).toContain(
            "bg-neutral-base"
        );
    });

    it("lays the steps out as one bordered card under a Steps label", async () => {
        renderDialog();
        await screen.findByText("Editorial check");

        expect(screen.getByText("Steps")).toBeTruthy();
        const card = screen.getByTestId("request-steps");
        expect(card.className).toContain("border");
        expect(card.children.length).toBe(2);
        expect(within(card).getByText("Editorial check").className).not.toContain(
            "text-neutral-strong"
        );
        expect(within(card).getByText("Reads the copy.").className).toContain(
            "text-neutral-strong"
        );
        expect(
            within(card).getAllByText("People")[0].closest("div")?.querySelector("svg")
        ).toBeTruthy();
    });

    it("shows both radios in one row and the pick hint in every mode", async () => {
        renderDialog();
        await screen.findByText("Editorial check");

        const hint =
            "Picks are checked again when the step is reached. If the person is no longer eligible, a reviewer is assigned automatically.";
        expect(screen.getByText(hint)).toBeTruthy();
        const group = screen
            .getByRole("radio", { name: "Automatic" })
            .closest("[role='radiogroup']");
        expect(group?.parentElement?.parentElement?.className).toContain("grid-flow-col");
        expect(screen.queryByText("Reviewer")).toBeNull();

        fireEvent.click(screen.getByRole("radio", { name: "Choose a person" }));
        expect(await screen.findAllByText(hint)).toHaveLength(1);
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
        const fakes = createUseCaseFakes();
        fakes.listStepCandidates.execute.mockResolvedValue([
            {
                id: "u1",
                displayName: "Ivan Horvat",
                teamNames: [],
                excluded: true,
                excludedReason: null
            }
        ]);
        renderDialog(fakes);

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
        const fakes = createUseCaseFakes();
        fakes.getBoundWorkflow.execute.mockRejectedValueOnce(new Error("Network."));
        renderDialog(fakes);

        expect(await screen.findByText("Could not load the steps for this review.")).toBeTruthy();
        fireEvent.click(screen.getByText("Try again"));

        expect(await screen.findByText("Editorial check")).toBeTruthy();
    });

    it("is mounted by the review bar for the request action", async () => {
        const presenter = createFakePresenter(
            createTargetReviewViewModel({
                status: "none",
                reviewKind: "none",
                progress: null,
                reviewId: null,
                openAction: { kind: "request", stepId: null, reviewId: null }
            })
        );
        const fakes = createUseCaseFakes();
        renderWithContainer(
            <ReviewBar presenter={presenter} namespace={TARGET.namespace} reviewsUrl={null} />,
            createContainer(fakes)
        );

        expect(await screen.findByText("Editorial check")).toBeTruthy();
        fireEvent.click(screen.getByText("Cancel"));
        expect(presenter.closeAction).toHaveBeenCalledTimes(1);
    });
});
