import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { observable } from "mobx";
import { runInAction } from "mobx";
import { Container } from "@webiny/di";
import { Route } from "@webiny/app";
import { RouteUrl } from "@webiny/app/features/router/RouteUrl.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { StepState } from "~/review/domain/StepState.js";
import { ReviewActionDialogPresenterFeature } from "~/review/presentation/actionDialog/feature.js";
import { ReviewDetailsPresenterFeature } from "~/review/presentation/reviewDetails/feature.js";
import { EditorReviewBar } from "./EditorReviewBar.js";
import { EditorReviewSession } from "../EditorReviewSession.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createFakePresenter } from "~/review/testing/fakeTargetReviewPresenter.js";
import { createTargetReviewViewModel } from "~/review/testing/createTargetReviewViewModel.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import { createReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import type { ReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import { registerReviewUseCaseFakes } from "~/review/testing/registerReviewUseCaseFakes.js";
import { createFakeActivity } from "~/review/testing/fakeReviewActivity.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";

vi.mock("@webiny/app", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app")>();
    return {
        ...actual,
        useRouter: () => ({
            getLink: (route: { path: string }) => route.path
        })
    };
});

const REVIEWS_ROUTE = new Route({
    name: "Cms/ContentEntries/WorkflowStateList",
    path: "/cms/content-reviews"
});

const createContainer = (toasts: ReviewToasts.Interface, fakes: ReviewUseCaseFakes) => {
    const container = new Container();
    registerReviewUseCaseFakes(container, fakes);
    container.registerInstance(ReviewActivity, createFakeActivity());
    container.registerInstance(IdentityContext, createWorkflowsIdentityContext());
    container.registerInstance(ReviewToasts, toasts);
    ReviewDetailsPresenterFeature.register(container);
    ReviewActionDialogPresenterFeature.register(container);
    return container;
};

const createSession = (vmOverrides = {}) => {
    const fakes = createReviewUseCaseFakes();
    const owner = createActor({ id: "user-2", displayName: "Luka Perić" });
    const step = createStep({ title: "Legal sign-off", state: StepState.InReview, owner });
    const review = createReview({
        title: "Spring campaign review",
        currentStepId: "step-1",
        steps: [step]
    });
    const flags = createFlags({ canApprove: true });
    const loaded = createReviewWithFlags(review, flags);
    fakes.getReview.execute.mockResolvedValue(loaded);
    const vm = createTargetReviewViewModel(vmOverrides);
    const presenter = createFakePresenter(vm);
    return { session: new EditorReviewSession(presenter), presenter, fakes };
};

const renderBar = (session: EditorReviewSession, fakes: ReviewUseCaseFakes) => {
    const toasts = { show: vi.fn<ReviewToasts.Interface["show"]>() };
    renderWithContainer(
        <EditorReviewBar session={session} reviewsRoute={REVIEWS_ROUTE} />,
        createContainer(toasts, fakes)
    );
    return toasts;
};

describe("RouteUrl (A76)", () => {
    it("turns a route path without params into the plain path string getLink returns", () => {
        expect(RouteUrl.fromPattern(REVIEWS_ROUTE.path)).toBe("/cms/content-reviews");
    });
});

describe("EditorReviewBar", () => {
    it("renders the shared review card for the session", () => {
        const { session, fakes } = createSession();

        renderBar(session, fakes);

        expect(screen.getByText("Luka Perić is reviewing")).toBeTruthy();
        expect(screen.getByText("Review details")).toBeTruthy();
    });

    it("passes the reviews url from the route to the dialogs (A76)", async () => {
        const { session, fakes } = createSession({
            openAction: { kind: "approve", stepId: "step-1" },
            reviewId: "review-1"
        });
        const toasts = renderBar(session, fakes);
        await screen.findByText("Approve “Legal sign-off”");

        fireEvent.click(screen.getByText("Approve", { selector: "button *, button" }));

        await vi.waitFor(() =>
            expect(toasts.show).toHaveBeenCalledWith(
                expect.objectContaining({ kind: "approved", reviewsUrl: "/cms/content-reviews" })
            )
        );
    });

    it("opens the details drawer for the bar's review", async () => {
        const { session, fakes } = createSession();
        renderBar(session, fakes);

        fireEvent.click(screen.getByText("Review details"));

        expect(await screen.findByText("Spring campaign review")).toBeTruthy();
        expect(fakes.getReview.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1"
        });
    });

    it("keeps the drawer on the review it was opened for when the bar's review changes", async () => {
        const { session, presenter, fakes } = createSession();
        const vmBox = observable.box(presenter.vm, { deep: false });
        Object.defineProperty(presenter, "vm", { get: () => vmBox.get() });
        renderBar(session, fakes);
        fireEvent.click(screen.getByText("Review details"));
        await screen.findByText("Spring campaign review");

        runInAction(() => vmBox.set(createTargetReviewViewModel({ reviewId: "review-2" })));

        expect(await screen.findByText("Spring campaign review")).toBeTruthy();
        expect(fakes.getReview.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1"
        });
        expect(fakes.getReview.execute).not.toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-2"
        });
    });

    it("leaves the bar's refresh to the activity signal after an action inside the drawer (R260)", async () => {
        const { session, presenter, fakes } = createSession();
        renderBar(session, fakes);
        fireEvent.click(screen.getByText("Review details"));
        await screen.findByText("Spring campaign review");

        fireEvent.click(await screen.findByText("Approve", { selector: "button *, button" }));
        await screen.findByText("Approve “Legal sign-off”");
        fireEvent.click(screen.getAllByText("Approve", { selector: "button *, button" }).pop()!);

        await vi.waitFor(() => expect(fakes.approveReviewStep.execute).toHaveBeenCalledTimes(1));
        expect(presenter.refresh).not.toHaveBeenCalled();
    });

    it("refreshes the bar's presenter when an action inside the drawer hit a conflict", async () => {
        const { session, presenter, fakes } = createSession();
        fakes.approveReviewStep.execute.mockRejectedValue(
            new GraphQLOperationError({
                message: "Conflict.",
                code: ReviewErrorCode.StepNotCurrent
            })
        );
        renderBar(session, fakes);
        fireEvent.click(screen.getByText("Review details"));
        await screen.findByText("Spring campaign review");

        fireEvent.click(await screen.findByText("Approve", { selector: "button *, button" }));
        await screen.findByText("Approve “Legal sign-off”");
        fireEvent.click(screen.getAllByText("Approve", { selector: "button *, button" }).pop()!);

        expect(await screen.findByText("Someone else acted first")).toBeTruthy();
        await vi.waitFor(() => expect(presenter.refresh).toHaveBeenCalled());
    });

    it("renders nothing for content without a workflow", () => {
        const { session, fakes } = createSession({
            status: "noWorkflow",
            message: "",
            progress: null
        });

        renderBar(session, fakes);

        expect(screen.queryByText("Review details")).toBeNull();
    });

    it("runs the bar's dialogs and the drawer on the namespace of the bar's target (R363)", async () => {
        const { session, fakes } = createSession({ namespace: "wb.page" });
        renderBar(session, fakes);

        fireEvent.click(screen.getByText("Review details"));
        await screen.findByText("Spring campaign review");

        expect(fakes.getReview.execute).toHaveBeenCalledWith({
            namespace: "wb.page",
            reviewId: "review-1"
        });
    });
});
