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
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
import { ReviewWidgetPresenterFeature } from "../feature.js";
import { ReviewForMeWidget } from "./ReviewForMeWidget.js";
import { ReviewMyRequestsWidget } from "./ReviewMyRequestsWidget.js";

const page = (items: ReturnType<typeof createReviewListItem>[]): ReviewListPage => {
    return { items, meta: { cursor: null, hasMoreItems: false } };
};

const rowProvider: IReviewRowProvider = {
    getBinding: () => {
        return {
            getContentUrl: ref => `/content/${ref.targetId}`,
            getContentTypeLabel: contentTypeId => `Type ${contentTypeId}`
        };
    }
};

type ListResult = ReviewListPage | Error;

// The injected list use case (R355): answers the given results in order, then empty pages.
const createListReviews = (...results: ListResult[]) => {
    const execute = vi.fn<ListReviewsUseCase.Interface["execute"]>();
    execute.mockResolvedValue(page([]));
    results.forEach(result => {
        if (result instanceof Error) {
            execute.mockRejectedValueOnce(result);
            return;
        }
        execute.mockResolvedValueOnce(result);
    });
    return { execute };
};

type ListReviewsFake = ReturnType<typeof createListReviews>;

const viewAllUrl = (tab: ReviewListTab): string => `/content-reviews?tab=${tab}`;

const mount = (ui: React.ReactElement, listReviews: ListReviewsFake, teamCount = 1) => {
    const container = new Container();
    container.registerInstance(ListReviewsUseCase, listReviews);
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

const callsOf = (listReviews: ListReviewsFake, mine: boolean): number => {
    return listReviews.execute.mock.calls.filter(call => {
        return (call[0].list === "myRequests") !== mine;
    }).length;
};

describe("review dashboard widgets", () => {
    it("renders For me to review with its rows, link, step line and View all", async () => {
        const item = createReviewListItem({
            id: "r1",
            targetId: "e1",
            title: "Spring launch",
            stepTitle: "Legal check",
            modelId: "article"
        });
        const listReviews = createListReviews(page([item]));

        mount(
            <ReviewForMeWidget
                app={"cms"}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />,
            listReviews
        );

        expect(await screen.findByText("For me to review")).toBeTruthy();
        const link = await screen.findByRole("link", { name: "Spring launch" });
        expect(link.getAttribute("href")).toBe("/content/e1");
        expect(screen.getByText("Legal check · Type article")).toBeTruthy();
        expect(screen.getByRole("link", { name: "View all →" }).getAttribute("href")).toBe(
            "/content-reviews?tab=assignedToMe"
        );
        expect(listReviews.execute.mock.calls[0][0].app).toBe("cms");
    });

    it("switches the segment and points View all at the matching tab", async () => {
        const listReviews = createListReviews(page([]), page([]));
        mount(
            <ReviewForMeWidget
                app={"cms"}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />,
            listReviews
        );
        await screen.findByText("Nothing assigned to you");

        fireEvent.click(screen.getByRole("radio", { name: "Team pool" }));

        expect(await screen.findByText("Your team pools are empty")).toBeTruthy();
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({ app: "cms", list: "pool" })
        );
        expect(screen.getByRole("link", { name: "View all →" }).getAttribute("href")).toBe(
            "/content-reviews?tab=pool"
        );
    });

    it("tells a viewer in no team so on the Team pool segment (QBZ-73)", async () => {
        const listReviews = createListReviews(page([]), page([]));
        mount(
            <ReviewForMeWidget
                app={"cms"}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />,
            listReviews,
            0
        );
        await screen.findByText("Nothing assigned to you");

        fireEvent.click(screen.getByRole("radio", { name: "Team pool" }));

        expect(await screen.findByText("You’re not in a reviewing team")).toBeTruthy();
    });

    it("renders My requests with its empty state and View all to My requests", async () => {
        const listReviews = createListReviews(page([]));
        mount(
            <ReviewMyRequestsWidget
                app={"wb"}
                namespaces={["wb.page"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />,
            listReviews
        );

        expect(await screen.findByText("My requests")).toBeTruthy();
        expect(await screen.findByText("You haven’t requested any reviews")).toBeTruthy();
        expect(screen.queryByRole("radio")).toBeNull();
        expect(screen.getByRole("link", { name: "View all →" }).getAttribute("href")).toBe(
            "/content-reviews?tab=myRequests"
        );
        expect(listReviews.execute.mock.calls[0][0].app).toBe("wb");
    });

    it("shows the loading skeleton before the first response", async () => {
        const execute = vi.fn<ListReviewsUseCase.Interface["execute"]>();
        const pending = new Promise<ReviewListPage>(() => undefined);
        execute.mockReturnValue(pending);
        mount(
            <ReviewMyRequestsWidget
                app={"cms"}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />,
            { execute }
        );

        expect(await screen.findByTestId("review-widget-loading")).toBeTruthy();
        expect(screen.queryByText("You haven’t requested any reviews")).toBeNull();
    });

    it("shows the error state and retries", async () => {
        const item = createReviewListItem({ id: "r1", title: "Back again" });
        const listReviews = createListReviews(new Error("network"), page([item]));
        mount(
            <ReviewMyRequestsWidget
                app={"cms"}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />,
            listReviews
        );

        expect(await screen.findByText("Could not load reviews.")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(await screen.findByText("Back again")).toBeTruthy();
        expect(listReviews.execute).toHaveBeenCalledTimes(2);
    });

    it("keeps two widgets independent and refreshes only the one whose namespace signals", async () => {
        const mineItem = createReviewListItem({ id: "a", title: "Mine" });
        const requestedItem = createReviewListItem({ id: "b", title: "Requested" });
        // One injected use case answers both widgets, by the list each asks for.
        const execute = vi.fn<ListReviewsUseCase.Interface["execute"]>(async params => {
            if (params.list === "myRequests") {
                return page([requestedItem]);
            }
            return page([mineItem]);
        });
        const listReviews = { execute };
        const { activity } = mount(
            <>
                <ReviewForMeWidget
                    app={"cms"}
                    namespaces={["cms.article"]}
                    rowProvider={rowProvider}
                    viewAllUrl={viewAllUrl}
                />
                <ReviewMyRequestsWidget
                    app={"cms"}
                    namespaces={["wb.page"]}
                    rowProvider={rowProvider}
                    viewAllUrl={viewAllUrl}
                />
            </>,
            listReviews
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

        await vi.waitFor(() => expect(callsOf(listReviews, true)).toBe(2));
        expect(callsOf(listReviews, false)).toBe(1);

        fireEvent.click(screen.getByRole("radio", { name: "Team pool" }));
        await vi.waitFor(() => expect(callsOf(listReviews, true)).toBe(3));
        const requested = within(screen.getByTestId("review-widget-myRequests"));
        expect(requested.getByText("Requested")).toBeTruthy();
        expect(callsOf(listReviews, false)).toBe(1);
    });
});
