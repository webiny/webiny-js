import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import type { ReviewListViewProps } from "@webiny/app-workflows/review/presentation/reviewList/components/ReviewListView.js";
import { CmsContentReviewsSidebarItem } from "./CmsContentReviewsSidebarItem.js";

interface FooterStubProps {
    name: string;
    element: React.ReactElement;
}

interface ChildrenStubProps {
    children: React.ReactNode;
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

const router = vi.hoisted(() => {
    return {
        goToRoute: vi.fn(),
        setRouteParams: vi.fn(),
        replaceRouteParams: vi.fn()
    };
});

const rowProvider = vi.hoisted(() => {
    return { getBinding: () => null };
});

const model = vi.hoisted(() => {
    return { publishable: true, modelId: "code-article", name: "Code Article" };
});

// The props the overlay gave the shared list view.
const viewProps = vi.hoisted(() => {
    return { current: null as ReviewListViewProps | null };
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
                route: {
                    name: "Cms/ContentEntries/List",
                    pathname: "/cms/content-entries/code-article",
                    params: { modelId: "code-article" }
                },
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

vi.mock("@webiny/app-headless-cms/admin/config/contentEntries/index.js", async () => {
    const React = await import("react");
    const Footer = (props: FooterStubProps) => {
        return React.createElement(
            "div",
            { "data-testid": "footer", "data-name": props.name },
            props.element
        );
    };
    const Config = ({ children }: ChildrenStubProps) => {
        return React.createElement(React.Fragment, null, children);
    };
    return { ContentEntryListConfig: Object.assign(Config, { Browser: { Sidebar: { Footer } } }) };
});

vi.mock("@webiny/app-headless-cms/exports/admin/cms.js", async () => {
    const React = await import("react");
    return {
        IsModelPublishable: ({ children }: ChildrenStubProps) => {
            return model.publishable ? React.createElement(React.Fragment, null, children) : null;
        }
    };
});

vi.mock("@webiny/app-headless-cms/admin/components/ModelProvider/index.js", () => {
    return {
        useModel: () => {
            return { model: { modelId: model.modelId, name: model.name } };
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

describe("CmsContentReviewsSidebarItem", () => {
    beforeEach(() => {
        model.publishable = true;
        model.modelId = "code-article";
        model.name = "Code Article";
        viewProps.current = null;
        router.goToRoute.mockReset();
        router.setRouteParams.mockReset();
        router.replaceRouteParams.mockReset();
    });

    it("adds a Content Reviews item to the sidebar footer that opens an overlay, not a route", () => {
        render(<CmsContentReviewsSidebarItem />);

        expect(screen.getByTestId("footer").getAttribute("data-name")).toBe("content-reviews");
        expect(screen.queryByTestId("overlay")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Content Reviews" }));

        expect(screen.getByTestId("overlay")).toBeTruthy();
        expect(screen.getByTestId("overlay-bar").textContent).toBe(
            "Content Reviews - Code Article"
        );
        expect(router.goToRoute).not.toHaveBeenCalled();
        expect(router.setRouteParams).not.toHaveBeenCalled();
        expect(router.replaceRouteParams).not.toHaveBeenCalled();
    });

    it("lists only the model's reviews, without the content model column and filter or the URL", () => {
        render(<CmsContentReviewsSidebarItem />);
        fireEvent.click(screen.getByRole("button", { name: "Content Reviews" }));

        expect(viewProps.current).toMatchObject({
            app: "cms",
            rowProvider,
            namespaces: ["cms.code-article"],
            fixedContentTypeId: "code-article",
            showContentType: false,
            contentTypeFilter: null,
            initialScope: "all",
            initialState: "all",
            title: null
        });
        expect(viewProps.current?.onRouteChange).toBeUndefined();
    });

    it("closes the overlay back to the entries list", () => {
        render(<CmsContentReviewsSidebarItem />);
        fireEvent.click(screen.getByRole("button", { name: "Content Reviews" }));

        fireEvent.click(screen.getByRole("button", { name: "Close overlay" }));

        expect(screen.queryByTestId("overlay")).toBeNull();
        expect(screen.getByRole("button", { name: "Content Reviews" })).toBeTruthy();
        expect(router.goToRoute).not.toHaveBeenCalled();
    });

    it("adds no item for a model that cannot publish", () => {
        model.publishable = false;

        render(<CmsContentReviewsSidebarItem />);

        expect(screen.getByTestId("footer")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Content Reviews" })).toBeNull();
    });
});
