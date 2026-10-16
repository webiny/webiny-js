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
            <ReviewBar presenter={presenter} useCases={createUseCases()} reviewsUrl={null} />,
            createContainer()
        );

        expect(await screen.findByText("Editorial check")).toBeTruthy();
        fireEvent.click(screen.getByText("Cancel"));
        expect(presenter.closeAction).toHaveBeenCalledTimes(1);
    });
});
