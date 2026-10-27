import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { StepState } from "~/review/domain/StepState.js";
import type { StepCandidate } from "~/review/domain/types.js";
import { ReviewerPickerPresenterFeature } from "../../reviewerPicker/feature.js";
import { ReassignDialogPresenterFeature } from "../reassignFeature.js";
import { ReviewActionDialogs } from "./ReviewActionDialogs.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import type { ReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import { registerReviewUseCaseFakes } from "~/review/testing/registerReviewUseCaseFakes.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";

const createContainer = (fakes: ReviewUseCaseFakes) => {
    const container = new Container();
    registerReviewUseCaseFakes(container, fakes);
    container.registerInstance(ReviewToasts, { show: vi.fn() });
    ReviewerPickerPresenterFeature.register(container);
    ReassignDialogPresenterFeature.register(container);
    return container;
};

const createUseCases = (candidates: StepCandidate[]): ReviewUseCaseFakes => {
    const fakes = createReviewUseCaseFakes();
    const owner = createActor({ id: "user-2", displayName: "Luka Perić" });
    const step = createStep({ title: "Legal sign-off", state: StepState.InReview, owner });
    const review = createReview({ steps: [step] });
    const flags = createFlags({ canReassign: true });
    fakes.getReview.execute.mockResolvedValue(createReviewWithFlags(review, flags));
    fakes.listReviewStepCandidates.execute.mockResolvedValue(candidates);
    return fakes;
};

describe("ReassignDialog through ReviewActionDialogs", () => {
    it("shows the nobody-eligible message and only Close", async () => {
        const fakes = createUseCases([
            { id: "user-2", displayName: "Luka Perić", excluded: false, excludedReason: null }
        ]);

        renderWithContainer(
            <ReviewActionDialogs
                namespace={"cms.article"}
                request={{ kind: "reassign", reviewId: "review-1", stepId: "step-1" }}
                reviewsUrl={null}
                onDone={vi.fn()}
                onClose={vi.fn()}
            />,
            createContainer(fakes)
        );

        expect(await screen.findByText("Reassign “Legal sign-off”")).toBeTruthy();
        expect(
            await screen.findByText("Nobody else is eligible to review this step.")
        ).toBeTruthy();
        expect(screen.getByText("Close")).toBeTruthy();
        expect(screen.queryByText("Reassign")).toBeNull();
        expect(
            screen.queryByText("The previous owner (if any) and the new owner are notified.")
        ).toBeNull();
    });

    it("shows the picker, the hint and a disabled Reassign when people are eligible", async () => {
        const fakes = createUseCases([
            { id: "user-3", displayName: "Ivan Horvat", excluded: false, excludedReason: null }
        ]);

        renderWithContainer(
            <ReviewActionDialogs
                namespace={"cms.article"}
                request={{ kind: "reassign", reviewId: "review-1", stepId: "step-1" }}
                reviewsUrl={null}
                onDone={vi.fn()}
                onClose={vi.fn()}
            />,
            createContainer(fakes)
        );

        expect(
            await screen.findByText("The previous owner (if any) and the new owner are notified.")
        ).toBeTruthy();
        const confirm = screen.getByText("Reassign", { selector: "button *, button" });
        expect(confirm.closest("button")?.getAttribute("aria-disabled")).toBe("true");
    });
});
