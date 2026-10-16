import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { within } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { StepState } from "~/review/domain/StepState.js";
import { ReviewActionDialogPresenterFeature } from "../../actionDialog/feature.js";
import { ReviewDetailsPresenterFeature } from "../feature.js";
import { ReviewDetailsDrawer } from "./ReviewDetailsDrawer.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";

const createContainer = () => {
    const container = new Container();
    container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
    container.registerInstance(ReviewToasts, { show: vi.fn() });
    ReviewDetailsPresenterFeature.register(container);
    ReviewActionDialogPresenterFeature.register(container);
    return container;
};

const createUseCases = () => {
    const useCases = createFakeUseCases();
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
    useCases.getReview.mockResolvedValue(
        createReviewWithFlags(review, createFlags({ canStart: true }))
    );
    return useCases;
};

const renderDrawer = (useCases = createUseCases(), onClose = vi.fn()) => {
    renderWithContainer(
        <ReviewDetailsDrawer
            useCases={useCases}
            reviewId={"review-1"}
            reviewsUrl={null}
            onClose={onClose}
        />,
        createContainer()
    );
    return { useCases, onClose };
};

describe("ReviewDetailsDrawer", () => {
    it("shows the loading text first", () => {
        renderDrawer();

        expect(screen.getByText("Loading review…")).toBeTruthy();
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

    it("does not render runs, issues or the task id (R203)", async () => {
        const useCases = createUseCases();
        const loaded = await useCases.getReview("review-1");
        const step = loaded.review.steps[0];
        step.taskId = "task-secret-1";
        step.runs = [
            {
                taskId: "task-secret-0",
                startedOn: new Date().toISOString(),
                finishedOn: null,
                outcome: "failed",
                reason: "run reason secret"
            }
        ];
        step.issues = [
            {
                fieldPath: null,
                severity: "error",
                message: "issue message secret",
                suggestion: null
            }
        ];
        useCases.getReview.mockResolvedValue(loaded);
        renderDrawer(useCases);

        await screen.findByText("Spring campaign review");

        expect(document.body.textContent).not.toContain("task-secret");
        expect(document.body.textContent).not.toContain("run reason secret");
        expect(document.body.textContent).not.toContain("issue message secret");
    });

    it("shows the full time on hover through the title attribute (QBZ-54)", async () => {
        renderDrawer();
        await screen.findByText("Spring campaign review");

        const requested = screen.getByText(/^Requested:/);

        expect(requested.getAttribute("title")).toMatch(/\d{4}/);
    });

    it("shows the failed state with Try again that reloads", async () => {
        const useCases = createUseCases();
        useCases.getReview.mockRejectedValueOnce(new Error("Network."));
        renderDrawer(useCases);

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

    it("calls onClose from the close control", async () => {
        const { onClose } = renderDrawer();
        await screen.findByText("Spring campaign review");

        // The drawer header holds the icon-only close control as its first button.
        fireEvent.click(within(screen.getByRole("dialog")).getAllByRole("button")[0]);

        expect(onClose).toHaveBeenCalled();
    });
});
