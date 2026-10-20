import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import { ReviewActivity as ReviewActivityAbstraction } from "~/review/activity/abstractions.js";
import { ReviewActivity } from "~/review/activity/ReviewActivity.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { ReviewWidgetPresenterFeature } from "../feature.js";
import { ReviewForMeWidget } from "./ReviewForMeWidget.js";
import { ReviewMyRequestsWidget } from "./ReviewMyRequestsWidget.js";

const page = (items: ReturnType<typeof createReviewListItem>[]): ReviewListPage => {
    return { items, meta: { cursor: null, hasMoreItems: false } };
};

const rowProvider: IReviewRowProvider = {
    getBinding: () => {
        return {
            useCases: {} as unknown as IReviewUseCases,
            getContentUrl: ref => `/content/${ref.targetId}`,
            getContentTypeLabel: contentTypeId => `Type ${contentTypeId}`
        };
    }
};

type ListResult = ReviewListPage | Error;

const createUseCases = (...results: ListResult[]) => {
    const listReviews = vi.fn<IReviewListUseCases["listReviews"]>();
    listReviews.mockResolvedValue(page([]));
    results.forEach(result => {
        if (result instanceof Error) {
            listReviews.mockRejectedValueOnce(result);
            return;
        }
        listReviews.mockResolvedValueOnce(result);
    });
    const useCases: IReviewListUseCases = { listReviews };
    return { useCases, listReviews };
};

const viewAllUrl = (tab: ReviewListTab): string => `/content-reviews?tab=${tab}`;

const mount = (ui: React.ReactElement, teamCount = 1) => {
    const container = new Container();
    container.register(ReviewActivity).inSingletonScope();
    const teams = Array.from({ length: teamCount }, (_, index) => {
        return { id: `team-${index}`, slug: `team-${index}`, name: `Team ${index}` };
    });
    const identity = { teams } as unknown as Identity;
    container.registerInstance(IdentityContext, {
        getIdentity: () => identity,
        setIdentity: vi.fn(),
        clear: vi.fn()
    });
    ReviewWidgetPresenterFeature.register(container);
    renderWithContainer(ui, container);
    return { activity: container.resolve(ReviewActivityAbstraction) };
};

describe("review dashboard widgets", () => {
    it("renders For me to review with its rows, link, step line and View all", async () => {
        const { useCases } = createUseCases(
            page([
                createReviewListItem({
                    id: "r1",
                    targetId: "e1",
                    title: "Spring launch",
                    stepTitle: "Legal check",
                    modelId: "article"
                })
            ])
        );

        mount(
            <ReviewForMeWidget
                useCases={useCases}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />
        );

        expect(await screen.findByText("For me to review")).toBeTruthy();
        const link = await screen.findByRole("link", { name: "Spring launch" });
        expect(link.getAttribute("href")).toBe("/content/e1");
        expect(screen.getByText("Legal check · Type article")).toBeTruthy();
        expect(screen.getByRole("link", { name: "View all →" }).getAttribute("href")).toBe(
            "/content-reviews?tab=assignedToMe"
        );
    });

    it("switches the segment and points View all at the matching tab", async () => {
        const { useCases, listReviews } = createUseCases(page([]), page([]));
        mount(
            <ReviewForMeWidget
                useCases={useCases}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />
        );
        await screen.findByText("Nothing assigned to you");

        fireEvent.click(screen.getByRole("radio", { name: "Team pool" }));

        expect(await screen.findByText("Your team pools are empty")).toBeTruthy();
        expect(listReviews).toHaveBeenLastCalledWith(expect.objectContaining({ list: "pool" }));
        expect(screen.getByRole("link", { name: "View all →" }).getAttribute("href")).toBe(
            "/content-reviews?tab=pool"
        );
    });

    it("tells a viewer in no team so on the Team pool segment (QBZ-73)", async () => {
        const { useCases } = createUseCases(page([]), page([]));
        mount(
            <ReviewForMeWidget
                useCases={useCases}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />,
            0
        );
        await screen.findByText("Nothing assigned to you");

        fireEvent.click(screen.getByRole("radio", { name: "Team pool" }));

        expect(await screen.findByText("You’re not in a reviewing team")).toBeTruthy();
    });

    it("renders My requests with its empty state and View all to My requests", async () => {
        const { useCases } = createUseCases(page([]));
        mount(
            <ReviewMyRequestsWidget
                useCases={useCases}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />
        );

        expect(await screen.findByText("My requests")).toBeTruthy();
        expect(await screen.findByText("You haven’t requested any reviews")).toBeTruthy();
        expect(screen.queryByRole("radio")).toBeNull();
        expect(screen.getByRole("link", { name: "View all →" }).getAttribute("href")).toBe(
            "/content-reviews?tab=myRequests"
        );
    });

    it("shows the loading skeleton before the first response", async () => {
        const listReviews = vi.fn<IReviewListUseCases["listReviews"]>();
        listReviews.mockReturnValue(new Promise<ReviewListPage>(() => undefined));
        mount(
            <ReviewMyRequestsWidget
                useCases={{ listReviews }}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />
        );

        expect(await screen.findByTestId("review-widget-loading")).toBeTruthy();
        expect(screen.queryByText("You haven’t requested any reviews")).toBeNull();
    });

    it("shows the error state and retries", async () => {
        const { useCases, listReviews } = createUseCases(
            new Error("network"),
            page([createReviewListItem({ id: "r1", title: "Back again" })])
        );
        mount(
            <ReviewMyRequestsWidget
                useCases={useCases}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />
        );

        expect(await screen.findByText("Could not load reviews.")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(await screen.findByText("Back again")).toBeTruthy();
        expect(listReviews).toHaveBeenCalledTimes(2);
    });

    it("keeps two widgets independent and refreshes only the one whose namespace signals", async () => {
        const forMe = createUseCases(page([createReviewListItem({ id: "a", title: "Mine" })]));
        const requests = createUseCases(
            page([createReviewListItem({ id: "b", title: "Requested" })])
        );
        const { activity } = mount(
            <>
                <ReviewForMeWidget
                    useCases={forMe.useCases}
                    namespaces={["cms.article"]}
                    rowProvider={rowProvider}
                    viewAllUrl={viewAllUrl}
                />
                <ReviewMyRequestsWidget
                    useCases={requests.useCases}
                    namespaces={["wb.page"]}
                    rowProvider={rowProvider}
                    viewAllUrl={viewAllUrl}
                />
            </>
        );
        await screen.findByText("Mine");
        await screen.findByText("Requested");

        act(() => {
            activity.notify({
                namespace: "cms.article",
                source: "remote",
                reviewId: null,
                targetRevisionId: null
            });
        });

        await vi.waitFor(() => expect(forMe.listReviews).toHaveBeenCalledTimes(2));
        expect(requests.listReviews).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("radio", { name: "Team pool" }));
        await vi.waitFor(() => expect(forMe.listReviews).toHaveBeenCalledTimes(3));
        const requested = within(screen.getByTestId("review-widget-myRequests"));
        expect(requested.getByText("Requested")).toBeTruthy();
        expect(requests.listReviews).toHaveBeenCalledTimes(1);
    });
});
