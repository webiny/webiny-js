import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { RequestReviewPresenterFeature } from "../../requestReview/feature.js";
import { ReviewerPickerPresenterFeature } from "../../reviewerPicker/feature.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { ReviewBar } from "./ReviewBar.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createFakePresenter } from "~/review/testing/targetReviewFakes.js";
import { createViewModel } from "~/review/testing/targetReviewFakes.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import type { TargetReviewPresenter } from "../abstractions.js";

const renderBar = (vm: TargetReviewPresenter.ViewModel, onOpenDetails?: () => void) => {
    const presenter = createFakePresenter(vm);
    const useCases = createFakeUseCases();
    const result = renderWithAdminUi(
        <ReviewBar
            presenter={presenter}
            useCases={useCases}
            reviewsUrl={null}
            onOpenDetails={onOpenDetails}
        />
    );
    return { presenter, ...result };
};

describe("ReviewBar", () => {
    it("renders nothing for content without a workflow", () => {
        const { container } = renderBar(createViewModel({ status: "noWorkflow", message: "" }));

        expect(container.querySelector("[data-role='review-bar']")).toBeNull();
        expect(screen.queryByText("Loading review status…")).toBeNull();
    });

    it("renders the skeleton with the loading text and no actions (QBZ-1)", () => {
        renderBar(
            createViewModel({
                status: "loading",
                message: "Loading review status…",
                lockText: null,
                stateTag: null,
                progress: null
            })
        );

        expect(screen.getByText("Loading review status…")).toBeTruthy();
        expect(screen.queryAllByRole("button")).toHaveLength(0);
    });

    it("renders the failed alert with Try again that refreshes the presenter", () => {
        const { presenter } = renderBar(
            createViewModel({
                status: "failed",
                failureKind: "error",
                message: "Could not load the review status",
                lockText: "Editing and publishing are unavailable until it loads.",
                stateTag: null,
                progress: null
            })
        );

        expect(screen.getByText("Could not load the review status")).toBeTruthy();
        expect(
            screen.getByText("Editing and publishing are unavailable until it loads.")
        ).toBeTruthy();
        fireEvent.click(screen.getByText("Try again"));
        expect(presenter.refresh).toHaveBeenCalledTimes(1);
    });

    it("renders a read without access as a message without Try again", () => {
        renderBar(
            createViewModel({
                status: "failed",
                failureKind: "noAccess",
                message:
                    "You don't have access to this content or its review. Ask an administrator if you need it.",
                lockText: null,
                stateTag: null,
                progress: null
            })
        );

        expect(screen.getByText(/You don't have access to this content/)).toBeTruthy();
        expect(screen.queryByText("Try again")).toBeNull();
    });

    it("renders Request review and records the request", () => {
        const { presenter } = renderBar(
            createViewModel({
                status: "none",
                message: "This content needs review before publishing",
                lockText: "Publishing needs an approved review.",
                tile: "rule",
                stateTag: null,
                stepStateTag: null,
                stepMeta: null,
                ownerMeta: null,
                progress: null,
                reviewId: null,
                actions: [
                    {
                        kind: "request",
                        label: "Request review",
                        icon: "send",
                        stepId: null,
                        emphasis: "primary"
                    }
                ]
            })
        );

        expect(screen.getByText("This content needs review before publishing")).toBeTruthy();
        expect(screen.getByText("Publishing needs an approved review.")).toBeTruthy();
        fireEvent.click(screen.getByText("Request review"));
        expect(presenter.openAction).toHaveBeenCalledWith("request", null);
    });

    it("renders message, tag, meta, lock text and the actions in view model order", () => {
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
                        kind: "takeOver",
                        label: "Take over",
                        icon: "front_hand",
                        stepId: "step-2",
                        emphasis: "secondary"
                    },
                    {
                        kind: "approve",
                        label: "Approve",
                        icon: "check",
                        stepId: "step-2",
                        emphasis: "primary"
                    }
                ]
            })
        );

        expect(screen.getByText("Luka Perić is reviewing")).toBeTruthy();
        expect(screen.getByText("Review: In progress")).toBeTruthy();
        expect(screen.getByText("In review")).toBeTruthy();
        expect(screen.getByText("Step 2 of 3: Legal sign-off")).toBeTruthy();
        expect(screen.getByText("Owner: Luka Perić")).toBeTruthy();
        expect(
            screen.getByText(
                "Editing, publishing and moving are locked while this revision is in review."
            )
        ).toBeTruthy();
        const labels = screen
            .getAllByRole("button")
            .map(button => button.textContent)
            .filter(text => ["Cancel review", "Take over", "Approve"].includes(text ?? ""));
        expect(labels).toEqual(["Cancel review", "Take over", "Approve"]);

        fireEvent.click(screen.getByText("Take over"));
        expect(presenter.openAction).toHaveBeenCalledWith("takeOver", "step-2");
    });

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

    it("shows the progress count and opens Review details only when a handler is passed", () => {
        const onOpenDetails = vi.fn();
        const first = renderBar(createViewModel(), onOpenDetails);

        expect(screen.getByText("1 of 3 steps approved")).toBeTruthy();
        fireEvent.click(screen.getByText("Review details"));
        expect(onOpenDetails).toHaveBeenCalledTimes(1);
        first.unmount();

        renderBar(createViewModel());
        expect(screen.queryByText("Review details")).toBeNull();
    });

    it("disables the actions while busy", () => {
        const { presenter } = renderBar(
            createViewModel({
                busy: true,
                actions: [
                    {
                        kind: "approve",
                        label: "Approve",
                        icon: "check",
                        stepId: "step-2",
                        emphasis: "primary"
                    }
                ]
            })
        );

        const button = screen.getByText("Approve").closest("button");
        expect(button?.getAttribute("aria-disabled")).toBe("true");
        fireEvent.click(screen.getByText("Approve"));
        expect(presenter.openAction).not.toHaveBeenCalled();
    });

    it("lists all six step states with owner and the full comment in the popover (QBZ-64)", () => {
        const longComment = "x".repeat(120);
        renderBar(
            createViewModel({
                progress: {
                    approved: 1,
                    total: 6,
                    segments: [
                        {
                            stepId: "s1",
                            title: "Step pending",
                            state: "pending",
                            ownerLabel: "Not reached yet",
                            comment: null
                        },
                        {
                            stepId: "s2",
                            title: "Step awaiting",
                            state: "awaiting",
                            ownerLabel: "Team pool (Legal)",
                            comment: null
                        },
                        {
                            stepId: "s3",
                            title: "Step in review",
                            state: "inReview",
                            ownerLabel: "Luka Perić",
                            comment: null
                        },
                        {
                            stepId: "s4",
                            title: "Step approved",
                            state: "approved",
                            ownerLabel: "Ivan Horvat",
                            comment: "Looks fine."
                        },
                        {
                            stepId: "s5",
                            title: "Step rejected",
                            state: "rejected",
                            ownerLabel: "Ana Legal",
                            comment: longComment
                        },
                        {
                            stepId: "s6",
                            title: "Step failed",
                            state: "failed",
                            ownerLabel: "Step failed",
                            comment: null
                        }
                    ]
                }
            })
        );

        fireEvent.click(screen.getByText("1 of 6 steps approved"));

        const popover = document.querySelector("[data-slot='popover-content']") as HTMLElement;
        const view = within(popover);
        ["Pending", "Awaiting", "In review", "Approved", "Rejected", "Failed"].forEach(label => {
            expect(view.getByText(label)).toBeTruthy();
        });
        expect(view.getByText("Team pool (Legal)")).toBeTruthy();
        expect(view.getByText("Ivan Horvat")).toBeTruthy();
        expect(view.getByText("“Looks fine.”")).toBeTruthy();
        expect(view.getByText(`“${longComment}”`)).toBeTruthy();
    });

    it("opens the popover on hover", () => {
        renderBar(createViewModel());

        fireEvent.mouseEnter(screen.getByText("1 of 3 steps approved"));

        expect(document.querySelector("[data-slot='popover-content']")).not.toBeNull();
    });
});

describe("ReviewBar after a conflict (F1)", () => {
    it("refreshes the bar when the request dialog hits a conflict", async () => {
        const container = new Container();
        container.registerInstance(ReviewToasts, { show: vi.fn() });
        ReviewerPickerPresenterFeature.register(container);
        RequestReviewPresenterFeature.register(container);
        const presenter = createFakePresenter(
            createViewModel({
                status: "none",
                reviewId: null,
                openAction: { kind: "request", stepId: null }
            })
        );
        const useCases = createFakeUseCases();
        useCases.requestReview.mockRejectedValue(
            new GraphQLOperationError({
                message: "Active.",
                code: ReviewErrorCode.AlreadyActive
            })
        );
        renderWithContainer(
            <ReviewBar presenter={presenter} useCases={useCases} reviewsUrl={null} />,
            container
        );
        await screen.findByText("Editorial check");

        fireEvent.click(screen.getByRole("button", { name: "Request review" }));

        expect(await screen.findByText("Someone else acted first")).toBeTruthy();
        await waitFor(() => expect(presenter.refresh).toHaveBeenCalledTimes(1));
        expect(presenter.actionDone).not.toHaveBeenCalled();
    });
});
