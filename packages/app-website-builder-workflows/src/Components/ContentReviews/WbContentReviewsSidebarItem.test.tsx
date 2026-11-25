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
import type { ReviewListViewProps } from "@webiny/app-workflows/review/presentation/reviewList/components/ReviewListView.js";
import { WbContentReviewsSidebarItem } from "./WbContentReviewsSidebarItem.js";

interface FooterStubProps {
    name: string;
    element: React.ReactElement;
}

interface SidebarItemStubProps {
    text: string;
    onClick: () => void;
}

interface OverlayStubProps {
    barLeft: React.ReactNode;
    children: React.ReactNode;
    onExited: () => void;
}

interface RouteStub {
    name: string;
    pathname: string;
    params: Record<string, unknown>;
}

interface ViewPropsStub {
    current: ReviewListViewProps | null;
}

const router = vi.hoisted(() => {
    return {
        route: {
            name: "WebsiteBuilder/Pages/List",
            pathname: "/website-builder/pages",
            params: {}
        } as RouteStub,
        goToRoute: vi.fn(),
        setRouteParams: vi.fn(),
        replaceRouteParams: vi.fn()
    };
});

const rowProvider = vi.hoisted(() => {
    return { getBinding: () => null };
});

// The props the overlay gave the shared list view.
const viewProps = vi.hoisted((): ViewPropsStub => {
    return { current: null };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const React = await import("react");
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
        useRouter: () => {
            return { goToRoute: router.goToRoute };
        },
        useRoute: () => {
            return {
                route: router.route,
                setRouteParams: router.setRouteParams,
                replaceRouteParams: router.replaceRouteParams
            };
        }
    };
});

vi.mock("@webiny/app", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app")>();
    return {
        ...actual,
        useFeature: () => {
            return { rowProvider };
        }
    };
});

vi.mock(
    "@webiny/app-workflows/review/presentation/reviewList/components/ReviewListView.js",
    async () => {
        const React = await import("react");
        return {
            ReviewListView: (props: ReviewListViewProps) => {
                viewProps.current = props;
                return React.createElement("div", { "data-testid": "review-list" });
            }
        };
    }
);

vi.mock("@webiny/app-website-builder", async () => {
    const React = await import("react");
    const Footer = (props: FooterStubProps) => {
        return React.createElement(
            "div",
            { "data-testid": "footer", "data-name": props.name },
            props.element
        );
    };
    return { PageListConfig: { Browser: { Sidebar: { Footer } } } };
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

describe("WbContentReviewsSidebarItem", () => {
    beforeEach(() => {
        router.route = {
            name: "WebsiteBuilder/Pages/List",
            pathname: "/website-builder/pages",
            params: {}
        };
        viewProps.current = null;
    });

    afterEach(() => {
        cleanup();
        router.goToRoute.mockReset();
        router.setRouteParams.mockReset();
        router.replaceRouteParams.mockReset();
    });

    it("adds a Content Reviews item to the page list footer that opens an overlay, not a route", () => {
        render(<WbContentReviewsSidebarItem />);

        expect(screen.getByTestId("footer").getAttribute("data-name")).toBe("contentReviews");
        expect(screen.queryByTestId("overlay")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Content Reviews" }));

        expect(screen.getByTestId("overlay")).toBeTruthy();
        expect(screen.getByTestId("overlay-bar").textContent).toBe("Content Reviews - Pages");
        expect(router.goToRoute).not.toHaveBeenCalled();
        expect(router.setRouteParams).not.toHaveBeenCalled();
        expect(router.replaceRouteParams).not.toHaveBeenCalled();
    });

    it("lists the page reviews, All with every state, without a content model or the URL", () => {
        render(<WbContentReviewsSidebarItem />);
        fireEvent.click(screen.getByRole("button", { name: "Content Reviews" }));

        expect(viewProps.current).toMatchObject({
            app: "wb",
            rowProvider,
            namespaces: ["wb.page"],
            fixedContentTypeId: null,
            showContentType: false,
            contentTypeFilter: null,
            initialScope: "all",
            initialState: "all",
            title: null
        });
        expect(viewProps.current?.onRouteChange).toBeUndefined();
    });

    it("closes the overlay back to the pages list", () => {
        render(<WbContentReviewsSidebarItem />);
        fireEvent.click(screen.getByRole("button", { name: "Content Reviews" }));

        fireEvent.click(screen.getByRole("button", { name: "Close overlay" }));

        expect(screen.queryByTestId("overlay")).toBeNull();
        expect(screen.getByRole("button", { name: "Content Reviews" })).toBeTruthy();
        expect(router.goToRoute).not.toHaveBeenCalled();
    });

    it("closes when Open content goes to the page editor", async () => {
        const rendered = render(<WbContentReviewsSidebarItem />);
        fireEvent.click(screen.getByRole("button", { name: "Content Reviews" }));

        router.route = {
            name: "WebsiteBuilder/Pages/Editor",
            pathname: "/website-builder/pages/editor/page-1%230001",
            params: { id: "page-1#0001" }
        };
        rendered.rerender(<WbContentReviewsSidebarItem />);

        await waitFor(() => expect(screen.queryByTestId("overlay")).toBeNull());
    });
});
