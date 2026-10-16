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
import { StepState } from "~/review/domain/StepState.js";
import { ReviewActionDialogPresenterFeature } from "~/review/presentation/actionDialog/feature.js";
import { ReviewDetailsPresenterFeature } from "~/review/presentation/reviewDetails/feature.js";
import { EditorReviewBar } from "./EditorReviewBar.js";
import { EditorReviewSession } from "../EditorReviewSession.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createFakePresenter } from "~/review/testing/targetReviewFakes.js";
import { createViewModel } from "~/review/testing/targetReviewFakes.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";

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

const createContainer = (toasts: ReviewToasts.Interface) => {
    const container = new Container();
    container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
    container.registerInstance(ReviewToasts, toasts);
    ReviewDetailsPresenterFeature.register(container);
    ReviewActionDialogPresenterFeature.register(container);
    return container;
};

const createSession = (vmOverrides = {}) => {
    const useCases = createFakeUseCases();
    const owner = createActor({ id: "user-2", displayName: "Luka Perić" });
    useCases.getReview.mockResolvedValue(
        createReviewWithFlags(
            createReview({
                title: "Spring campaign review",
                currentStepId: "step-1",
                steps: [createStep({ title: "Legal sign-off", state: StepState.InReview, owner })]
            }),
            createFlags({ canApprove: true })
        )
    );
    const presenter = createFakePresenter(createViewModel(vmOverrides));
    return { session: new EditorReviewSession(presenter, useCases), presenter, useCases };
};

const renderBar = (session: EditorReviewSession) => {
    const toasts = { show: vi.fn<ReviewToasts.Interface["show"]>() };
    renderWithContainer(
        <EditorReviewBar session={session} reviewsRoute={REVIEWS_ROUTE} />,
        createContainer(toasts)
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
        const { session } = createSession();

        renderBar(session);

        expect(screen.getByText("Luka Perić is reviewing")).toBeTruthy();
        expect(screen.getByText("Review details")).toBeTruthy();
    });

    it("passes the reviews url from the route to the dialogs (A76)", async () => {
        const { session } = createSession({
            openAction: { kind: "approve", stepId: "step-1" },
            reviewId: "review-1"
        });
        const toasts = renderBar(session);
        await screen.findByText("Approve “Legal sign-off”");

        fireEvent.click(screen.getByText("Approve", { selector: "button *, button" }));

        await vi.waitFor(() =>
            expect(toasts.show).toHaveBeenCalledWith(
                expect.objectContaining({ kind: "approved", reviewsUrl: "/cms/content-reviews" })
            )
        );
    });

    it("opens the details drawer for the bar's review", async () => {
        const { session, useCases } = createSession();
        renderBar(session);

        fireEvent.click(screen.getByText("Review details"));

        expect(await screen.findByText("Spring campaign review")).toBeTruthy();
        expect(useCases.getReview).toHaveBeenCalledWith("review-1");
    });

    it("keeps the drawer on the review it was opened for when the bar's review changes", async () => {
        const { session, presenter, useCases } = createSession();
        const vmBox = observable.box(presenter.vm, { deep: false });
        Object.defineProperty(presenter, "vm", { get: () => vmBox.get() });
        renderBar(session);
        fireEvent.click(screen.getByText("Review details"));
        await screen.findByText("Spring campaign review");

        runInAction(() => vmBox.set(createViewModel({ reviewId: "review-2" })));

        expect(await screen.findByText("Spring campaign review")).toBeTruthy();
        expect(useCases.getReview).toHaveBeenCalledWith("review-1");
        expect(useCases.getReview).not.toHaveBeenCalledWith("review-2");
    });

    it("refreshes the bar's presenter when an action inside the drawer changed the review", async () => {
        const { session, presenter } = createSession();
        renderBar(session);
        fireEvent.click(screen.getByText("Review details"));
        await screen.findByText("Spring campaign review");

        fireEvent.click(await screen.findByText("Approve", { selector: "button *, button" }));
        await screen.findByText("Approve “Legal sign-off”");
        fireEvent.click(screen.getAllByText("Approve", { selector: "button *, button" }).pop()!);

        await vi.waitFor(() => expect(presenter.refresh).toHaveBeenCalledTimes(1));
    });

    it("renders nothing for content without a workflow", () => {
        const { session } = createSession({ status: "noWorkflow", message: "", progress: null });

        renderBar(session);

        expect(screen.queryByText("Review details")).toBeNull();
    });
});
