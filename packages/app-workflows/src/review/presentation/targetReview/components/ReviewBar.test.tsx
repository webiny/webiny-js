import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
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
import type { ReviewBarLayout } from "./ReviewBarLayout.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createFakePresenter } from "~/review/testing/fakeTargetReviewPresenter.js";
import { createTargetReviewViewModel } from "~/review/testing/createTargetReviewViewModel.js";
import type { TargetReviewPresenter } from "../abstractions.js";
import { createWorkflow } from "~/review/testing/createWorkflow.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { GetTargetReviewUseCase } from "~/review/useCases/getTargetReview/abstractions.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/abstractions.js";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { createFakeActivity } from "~/review/testing/fakeReviewActivity.js";
import { createReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import { registerReviewUseCaseFakes } from "~/review/testing/registerReviewUseCaseFakes.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { TARGET } from "~/review/testing/reviewTarget.js";
import { ReviewActionDialogPresenterFeature } from "../../actionDialog/feature.js";
import { TargetReviewPresenterFeature } from "../feature.js";
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
import { RequestReviewUseCase } from "~/review/useCases/requestReview/abstractions.js";

const renderBar = (
    vm: TargetReviewPresenter.ViewModel,
    onOpenDetails?: () => void,
    layout?: ReviewBarLayout
) => {
    const presenter = createFakePresenter(vm);
    const result = renderWithAdminUi(
        <ReviewBar
            presenter={presenter}
            namespace={"cms.article"}
            reviewsUrl={null}
            onOpenDetails={onOpenDetails}
            layout={layout}
        />
    );
    return { presenter, ...result };
};

describe("ReviewBar", () => {
    it("renders nothing for content without a workflow", () => {
        const { container } = renderBar(
            createTargetReviewViewModel({ status: "noWorkflow", message: "" })
        );

        expect(container.querySelector("[data-role='review-bar']")).toBeNull();
        expect(screen.queryByText("Loading review status…")).toBeNull();
    });

    it("renders the skeleton with the loading text and no actions (QBZ-1)", () => {
        renderBar(
            createTargetReviewViewModel({
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
            createTargetReviewViewModel({
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

    it("renders the failed status inside the bar card with a cloud_off tile and a refresh Try again (QBZ-1)", () => {
        const { container } = renderBar(
            createTargetReviewViewModel({
                status: "failed",
                failureKind: "error",
                message: "Could not load the review status",
                lockText: "Editing and publishing are unavailable until it loads.",
                stateTag: null,
                progress: null
            })
        );

        const card = container.querySelector("[data-role='review-bar']") as HTMLElement;
        expect(card).not.toBeNull();
        expect(within(card).getByText("Could not load the review status")).toBeTruthy();
        expect(
            within(card).getByText("Editing and publishing are unavailable until it loads.")
        ).toBeTruthy();
        const tile = card.querySelector("[data-role='review-bar-failed-tile']") as HTMLElement;
        expect(tile.className).toContain("bg-destructive-subtle");
        expect(tile.querySelector("svg")).not.toBeNull();
        const retry = within(card).getByRole("button", { name: /Try again/ });
        expect(retry.querySelector("svg")).not.toBeNull();
    });

    it("renders a read without access as an EmptyState with a title and body, without Try again (R225)", () => {
        const { container } = renderBar(
            createTargetReviewViewModel({
                status: "failed",
                failureKind: "noAccess",
                message:
                    "You don't have access to this content or its review. Ask an administrator if you need it.",
                lockText: null,
                stateTag: null,
                progress: null
            })
        );

        expect(container.querySelector("[data-role='review-bar']")).toBeNull();
        expect(screen.getByText("You don't have access to this content")).toBeTruthy();
        expect(
            screen.getByText(
                "You don't have access to this content or its review. Ask an administrator if you need it."
            )
        ).toBeTruthy();
        // The EmptyState illustration sits in a centred (text-center) block; the old Alert has none.
        expect(container.querySelector(".text-center svg[aria-hidden='true']")).not.toBeNull();
        expect(screen.queryByText("Try again")).toBeNull();
    });

    it("renders the loading text muted", () => {
        renderBar(
            createTargetReviewViewModel({
                status: "loading",
                message: "Loading review status…",
                lockText: null,
                stateTag: null,
                progress: null
            })
        );

        expect(screen.getByText("Loading review status…").className).toContain(
            "text-neutral-muted"
        );
    });

    it("renders Request review and records the request", () => {
        const { presenter } = renderBar(
            createTargetReviewViewModel({
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
            createTargetReviewViewModel({
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
            createTargetReviewViewModel({
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
        renderBar(createTargetReviewViewModel({ actions: [] }));

        expect(screen.queryByText("Restart")).toBeNull();
    });

    it("shows the progress count and opens Review details only when a handler is passed", () => {
        const onOpenDetails = vi.fn();
        const first = renderBar(createTargetReviewViewModel(), onOpenDetails);

        expect(screen.getByText("1 of 3 steps approved")).toBeTruthy();
        fireEvent.click(screen.getByText("Review details"));
        expect(onOpenDetails).toHaveBeenCalledTimes(1);
        first.unmount();

        renderBar(createTargetReviewViewModel());
        expect(screen.queryByText("Review details")).toBeNull();
    });

    it("disables the actions while busy", () => {
        const { presenter } = renderBar(
            createTargetReviewViewModel({
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
            createTargetReviewViewModel({
                progress: {
                    approved: 1,
                    total: 6,
                    segments: [
                        {
                            stepId: "s1",
                            title: "Step pending",
                            state: "pending",
                            ownerLabel: "Not reached yet",
                            comment: null,
                            tag: { label: "Pending", variant: "neutral-base-outline" },
                            message: null,
                            tooltip: null
                        },
                        {
                            stepId: "s2",
                            title: "Step awaiting",
                            state: "awaiting",
                            ownerLabel: "Team pool (Legal)",
                            comment: null,
                            tag: { label: "Awaiting", variant: "warning" },
                            message: null,
                            tooltip: null
                        },
                        {
                            stepId: "s3",
                            title: "Step in review",
                            state: "inReview",
                            ownerLabel: "Luka Perić",
                            comment: null,
                            tag: { label: "In review", variant: "accent-light" },
                            message: null,
                            tooltip: null
                        },
                        {
                            stepId: "s4",
                            title: "Step approved",
                            state: "approved",
                            ownerLabel: "Ivan Horvat",
                            comment: "Looks fine.",
                            tag: { label: "Approved", variant: "success-light" },
                            message: null,
                            tooltip: null
                        },
                        {
                            stepId: "s5",
                            title: "Step rejected",
                            state: "rejected",
                            ownerLabel: "Ana Legal",
                            comment: longComment,
                            tag: { label: "Rejected", variant: "neutral-dark" },
                            message: null,
                            tooltip: null
                        },
                        {
                            stepId: "s6",
                            title: "Step failed",
                            state: "failed",
                            ownerLabel: "Step failed",
                            comment: null,
                            tag: { label: "Failed", variant: "destructive" },
                            message: null,
                            tooltip: null
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

    it("does not open the popover on hover, so the focus stays where it was (R3)", () => {
        renderBar(createTargetReviewViewModel());
        const editor = document.createElement("input");
        document.body.appendChild(editor);
        editor.focus();

        fireEvent.mouseEnter(screen.getByText("1 of 3 steps approved"));
        fireEvent.mouseOver(screen.getByText("1 of 3 steps approved"));

        expect(document.querySelector("[data-slot='popover-content']")).toBeNull();
        expect(document.activeElement).toBe(editor);
        editor.remove();
    });

    it("opens the popover on click (R3)", () => {
        renderBar(createTargetReviewViewModel());

        fireEvent.click(screen.getByRole("button", { name: "1 of 3 steps approved" }));

        expect(document.querySelector("[data-slot='popover-content']")).not.toBeNull();
    });

    /*
     * The trigger is a native button, so Enter and Space on it are a click in the browser. jsdom
     * does not run that activation, so the test focuses the trigger and clicks the focused element.
     */
    it("opens the popover from the keyboard on the focused trigger (R3)", () => {
        renderBar(createTargetReviewViewModel());
        const trigger = screen.getByRole("button", { name: "1 of 3 steps approved" });
        expect(trigger.tagName).toBe("BUTTON");
        expect(trigger.getAttribute("type")).toBe("button");
        trigger.focus();
        expect(document.activeElement).toBe(trigger);

        fireEvent.click(document.activeElement as HTMLElement);

        expect(document.querySelector("[data-slot='popover-content']")).not.toBeNull();
    });
});

describe("ReviewBar after a conflict (F1)", () => {
    it("refreshes the bar when the request dialog hits a conflict", async () => {
        const container = new Container();
        const workflow = createWorkflow();
        const conflict = new GraphQLOperationError({
            message: "Active.",
            code: ReviewErrorCode.AlreadyActive
        });
        const getBoundWorkflow = {
            execute: vi
                .fn<GetBoundWorkflowUseCase.Interface["execute"]>()
                .mockResolvedValue(workflow)
        };
        const listStepCandidates = {
            execute: vi.fn<ListStepCandidatesUseCase.Interface["execute"]>().mockResolvedValue([])
        };
        const requestReview = {
            execute: vi.fn<RequestReviewUseCase.Interface["execute"]>().mockRejectedValue(conflict)
        };
        container.registerInstance(GetBoundWorkflowUseCase, getBoundWorkflow);
        container.registerInstance(ListStepCandidatesUseCase, listStepCandidates);
        container.registerInstance(RequestReviewUseCase, requestReview);
        container.registerInstance(ReviewToasts, { show: vi.fn() });
        ReviewerPickerPresenterFeature.register(container);
        RequestReviewPresenterFeature.register(container);
        const presenter = createFakePresenter(
            createTargetReviewViewModel({
                status: "none",
                reviewId: null,
                openAction: { kind: "request", stepId: null, reviewId: null }
            })
        );
        renderWithContainer(
            <ReviewBar presenter={presenter} namespace={"cms.article"} reviewsUrl={null} />,
            container
        );
        await screen.findByText("Editorial check");

        fireEvent.click(screen.getByRole("button", { name: "Request review" }));

        expect(await screen.findByText("Someone else acted first")).toBeTruthy();
        await waitFor(() => expect(presenter.refresh).toHaveBeenCalledTimes(1));
        expect(presenter.actionDone).not.toHaveBeenCalled();
    });
});

describe("ReviewBar, an action dialog across a refresh (R2)", () => {
    it("keeps the conflict when the refresh after it leaves the bar without a review", async () => {
        const container = new Container();
        const fakes = createReviewUseCaseFakes();
        const active = createReviewWithFlags(createReview());
        const cancelled = createReviewWithFlags(
            createReview({ state: ReviewState.Cancelled, isActive: false })
        );
        fakes.getReview.execute.mockResolvedValueOnce(active).mockResolvedValue(cancelled);
        fakes.approveReviewStep.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "Conflict.", code: ReviewErrorCode.InvalidState })
        );
        const getTargetReview = {
            execute: vi
                .fn<GetTargetReviewUseCase.Interface["execute"]>()
                .mockResolvedValueOnce(active)
                .mockResolvedValue(null)
        };
        const identity = { teams: [] } as unknown as Identity;
        registerReviewUseCaseFakes(container, fakes);
        container.registerInstance(GetBoundWorkflowUseCase, {
            execute: vi
                .fn<GetBoundWorkflowUseCase.Interface["execute"]>()
                .mockResolvedValue(createWorkflow())
        });
        container.registerInstance(GetTargetReviewUseCase, getTargetReview);
        container.registerInstance(EventPublisher, {
            publish: vi.fn().mockResolvedValue(undefined)
        });
        container.registerInstance(ReviewActivity, createFakeActivity());
        container.registerInstance(IdentityContext, {
            getIdentity: () => identity,
            setIdentity: vi.fn(),
            clear: vi.fn()
        });
        container.registerInstance(ReviewToasts, { show: vi.fn() });
        TargetReviewPresenterFeature.register(container);
        ReviewActionDialogPresenterFeature.register(container);
        const { presenter } = TargetReviewPresenterFeature.resolve(container);
        await presenter.init({
            target: TARGET,
            targetTitle: "Spring campaign",
            canRequest: true,
            isPublished: false,
            isUnpublished: false,
            contentReloader: null
        });
        renderWithContainer(
            <ReviewBar presenter={presenter} namespace={"cms.article"} reviewsUrl={null} />,
            container
        );
        act(() => presenter.openAction("approve", "step-1"));
        await screen.findByText("Approve “Editorial check”");

        fireEvent.click(screen.getByRole("button", { name: "Approve" }));

        expect(await screen.findByText("Someone else acted first")).toBeTruthy();
        await waitFor(() => expect(getTargetReview.execute).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(presenter.vm.status).toBe("none"));
        expect(presenter.vm.reviewId).toBeNull();
        expect(screen.getByText("Someone else acted first")).toBeTruthy();
        expect(
            screen.getByText(/Someone cancelled this review at .+, so your approval/)
        ).toBeTruthy();
    });
});

describe("ReviewBar, running and failed steps (R263, R264)", () => {
    const runningTag = {
        label: "Running",
        variant: "accent-light" as const,
        icon: "progress_activity" as const
    };

    const runningSegment = {
        stepId: "step-1",
        title: "AI tone check",
        state: "inReview" as const,
        ownerLabel: "AI tone check",
        comment: null,
        tag: runningTag,
        message: "AI tone check running since 14:20",
        tooltip: "AI tone check is running since 14:20."
    };

    it("renders the running message, the Running tag with its icon and the meta line", () => {
        renderBar(
            createTargetReviewViewModel({
                message: "AI tone check running since 14:20",
                tile: "progress_activity",
                stepStateTag: runningTag,
                stepStateTooltip: "AI tone check is running since 14:20.",
                stepMeta: "Step 1 of 1: AI tone check",
                ownerMeta: "Owner: AI tone check",
                progress: { approved: 0, total: 1, segments: [runningSegment] }
            })
        );

        expect(screen.getByText("AI tone check running since 14:20")).toBeTruthy();
        const tag = screen.getByText("Running");
        expect(tag.parentElement?.querySelector("[data-testid='svg-icon']")).not.toBeNull();
        expect(
            screen.getByText(
                "Editing, publishing and moving are locked while this revision is in review."
            )
        ).toBeTruthy();
    });

    it("renders the failed message with the Failed tag", () => {
        renderBar(
            createTargetReviewViewModel({
                message: "Notify web team failed: Webhook returned 503 Service Unavailable",
                tile: "sync_problem",
                stepStateTag: { label: "Failed", variant: "destructive" },
                stepStateTooltip:
                    "Notify web team failed. The requester or an operator can restart it.",
                stepMeta: "Step 1 of 1: Notify web team",
                ownerMeta: "Owner: Notify web team"
            })
        );

        expect(
            screen.getByText("Notify web team failed: Webhook returned 503 Service Unavailable")
        ).toBeTruthy();
        expect(screen.getByText("Failed")).toBeTruthy();
    });

    it("shows the run message of a segment in the popover instead of a quoted comment", async () => {
        renderBar(
            createTargetReviewViewModel({
                message: "Luka Perić is reviewing",
                progress: {
                    approved: 1,
                    total: 2,
                    segments: [
                        {
                            stepId: "step-0",
                            title: "Editorial check",
                            state: "approved",
                            ownerLabel: "Ivan Horvat",
                            comment: "Fine.",
                            tag: { label: "Approved", variant: "success-light" },
                            message: null,
                            tooltip: null
                        },
                        runningSegment
                    ]
                }
            })
        );

        fireEvent.click(screen.getByText("1 of 2 steps approved"));

        expect(await screen.findByText("AI tone check running since 14:20")).toBeTruthy();
        expect(screen.getByText("“Fine.”")).toBeTruthy();
        expect(screen.queryByText("“AI tone check running since 14:20”")).toBeNull();
    });
});

describe("ReviewBar, content notice (R262)", () => {
    const AI_TEXT = "Content updated by AI tone check. The editor loaded the latest version.";
    const AUTOMATION_TEXT =
        "Content updated by Notify web team. The editor loaded the latest version.";

    it("shows the notice as a strip inside the bar card with its icon", () => {
        const { container } = renderBar(
            createTargetReviewViewModel({ contentNotice: { text: AI_TEXT, icon: "auto_awesome" } })
        );

        const bar = container.querySelector("[data-role='review-bar']") as HTMLElement;
        const notice = bar.querySelector("[data-role='content-notice']") as HTMLElement;
        expect(notice).not.toBeNull();
        expect(notice.getAttribute("role")).toBe("status");
        expect(notice.textContent).toContain(AI_TEXT);
        expect(notice.className).toContain("bg-success-subtle");
        expect(notice.querySelector("[data-testid='svg-icon']")).not.toBeNull();
    });

    it("shows the notice of an automation step with its own text", () => {
        renderBar(
            createTargetReviewViewModel({ contentNotice: { text: AUTOMATION_TEXT, icon: "bolt" } })
        );

        expect(screen.getByText(AUTOMATION_TEXT)).toBeTruthy();
    });

    it("shows no notice without one", () => {
        const { container } = renderBar(createTargetReviewViewModel());

        expect(container.querySelector("[data-role='content-notice']")).toBeNull();
        expect(screen.queryByText(/Content updated by/)).toBeNull();
    });

    describe("layout", () => {
        const FRAME_CARD = ["mx-md", "rounded-lg", "shadow-sm"];

        it("renders the card by default", () => {
            const { container } = renderBar(createTargetReviewViewModel());

            const bar = container.querySelector("[data-role='review-bar']") as HTMLElement;
            FRAME_CARD.forEach(name => expect(bar.className).toContain(name));
            expect(bar.className).not.toContain("border-b-sm");
        });

        it("renders a full-width strip with a bottom border and no card frame", () => {
            const { container } = renderBar(createTargetReviewViewModel(), undefined, "strip");

            const bar = container.querySelector("[data-role='review-bar']") as HTMLElement;
            FRAME_CARD.forEach(name => expect(bar.className).not.toContain(name));
            expect(bar.className).toContain("border-b-sm");
            expect(bar.className).toContain("border-neutral-dimmed");
            expect(bar.className).toContain("px-md");
            expect(bar.className).toContain("py-sm-extra");
        });

        it("renders the failed state as a strip too", () => {
            const { container } = renderBar(
                createTargetReviewViewModel({
                    status: "failed",
                    failureKind: "error",
                    message: "Could not load the review status",
                    lockText: "Unavailable.",
                    stateTag: null,
                    progress: null
                }),
                undefined,
                "strip"
            );

            const bar = container.querySelector("[data-role='review-bar']") as HTMLElement;
            FRAME_CARD.forEach(name => expect(bar.className).not.toContain(name));
            expect(bar.className).toContain("border-b-sm");
        });

        it("renders the loading skeleton as a strip too", () => {
            const { container } = renderBar(
                createTargetReviewViewModel({
                    status: "loading",
                    message: "Loading review status…"
                }),
                undefined,
                "strip"
            );

            const bar = container.querySelector("[data-role='review-bar-skeleton']") as HTMLElement;
            FRAME_CARD.forEach(name => expect(bar.className).not.toContain(name));
            expect(bar.className).toContain("border-b-sm");
        });
    });
});
