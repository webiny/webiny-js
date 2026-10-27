import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { within } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { IPermission } from "@webiny/app-admin/domain/Identity.js";
import { StepState } from "~/review/domain/StepState.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { ReviewActionDialogPresenterFeature } from "../../actionDialog/feature.js";
import { ReviewDetailsPresenterFeature } from "../feature.js";
import type { ReviewDetailsDrawerProps } from "./ReviewDetailsDrawer.js";
import { ReviewDetailsDrawer } from "./ReviewDetailsDrawer.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import { createReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import type { ReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import { registerReviewUseCaseFakes } from "~/review/testing/registerReviewUseCaseFakes.js";
import { createFakeActivity } from "~/review/testing/fakeReviewActivity.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import { createStepRunInfo } from "~/review/testing/reviewFixtures.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";
import { at } from "~/review/testing/at.js";
import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";

const createContainer = (fakes: ReviewUseCaseFakes, permissions: IPermission[] = []) => {
    const container = new Container();
    registerReviewUseCaseFakes(container, fakes);
    container.registerInstance(ReviewActivity, createFakeActivity());
    container.registerInstance(IdentityContext, createWorkflowsIdentityContext({ permissions }));
    container.registerInstance(ReviewToasts, { show: vi.fn() });
    ReviewDetailsPresenterFeature.register(container);
    ReviewActionDialogPresenterFeature.register(container);
    return container;
};

const createUseCases = (): ReviewUseCaseFakes => {
    const fakes = createReviewUseCaseFakes();
    const luka = createActor({ id: "user-2", displayName: "Luka Perić" });
    const review = createReview({
        title: "Spring campaign review",
        currentStepId: "s2",
        steps: [
            createStep({
                id: "s1",
                title: "Editorial check",
                state: StepState.Approved,
                owner: luka,
                comment: "Looks fine.",
                reachedOn: new Date().toISOString()
            }),
            createStep({
                id: "s2",
                title: "Legal sign-off",
                state: StepState.Awaiting,
                reachedOn: new Date().toISOString(),
                candidateTeams: [{ id: "t1", name: "Legal" }]
            }),
            createStep({ id: "s3", title: "Brand check", state: StepState.Pending })
        ]
    });
    fakes.getReview.execute.mockResolvedValue(
        createReviewWithFlags(review, createFlags({ canStart: true }))
    );
    return fakes;
};

const renderDrawer = (
    fakes = createUseCases(),
    onClose = vi.fn(),
    permissions: IPermission[] = [],
    extra: Partial<ReviewDetailsDrawerProps> = {}
) => {
    renderWithContainer(
        <ReviewDetailsDrawer
            namespace={"cms.article"}
            reviewId={"review-1"}
            reviewsUrl={null}
            onClose={onClose}
            {...extra}
        />,
        createContainer(fakes, permissions)
    );
    return { fakes, onClose };
};

describe("ReviewDetailsDrawer", () => {
    it("shows the loading text first", () => {
        renderDrawer();

        expect(screen.getByText("Loading review…")).toBeTruthy();
    });

    it("reads the review and runs the nested dialogs on the drawer's namespace (R363)", async () => {
        const fakes = createUseCases();
        renderWithContainer(
            <ReviewDetailsDrawer
                namespace={"wb.page"}
                reviewId={"review-1"}
                reviewsUrl={null}
                onClose={vi.fn()}
            />,
            createContainer(fakes)
        );
        await screen.findByText("Spring campaign review");

        fireEvent.click(screen.getByText("Start", { selector: "button *, button" }));
        await screen.findByText("Start “Legal sign-off”?");
        fireEvent.click(screen.getAllByText("Start", { selector: "button *, button" }).pop()!);

        await waitFor(() => expect(fakes.startReviewStep.execute).toHaveBeenCalledTimes(1));
        expect(fakes.getReview.execute).toHaveBeenCalledWith({
            namespace: "wb.page",
            reviewId: "review-1"
        });
        expect(fakes.startReviewStep.execute).toHaveBeenCalledWith({
            namespace: "wb.page",
            reviewId: "review-1",
            stepId: "s2"
        });
    });

    it("shows the header and the timeline with owner, comment and team pool", async () => {
        renderDrawer();

        expect(await screen.findByText("Spring campaign review")).toBeTruthy();
        expect(screen.getByText("Requester: Maja Kos")).toBeTruthy();
        expect(screen.getByText("Editorial check")).toBeTruthy();
        expect(screen.getByText("Luka Perić: “Looks fine.”")).toBeTruthy();
        expect(screen.getByText("Team pool (Legal)")).toBeTruthy();
        ["Approved", "Awaiting", "Pending"].forEach(label => {
            expect(screen.getAllByText(label).length).toBeGreaterThan(0);
        });
    });

    it("never renders a task id as text", async () => {
        const fakes = createUseCases();
        const loaded = await fakes.getReview.execute({
            namespace: "cms.article",
            reviewId: "review-1"
        });
        const step = loaded.review.steps[0];
        step.type = "ai";
        step.owner = createActor({ type: "ai", displayName: "model" });
        step.startedOn = at(10, 0);
        step.finishedOn = at(10, 5);
        step.taskId = "task-secret-1";
        step.runs = [
            {
                taskId: "task-secret-0",
                startedOn: at(9, 0),
                finishedOn: at(9, 5),
                outcome: "failed",
                reason: "Webhook returned 503"
            }
        ];
        fakes.getReview.execute.mockResolvedValue(loaded);
        renderDrawer(fakes);

        await screen.findByText("Spring campaign review");

        expect(screen.getByText("Webhook returned 503")).toBeTruthy();
        expect(document.body.textContent).not.toContain("task-secret");
    });

    it("shows the full time on hover through the title attribute (QBZ-54)", async () => {
        renderDrawer();
        await screen.findByText("Spring campaign review");

        const requested = screen.getByText(/^Requested:/);

        expect(requested.getAttribute("title")).toMatch(/\d{4}/);
    });

    it("shows the failed state with Try again that reloads", async () => {
        const fakes = createUseCases();
        fakes.getReview.execute.mockRejectedValueOnce(new Error("Network."));
        renderDrawer(fakes);

        expect(await screen.findByText("Could not load review details")).toBeTruthy();
        expect(screen.getByText("The server did not respond. Try again in a moment.")).toBeTruthy();
        fireEvent.click(screen.getByText("Try again"));

        expect(await screen.findByText("Spring campaign review")).toBeTruthy();
    });

    it("shows the footer actions from the flags and opens the same action dialog", async () => {
        renderDrawer();
        await screen.findByText("Spring campaign review");

        fireEvent.click(screen.getByText("Start", { selector: "button *, button" }));

        expect(await screen.findByText("Start “Legal sign-off”?")).toBeTruthy();
    });

    it("opens the action dialog with the editor wording, even from Content Reviews (AD3)", async () => {
        renderDrawer();
        await screen.findByText("Spring campaign review");

        fireEvent.click(screen.getByText("Start", { selector: "button *, button" }));

        expect(
            await screen.findByText(
                "You become the owner of this step and it leaves the team pool."
            )
        ).toBeTruthy();
    });

    it("calls onClose from the close control", async () => {
        const { onClose } = renderDrawer();
        await screen.findByText("Spring campaign review");

        // The drawer header holds the icon-only close control as its first button.
        fireEvent.click(within(screen.getByRole("dialog")).getAllByRole("button")[0]);

        expect(onClose).toHaveBeenCalled();
    });

    it("refreshes itself and tells the host after a conflict (F1)", async () => {
        const fakes = createUseCases();
        fakes.startReviewStep.execute.mockRejectedValue(
            new GraphQLOperationError({
                message: "Conflict.",
                code: ReviewErrorCode.StepNotCurrent
            })
        );
        const onChanged = vi.fn();
        renderWithContainer(
            <ReviewDetailsDrawer
                namespace={"cms.article"}
                reviewId={"review-1"}
                reviewsUrl={null}
                onClose={vi.fn()}
                onChanged={onChanged}
            />,
            createContainer(fakes)
        );
        await screen.findByText("Spring campaign review");
        fireEvent.click(screen.getByText("Start", { selector: "button *, button" }));
        await screen.findByText("Start “Legal sign-off”?");
        const readsBefore = fakes.getReview.execute.mock.calls.length;

        fireEvent.click(screen.getAllByText("Start", { selector: "button *, button" }).pop()!);

        expect(await screen.findByText("Someone else acted first")).toBeTruthy();
        await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
        // One read for the dialog's conflict re-read, one for the drawer's own refresh.
        await waitFor(() =>
            expect(fakes.getReview.execute.mock.calls.length).toBe(readsBefore + 2)
        );
    });
});

const createAiUseCases = (stepOverrides = {}): ReviewUseCaseFakes => {
    const fakes = createReviewUseCaseFakes();
    const review = createReview({
        title: "Spring campaign review",
        currentStepId: "s1",
        steps: [
            createRunningAiStep({
                id: "s1",
                state: StepState.Failed,
                reachedOn: at(9, 0),
                startedOn: at(10, 0),
                finishedOn: at(10, 5),
                comment: "Provider unavailable: request timed out after 60 s",
                taskId: "task-2",
                runs: [
                    {
                        taskId: "task-1",
                        startedOn: at(9, 0),
                        finishedOn: at(9, 5),
                        outcome: "failed",
                        reason: "Webhook returned 503"
                    }
                ],
                issues: [
                    {
                        fieldPath: "body",
                        severity: "error",
                        message: "Tone is too casual.",
                        suggestion: "Use a formal greeting."
                    },
                    {
                        fieldPath: null,
                        severity: "warning",
                        message: "Title is long.",
                        suggestion: null
                    }
                ],
                ...stepOverrides
            })
        ]
    });
    fakes.getReview.execute.mockResolvedValue(createReviewWithFlags(review, createFlags()));
    return fakes;
};

describe("ReviewDetailsDrawer, AI and automation steps (R261, R264)", () => {
    it("shows the attempts oldest first with the current attempt last", async () => {
        renderDrawer(createAiUseCases());

        expect(await screen.findByText("Attempts")).toBeTruthy();
        const rows = Array.from(document.querySelectorAll("[data-role='attempts'] > div")).slice(1);
        expect(rows.map(row => row.textContent)).toEqual([
            "#109:00–09:05FailedWebhook returned 503",
            "#210:00–10:05FailedProvider unavailable: request timed out after 60 s"
        ]);
        const failed = within(rows[0] as HTMLElement).getByText("Failed");
        expect(failed.className).toContain("text-destructive-primary");
        expect(screen.getByText("#1").className).toContain("text-neutral-muted");
    });

    it("shows the failure reason of a failed step in its own box", async () => {
        renderDrawer(createAiUseCases());

        await screen.findByText("Attempts");

        expect(document.querySelector("[data-role='failed-reason']")?.textContent).toBe(
            "Provider unavailable: request timed out after 60 s"
        );
        expect(screen.queryByText(/AI tone check: “/)).toBeNull();
    });

    it("shows the issues the AI reported with severity, field, message and suggestion", async () => {
        renderDrawer(createAiUseCases());

        expect(await screen.findByText("Issues reported by the AI")).toBeTruthy();
        expect(screen.getByText("Error")).toBeTruthy();
        expect(screen.getByText("body")).toBeTruthy();
        expect(screen.getByText("Tone is too casual.")).toBeTruthy();
        expect(screen.getByText("Suggestion: Use a formal greeting.")).toBeTruthy();
        expect(screen.getByText("Warning")).toBeTruthy();
        expect(screen.getByText("Whole content")).toBeTruthy();
        expect(screen.getByText("Title is long.")).toBeTruthy();
        expect(screen.getByText("—")).toBeTruthy();
    });

    it("shows a running step with the Running tag, its icon and the running attempt", async () => {
        renderDrawer(
            createAiUseCases({
                state: StepState.InReview,
                finishedOn: null,
                comment: null,
                runs: [],
                issues: []
            })
        );

        const tag = (await screen.findAllByText("Running"))[0];

        expect(tag.parentElement?.querySelector("[data-testid='svg-icon']")).not.toBeNull();
        expect(screen.getByText("since 10:00")).toBeTruthy();
        const attempts = document.querySelector("[data-role='attempts']") as HTMLElement;
        expect(within(attempts).getByText("Running").className).toContain("text-accent-primary");
        expect(screen.queryByText("Issues reported by the AI")).toBeNull();
    });

    it("shows no attempts and no issues for a step a person reviews", async () => {
        renderDrawer();
        await screen.findByText("Spring campaign review");

        expect(screen.queryByText("Attempts")).toBeNull();
        expect(screen.queryByText("Issues reported by the AI")).toBeNull();
    });
});

describe("ReviewDetailsDrawer, background task panel (R257, R258, R264)", () => {
    const OPERATOR: IPermission[] = [{ name: "workflows", editor: true }];

    // A failed run on top of Task 8's builder defaults.
    const FAILED_RUN: Partial<ReviewStepRunInfo> = {
        status: "failed",
        startedOn: at(9, 0),
        finishedOn: at(9, 5),
        iterations: 3,
        outcome: "failed",
        reason: "Webhook returned 503"
    };

    const getPanel = async (): Promise<HTMLElement> => {
        await waitFor(() =>
            expect(document.querySelector("[data-role='step-run-panel']")).not.toBeNull()
        );
        return document.querySelector("[data-role='step-run-panel']") as HTMLElement;
    };

    it("shows a Background task link per attempt to an operator", async () => {
        renderDrawer(createAiUseCases(), vi.fn(), OPERATOR);

        await screen.findByText("Attempts");

        expect(screen.getAllByText("Background task")).toHaveLength(2);
    });

    it("shows the link to a viewer with only the reassign permission", async () => {
        renderDrawer(createAiUseCases(), vi.fn(), [{ name: "workflows", reassign: true }]);

        await screen.findByText("Attempts");

        expect(screen.getAllByText("Background task")).toHaveLength(2);
    });

    it("hides the link from a viewer who is not an operator", async () => {
        renderDrawer(createAiUseCases());

        await screen.findByText("Attempts");

        expect(screen.queryByText("Background task")).toBeNull();
    });

    it("shows no link for an attempt without a task id", async () => {
        renderDrawer(createAiUseCases({ taskId: null }), vi.fn(), OPERATOR);

        await screen.findByText("Attempts");

        expect(screen.getAllByText("Background task")).toHaveLength(1);
    });

    it("opens the panel with the task of the attempt that was clicked", async () => {
        const fakes = createAiUseCases();
        fakes.getStepRun.execute.mockResolvedValue(createStepRunInfo(FAILED_RUN));
        renderDrawer(fakes, vi.fn(), OPERATOR);
        await screen.findByText("Attempts");

        fireEvent.click(screen.getAllByText("Background task")[0]);

        const panel = await getPanel();
        expect(fakes.getStepRun.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1",
            stepId: "s1",
            taskId: "task-1"
        });
        await within(panel).findByText("Iterations");
        expect(within(panel).getByText("Status")).toBeTruthy();
        expect(within(panel).getByText("Failed")).toBeTruthy();
        expect(within(panel).getByText("Started")).toBeTruthy();
        expect(within(panel).getByText("Finished")).toBeTruthy();
        expect(within(panel).getByText("3")).toBeTruthy();
        expect(within(panel).getByText("Reason")).toBeTruthy();
        expect(within(panel).getByText("Webhook returned 503")).toBeTruthy();
        expect(document.body.textContent).not.toContain("task-1");
    });

    it("opens the current attempt's task from the last row", async () => {
        const fakes = createAiUseCases();
        fakes.getStepRun.execute.mockResolvedValue(
            createStepRunInfo({ ...FAILED_RUN, taskId: "task-2", status: "done" })
        );
        renderDrawer(fakes, vi.fn(), OPERATOR);
        await screen.findByText("Attempts");

        fireEvent.click(screen.getAllByText("Background task")[1]);

        await getPanel();
        expect(fakes.getStepRun.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1",
            stepId: "s1",
            taskId: "task-2"
        });
    });

    it("says the task is no longer available when it is gone", async () => {
        const fakes = createAiUseCases();
        fakes.getStepRun.execute.mockResolvedValue(null);
        renderDrawer(fakes, vi.fn(), OPERATOR);
        await screen.findByText("Attempts");

        fireEvent.click(screen.getAllByText("Background task")[0]);

        expect(await screen.findByText("This task is no longer available.")).toBeTruthy();
    });

    it("shows the error text when the load fails", async () => {
        const fakes = createAiUseCases();
        fakes.getStepRun.execute.mockRejectedValue(new Error("Network."));
        renderDrawer(fakes, vi.fn(), OPERATOR);
        await screen.findByText("Attempts");

        fireEvent.click(screen.getAllByText("Background task")[0]);

        const panel = await getPanel();
        expect(
            await within(panel).findByText("The server did not respond. Try again in a moment.")
        ).toBeTruthy();
    });

    it("closes the panel with Escape and keeps the drawer open", async () => {
        const fakes = createAiUseCases();
        fakes.getStepRun.execute.mockResolvedValue(createStepRunInfo(FAILED_RUN));
        renderDrawer(fakes, vi.fn(), OPERATOR);
        await screen.findByText("Attempts");
        fireEvent.click(screen.getAllByText("Background task")[0]);
        await getPanel();

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

        await waitFor(() =>
            expect(document.querySelector("[data-role='step-run-panel']")).toBeNull()
        );
        expect(screen.getByText("Attempts")).toBeTruthy();
    });
});

describe("ReviewDetailsDrawer, header, timeline and cancelled state (RD1, RD3, P2C-5, RD5)", () => {
    it("holds the eyebrow, title and state tag in the drawer title", async () => {
        renderDrawer();
        await screen.findByText("Spring campaign review");

        const dialog = screen.getByRole("dialog");
        const eyebrow = within(dialog).getByText("Review details");
        expect(eyebrow.className).toContain("text-neutral-muted");
        expect(eyebrow.parentElement?.textContent).toContain("Spring campaign review");
        expect(eyebrow.parentElement?.textContent).toContain("In progress");
    });

    it("holds Content, Requester and Requested in the description", async () => {
        renderDrawer(createUseCases(), vi.fn(), [], { contentTypeLabel: "Article" });
        await screen.findByText("Spring campaign review");

        const content = screen.getByText("Content:");
        const description = content.parentElement as HTMLElement;
        expect(description.textContent).toContain("Requester: Maja Kos");
        expect(description.textContent).toContain("Requested: ");
        expect(content.textContent).toMatch(/^Content: Article · .+ \(#\d+\)$/);
    });

    it("titles the loading drawer Loading review… and the failed one Review details", async () => {
        const fakes = createUseCases();
        fakes.getReview.execute.mockRejectedValueOnce(new Error("Network."));
        renderDrawer(fakes);

        expect(screen.getAllByText("Loading review…").length).toBeGreaterThan(0);
        await screen.findByText("Could not load review details");
        expect(within(screen.getByRole("dialog")).getByText("Review details")).toBeTruthy();
        expect(screen.queryByText("Loading review…")).toBeNull();
    });

    it("makes the content a close button without a content URL", async () => {
        const { onClose } = renderDrawer();
        await screen.findByText("Spring campaign review");

        const link = screen.getByText("Content:").querySelector("button")!;
        fireEvent.click(link);

        expect(onClose).toHaveBeenCalled();
    });

    it("makes the content an anchor with a content URL", async () => {
        renderDrawer(createUseCases(), vi.fn(), [], { contentUrl: "/cms/entries/1" });
        await screen.findByText("Spring campaign review");

        const anchor = screen.getByText("Content:").querySelector("a")!;

        expect(anchor.getAttribute("href")).toBe("/cms/entries/1");
        expect(anchor.className).toContain("text-accent-primary");
    });

    it("draws a 32px state circle per step and a connector line for all but the last", async () => {
        renderDrawer();
        await screen.findByText("Spring campaign review");

        const circles = document.querySelectorAll("[data-role='step-circle']");
        const lines = document.querySelectorAll("[data-role='step-line']");

        expect(circles).toHaveLength(3);
        expect(circles[0].className).toContain("h-[32px]");
        expect(circles[0].className).toContain("w-[32px]");
        expect(lines).toHaveLength(2);
        expect(lines[0].className).toContain("bg-neutral-muted");
    });

    it("renders the issues card before the attempts, with the header inside", async () => {
        renderDrawer(createAiUseCases());
        await screen.findByText("Issues reported by the AI");

        const issues = document.querySelector("[data-role='issues']") as HTMLElement;
        const attempts = document.querySelector("[data-role='attempts']") as HTMLElement;

        expect(
            issues.compareDocumentPosition(attempts) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
        expect(issues.className).toContain("border-sm");
        expect(within(issues).getByText("Issues reported by the AI")).toBeTruthy();
        expect(within(issues).getByText("Tone is too casual.")).toBeTruthy();
    });

    it("renders Background task as a link button with its icon after the text", async () => {
        renderDrawer(createAiUseCases(), vi.fn(), [{ name: "workflows", editor: true }]);
        await screen.findByText("Attempts");

        const button = screen.getAllByText("Background task")[0].closest("button")!;

        expect(button.className).toContain("text-accent-primary");
        expect(button.lastElementChild?.getAttribute("data-testid")).toBe("svg-icon");
    });

    describe("cancelled review", () => {
        const createCancelledUseCases = () => {
            const fakes = createUseCases();
            fakes.getReview.execute.mockImplementation(async () => {
                const loaded = await createUseCases().getReview.execute({
                    namespace: "cms.article",
                    reviewId: "review-1"
                });
                loaded.review.state = ReviewState.Cancelled;
                return loaded;
            });
            return fakes;
        };

        it("shows an empty state with the cancel text and no meta line", async () => {
            renderDrawer(createCancelledUseCases(), vi.fn(), [], { contentUrl: "/c/1" });

            expect(await screen.findByText("This review was cancelled")).toBeTruthy();
            expect(document.querySelector("[data-role='step-circle']")).toBeNull();
            expect(screen.queryByText("Content:")).toBeNull();
            expect(screen.queryByText(/^Requester:/)).toBeNull();
            expect(screen.getByText(/The revision has no review now/)).toBeTruthy();
            const open = screen.getByText("Open content");
            expect(open.closest("a")?.getAttribute("href")).toBe("/c/1");
        });

        it("closes the drawer from Open content without a content URL", async () => {
            const { onClose } = renderDrawer(createCancelledUseCases());
            await screen.findByText("This review was cancelled");

            fireEvent.click(screen.getByText("Open content"));

            expect(onClose).toHaveBeenCalled();
        });
    });
});
