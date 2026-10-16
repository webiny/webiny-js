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
        expect(screen.getByText("Reject").closest("button")?.getAttribute("aria-disabled")).toBe(
            "true"
        );
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
            new GraphQLOperationError({
                message: "Conflict.",
                code: "Workflows/Review/StepNotCurrent"
            })
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
            createViewModel({
                openAction: { kind: "approve", stepId: "step-1" },
                reviewId: "review-1"
            })
        );
        renderWithContainer(
            <ReviewBar presenter={presenter} useCases={createUseCases()} reviewsUrl={null} />,
            createContainer()
        );

        expect(await screen.findByText("Approve “Legal sign-off”")).toBeTruthy();
        fireEvent.click(screen.getByText("Cancel"));
        expect(presenter.closeAction).toHaveBeenCalledTimes(1);
    });
});
