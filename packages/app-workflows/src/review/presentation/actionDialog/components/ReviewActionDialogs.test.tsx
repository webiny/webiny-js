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
import { ReassignDialogPresenterFeature } from "../reassignFeature.js";
import { ReviewerPickerPresenterFeature } from "../../reviewerPicker/feature.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
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
import { at } from "~/review/testing/at.js";

const createContainer = () => {
    const container = new Container();
    container.registerInstance(ReviewToasts, { show: vi.fn() });
    ReviewActionDialogPresenterFeature.register(container);
    ReviewerPickerPresenterFeature.register(container);
    ReassignDialogPresenterFeature.register(container);
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

    it("forwards listRefreshed and onConflict to the reassign dialog (R220, F1)", async () => {
        const useCases = createUseCases();
        useCases.listReviewStepCandidates.mockResolvedValue([
            { id: "user-3", displayName: "Ivan Horvat", excluded: false, excludedReason: null }
        ]);
        useCases.reassignStep.mockRejectedValue(
            new GraphQLOperationError({
                message: "Conflict.",
                code: ReviewErrorCode.StepNotReassignable
            })
        );
        const onConflict = vi.fn();
        renderWithContainer(
            <ReviewActionDialogs
                useCases={useCases}
                request={{ kind: "reassign", reviewId: "review-1", stepId: "step-1" }}
                reviewsUrl={null}
                listRefreshed={true}
                onConflict={onConflict}
                onDone={onDone}
                onClose={onClose}
            />,
            createContainer()
        );
        await screen.findByText("Reassign “Legal sign-off”");
        fireEvent.click(screen.getByRole("combobox"));
        fireEvent.click(await screen.findByText("Ivan Horvat"));

        fireEvent.click(screen.getByRole("button", { name: "Reassign" }));

        expect(await screen.findByText(/The list has been refreshed\./)).toBeTruthy();
        expect(onConflict).toHaveBeenCalledTimes(1);
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
