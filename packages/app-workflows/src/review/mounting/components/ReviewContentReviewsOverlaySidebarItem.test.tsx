import React from "react";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { within } from "@testing-library/react";
import { Container } from "@webiny/di";
import { AdminUiProvider } from "@webiny/admin-ui";
import { DiContainerProvider } from "@webiny/app";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/ReviewActivity.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewListPresenterFeature } from "~/review/presentation/reviewList/feature.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { ReviewActionDialogPresenterFeature } from "~/review/presentation/actionDialog/feature.js";
import { ReassignDialogPresenterFeature } from "~/review/presentation/actionDialog/reassignFeature.js";
import { ReviewDetailsPresenterFeature } from "~/review/presentation/reviewDetails/feature.js";
import { ReviewerPickerPresenterFeature } from "~/review/presentation/reviewerPicker/feature.js";
import { createReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import { registerReviewUseCaseFakes } from "~/review/testing/registerReviewUseCaseFakes.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";
import { ReviewContentReviewsOverlaySidebarItem } from "./ReviewContentReviewsOverlaySidebarItem.js";

interface OverlayStubProps {
    barLeft: React.ReactNode;
    children: React.ReactNode;
    onExited: () => void;
}

interface SidebarItemStubProps {
    text: string;
    onClick: () => void;
}

interface RouteStub {
    name: string;
    pathname: string;
    params: Record<string, unknown>;
}

const router = vi.hoisted(() => {
    return {
        route: {
            name: "Cms/ContentEntries/List",
            pathname: "/cms/content-entries/article",
            params: { modelId: "article", folderId: "root" }
        } as RouteStub,
        setRouteParams: vi.fn(),
        replaceRouteParams: vi.fn(),
        goToRoute: vi.fn()
    };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const React = await import("react");
    // The overlay layout of app-admin, reduced to its bar title, content and close button.
    const OverlayLayout = (props: OverlayStubProps) => {
        return React.createElement(
            "div",
            { "data-testid": "overlay" },
            React.createElement("div", { "data-testid": "overlay-bar" }, props.barLeft),
            React.createElement("button", { onClick: props.onExited }, "Close overlay"),
            props.children
        );
    };
    return {
        ...actual,
        OverlayLayout,
        useRoute: () => {
            return {
                route: router.route,
                setRouteParams: router.setRouteParams,
                replaceRouteParams: router.replaceRouteParams
            };
        },
        useRouter: () => {
            return { goToRoute: router.goToRoute };
        }
    };
});

vi.mock("@webiny/admin-ui", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/admin-ui")>();
    const React = await import("react");
    const Item = (props: SidebarItemStubProps) => {
        return React.createElement("button", { onClick: props.onClick }, props.text);
    };
    const ItemIcon = () => React.createElement("span");
    const ItemBadge = () => React.createElement("span");
    return {
        ...actual,
        Sidebar: {
            ...actual.Sidebar,
            Item: Object.assign(Item, { Icon: ItemIcon, Badge: ItemBadge })
        }
    };
});

const page = (items: ReturnType<typeof createReviewListItem>[]): ReviewListPage => {
    return { items, meta: { cursor: null, hasMoreItems: false } };
};

const rowProvider: IReviewRowProvider = {
    getBinding: () => {
        return {
            getContentUrl: ref => {
                return `/cms/content-entries/${ref.contentTypeId}?id=${ref.targetRevisionId}`;
            },
            getContentTypeLabel: () => "Article",
            renderContentTypeIcon: () => null
        };
    }
};

const renderItem = () => {
    const container = new Container();
    container.register(ReviewActivity).inSingletonScope();
    container.registerInstance(
        IdentityContext,
        createWorkflowsIdentityContext({
            teams: [{ id: "team-1", slug: "team-1", name: "Team 1" }],
            permissions: [{ name: "workflows", reassign: true }]
        })
    );
    const listReviews = { execute: vi.fn<ListReviewsUseCase.Interface["execute"]>() };
    listReviews.execute.mockResolvedValue(
        page([createReviewListItem({ id: "r1", title: "Article review" })])
    );
    container.registerInstance(ListReviewsUseCase, listReviews);
    registerReviewUseCaseFakes(container, createReviewUseCaseFakes());
    container.registerInstance(ReviewToasts, { show: vi.fn() });
    ReviewListPresenterFeature.register(container);
    ReviewActionDialogPresenterFeature.register(container);
    ReassignDialogPresenterFeature.register(container);
    ReviewerPickerPresenterFeature.register(container);
    ReviewDetailsPresenterFeature.register(container);

    const element = () => (
        <AdminUiProvider>
            <DiContainerProvider container={container}>
                <ReviewContentReviewsOverlaySidebarItem
                    app={"cms"}
                    rowProvider={rowProvider}
                    namespaces={["cms.article"]}
                    fixedContentTypeId={"article"}
                    title={"Content Reviews - Article"}
                    icon={<i />}
                />
            </DiContainerProvider>
        </AdminUiProvider>
    );
    const rendered = render(element());
    // The route changed: the components read `useRoute` again.
    const rerender = () => {
        rendered.rerender(element());
    };
    return { listReviews, rerender };
};

const scopeControl = () => screen.getByRole("radiogroup", { name: "Whose reviews" });

const openOverlay = async () => {
    fireEvent.click(screen.getByRole("button", { name: "Content Reviews" }));
    await screen.findByText("Article review");
};

describe("ReviewContentReviewsOverlaySidebarItem", () => {
    beforeEach(() => {
        router.route = {
            name: "Cms/ContentEntries/List",
            pathname: "/cms/content-entries/article",
            params: { modelId: "article", folderId: "root" }
        };
    });

    afterEach(() => {
        cleanup();
        router.setRouteParams.mockReset();
        router.replaceRouteParams.mockReset();
        router.goToRoute.mockReset();
    });

    it("opens the overlay without navigating and lists only the model's reviews, All with every state", async () => {
        const { listReviews } = renderItem();
        expect(screen.queryByTestId("overlay")).toBeNull();
        expect(listReviews.execute).not.toHaveBeenCalled();

        await openOverlay();

        const bar = screen.getByTestId("overlay-bar");
        expect(within(bar).getByText("Content Reviews - Article")).toBeTruthy();
        expect(listReviews.execute).toHaveBeenCalledTimes(1);
        expect(listReviews.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                app: "cms",
                scope: "all",
                where: { modelId: "article", state: "all" }
            })
        );
        expect(router.goToRoute).not.toHaveBeenCalled();
        expect(router.setRouteParams).not.toHaveBeenCalled();
        expect(router.replaceRouteParams).not.toHaveBeenCalled();
    });

    it("hides the Content model column, its filter and the page heading", async () => {
        renderItem();
        await openOverlay();

        expect(screen.getByText("Name")).toBeTruthy();
        expect(screen.queryByText("Content model")).toBeNull();
        expect(screen.queryByRole("button", { name: "Filter" })).toBeNull();
        expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    });

    it("keeps the scope in memory, never in the URL, and keeps the model on a scope change", async () => {
        const { listReviews } = renderItem();
        await openOverlay();

        fireEvent.click(within(scopeControl()).getByRole("radio", { name: "Requested by me" }));

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(2));
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({
                scope: "myRequests",
                where: { modelId: "article", state: "all" }
            })
        );
        expect(router.goToRoute).not.toHaveBeenCalled();
        expect(router.setRouteParams).not.toHaveBeenCalled();
        expect(router.replaceRouteParams).not.toHaveBeenCalled();
        // The list's own changes do not close the overlay.
        expect(screen.getByTestId("overlay")).toBeTruthy();
    });

    it("closes back to the list and opens fresh again, with All and every state", async () => {
        const { listReviews } = renderItem();
        await openOverlay();
        fireEvent.click(within(scopeControl()).getByRole("radio", { name: "Requested by me" }));
        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(2));

        fireEvent.click(screen.getByRole("button", { name: "Close overlay" }));

        expect(screen.queryByTestId("overlay")).toBeNull();
        expect(screen.getByRole("button", { name: "Content Reviews" })).toBeTruthy();

        await openOverlay();

        expect(listReviews.execute).toHaveBeenCalledTimes(3);
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({
                scope: "all",
                where: { modelId: "article", state: "all" }
            })
        );
        const all = within(scopeControl()).getByRole("radio", { name: "All" });
        expect(all.getAttribute("aria-checked")).toBe("true");
        expect(router.goToRoute).not.toHaveBeenCalled();
    });

    it("closes when the route changes, as Open content does", async () => {
        const { rerender } = renderItem();
        await openOverlay();
        // The same route rendered again keeps the overlay open.
        router.route = { ...router.route, params: { ...router.route.params } };
        rerender();
        expect(screen.getByTestId("overlay")).toBeTruthy();

        router.route = {
            ...router.route,
            params: { ...router.route.params, id: "entry-1#0001" }
        };
        rerender();

        await waitFor(() => expect(screen.queryByTestId("overlay")).toBeNull());
        expect(screen.getByRole("button", { name: "Content Reviews" })).toBeTruthy();
    });
});
