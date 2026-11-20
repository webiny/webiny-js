import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Route } from "@webiny/app/features/router/Route.js";
import type { IReviewContentTypesSource } from "~/review/presentation/reviewList/IReviewContentTypesSource.js";
import type { ReviewContentTypeOption } from "~/review/presentation/reviewList/IReviewContentTypeFilter.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewContentReviewsMenu } from "./ReviewContentReviewsMenu.js";
import { ReviewContentReviewsRoute } from "./ReviewContentReviewsRoute.js";
import { ReviewDashboardWidgets } from "./ReviewDashboardWidgets.js";

const routeState = vi.hoisted(() => {
    return { scope: undefined as string | undefined, state: undefined as string | undefined };
});

type RouteParamsUpdate = (current: Record<string, unknown>) => Record<string, unknown>;

const replaceRouteParams = vi.hoisted(() => {
    return vi.fn<(update: RouteParamsUpdate) => void>();
});

interface RouteChangeStubParams {
    scope: string | null;
    state: string | null;
}

interface ListViewStubProps {
    app: string;
    namespaces: string[];
    showContentType: boolean;
    contentTypeFilter: { options: unknown[] } | null;
    initialScope?: string | null;
    initialState?: string | null;
    onRouteChange?: (params: RouteChangeStubParams) => void;
}

interface WidgetStubProps {
    app: string;
    namespaces: string[];
    viewAllUrl: (scope: string, state: string) => string;
}

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const { createAdminConfigStub } = await import("~/review/testing/adminConfigStub.js");
    const stub = createAdminConfigStub();
    return {
        ...actual,
        AdminConfig: stub.AdminConfig,
        AdminLayout: stub.AdminLayout,
        useRoute: () => {
            return {
                route: { params: { scope: routeState.scope, state: routeState.state } },
                replaceRouteParams
            };
        },
        useRouter: () => {
            return {
                getLink: (route: { path: string }, params?: { scope: string; state: string }) => {
                    if (params) {
                        return `${route.path}?scope=${params.scope}&state=${params.state}`;
                    }
                    return route.path;
                }
            };
        }
    };
});

vi.mock("react-helmet", async () => {
    const React = await import("react");
    return {
        default: ({ children }: { children: React.ReactNode }) => {
            return React.createElement("div", { "data-testid": "helmet" }, children);
        }
    };
});

vi.mock("~/review/presentation/reviewList/components/ReviewListView.js", async () => {
    const React = await import("react");
    return {
        ReviewListView: (props: ListViewStubProps) => {
            return React.createElement(
                "div",
                {
                    "data-testid": "list-view",
                    "data-app": props.app,
                    "data-namespaces": props.namespaces.join(","),
                    "data-show-content-type": String(props.showContentType),
                    "data-has-filter": String(props.contentTypeFilter !== null),
                    "data-initial-scope": props.initialScope ?? "",
                    "data-initial-state": props.initialState ?? ""
                },
                React.createElement("button", {
                    "data-testid": "route-change",
                    onClick: () => props.onRouteChange?.({ scope: "pool", state: "all" })
                })
            );
        }
    };
});

vi.mock("~/review/presentation/reviewWidget/components/ReviewForMeWidget.js", async () => {
    const React = await import("react");
    return {
        ReviewForMeWidget: (props: WidgetStubProps) => {
            return React.createElement("div", {
                "data-testid": "for-me",
                "data-app": props.app,
                "data-namespaces": props.namespaces.join(","),
                "data-url": props.viewAllUrl("pool", "inReview")
            });
        }
    };
});

vi.mock("~/review/presentation/reviewWidget/components/ReviewMyRequestsWidget.js", async () => {
    const React = await import("react");
    return {
        ReviewMyRequestsWidget: (props: WidgetStubProps) => {
            return React.createElement("div", {
                "data-testid": "my-requests",
                "data-app": props.app,
                "data-url": props.viewAllUrl("myRequests", "all")
            });
        }
    };
});

const route = new Route({
    name: "Cms/ContentEntries/WorkflowStateList",
    path: "/cms/content-reviews"
});
const rowProvider: IReviewRowProvider = { getBinding: () => null };

const contentTypes = (
    namespaces: string[],
    options: ReviewContentTypeOption[] = [],
    loading = false
): IReviewContentTypesSource => {
    return { vm: { loading, namespaces, options } };
};

describe("ReviewContentReviewsRoute", () => {
    beforeEach(() => {
        routeState.scope = undefined;
        routeState.state = undefined;
        replaceRouteParams.mockClear();
    });

    it("registers the route with the title, the breadcrumb and the shared list view", () => {
        render(
            <ReviewContentReviewsRoute
                route={route}
                app={"cms"}
                rowProvider={rowProvider}
                showContentType={true}
                contentTypes={contentTypes(
                    ["cms.article", "cms.press"],
                    [{ label: "Article", value: "article", app: "cms", icon: "devices_other" }]
                )}
                breadcrumbName="cms.content-reviews"
            />
        );

        expect(screen.getByTestId("route").getAttribute("data-name")).toBe(
            "Cms/ContentEntries/WorkflowStateList"
        );
        // React 19 hoists a rendered <title> into document.head, out of the mocked Helmet.
        expect(document.head.querySelector("title")?.textContent).toBe("Content Reviews");
        const breadcrumb = screen.getByTestId("breadcrumb");
        expect(breadcrumb.getAttribute("data-name")).toBe("cms.content-reviews");
        expect(breadcrumb.getAttribute("data-label")).toBe("Content Reviews");
        const view = screen.getByTestId("list-view");
        expect(view.getAttribute("data-app")).toBe("cms");
        expect(view.getAttribute("data-namespaces")).toBe("cms.article,cms.press");
        expect(view.getAttribute("data-show-content-type")).toBe("true");
        expect(view.getAttribute("data-has-filter")).toBe("true");
        expect(view.getAttribute("data-initial-scope")).toBe("");
    });

    it("shows a loader instead of the list while the content types load", () => {
        render(
            <ReviewContentReviewsRoute
                route={route}
                app={"cms"}
                rowProvider={rowProvider}
                showContentType={true}
                contentTypes={contentTypes([], [], true)}
                breadcrumbName="cms.content-reviews"
            />
        );

        expect(screen.queryByTestId("list-view")).toBeNull();
        expect(screen.getByTestId("route")).toBeTruthy();
    });

    it("passes no content type column or filter through for an app without them", () => {
        render(
            <ReviewContentReviewsRoute
                route={route}
                app={"wb"}
                rowProvider={rowProvider}
                showContentType={false}
                contentTypes={contentTypes(["wb.page"])}
                breadcrumbName="wb.content-reviews"
            />
        );

        const view = screen.getByTestId("list-view");
        expect(view.getAttribute("data-app")).toBe("wb");
        expect(view.getAttribute("data-show-content-type")).toBe("false");
        expect(view.getAttribute("data-has-filter")).toBe("false");
    });

    it("replaces the scope and state in the route query when the list changes them", () => {
        routeState.scope = "assignedToMe";
        routeState.state = "inReview";
        render(
            <ReviewContentReviewsRoute
                route={route}
                app={"cms"}
                rowProvider={rowProvider}
                showContentType={true}
                contentTypes={contentTypes(["cms.article"])}
                breadcrumbName="cms.content-reviews"
            />
        );

        fireEvent.click(screen.getByTestId("route-change"));

        expect(replaceRouteParams).toHaveBeenCalledTimes(1);
        const update = replaceRouteParams.mock.calls[0][0];
        expect(update({ scope: "assignedToMe", state: "inReview", other: "kept" })).toEqual({
            scope: "pool",
            state: "all",
            other: "kept"
        });
    });

    it("opens the scope and state named by the route parameters and ignores unknown ones", () => {
        const renderRoute = () => {
            return render(
                <ReviewContentReviewsRoute
                    route={route}
                    app={"cms"}
                    rowProvider={rowProvider}
                    showContentType={true}
                    contentTypes={contentTypes(["cms.article"])}
                    breadcrumbName="cms.content-reviews"
                />
            );
        };
        const initial = () => {
            const view = screen.getByTestId("list-view");
            return [
                view.getAttribute("data-initial-scope"),
                view.getAttribute("data-initial-state")
            ];
        };

        routeState.scope = "pool";
        routeState.state = "inReview";
        const first = renderRoute();
        expect(initial()).toEqual(["pool", "inReview"]);
        first.unmount();

        // The route parses the values; the list presenter decides whether the viewer may open them.
        routeState.scope = "all";
        routeState.state = "failed";
        const second = renderRoute();
        expect(initial()).toEqual(["all", "failed"]);
        second.unmount();

        routeState.scope = "failedSteps";
        routeState.state = "awaiting";
        renderRoute();
        expect(initial()).toEqual(["", ""]);
    });
});

describe("ReviewContentReviewsMenu", () => {
    it("renders one Content Reviews link to the route under its group", () => {
        render(
            <ReviewContentReviewsMenu
                name="workflows.cms.contentReviews"
                route={route}
                parent="headlessCMS"
            />
        );

        const menu = screen.getByTestId("menu");
        expect(menu.getAttribute("data-name")).toBe("workflows.cms.contentReviews");
        expect(menu.getAttribute("data-parent")).toBe("headlessCMS");
        const link = screen.getByTestId("menu-link");
        expect(link.getAttribute("href")).toBe("/cms/content-reviews");
        expect(link.textContent).toBe("Content Reviews");
    });

    it("is top level without a parent", () => {
        render(<ReviewContentReviewsMenu name="workflows.wb.contentReviews" route={route} />);

        expect(screen.getByTestId("menu").getAttribute("data-parent")).toBe("");
    });
});

describe("ReviewDashboardWidgets", () => {
    it("registers the two widgets named per prefix in the right column, For me first (R231)", () => {
        render(
            <ReviewDashboardWidgets
                prefix="cms"
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllRoute={route}
            />
        );

        const widgets = screen.getAllByTestId("widget");
        expect(widgets.map(widget => widget.getAttribute("data-name"))).toEqual([
            "workflows.cms.review",
            "workflows.cms.requested"
        ]);
        expect(widgets.map(widget => widget.getAttribute("data-column"))).toEqual([
            "right",
            "right"
        ]);
        expect(screen.getByTestId("for-me").getAttribute("data-namespaces")).toBe("cms.article");
        expect(screen.getByTestId("for-me").getAttribute("data-app")).toBe("cms");
        expect(screen.getByTestId("my-requests").getAttribute("data-app")).toBe("cms");
    });

    it("registers no widget until the app is ready", () => {
        render(
            <ReviewDashboardWidgets
                prefix="cms"
                namespaces={[]}
                rowProvider={rowProvider}
                viewAllRoute={route}
                ready={false}
            />
        );

        expect(screen.queryAllByTestId("widget")).toHaveLength(0);
    });

    it("names the Website Builder widgets with the wb prefix and builds View all links with the tab", () => {
        render(
            <ReviewDashboardWidgets
                prefix="wb"
                namespaces={["wb.page"]}
                rowProvider={rowProvider}
                viewAllRoute={route}
            />
        );

        expect(
            screen.getAllByTestId("widget").map(widget => widget.getAttribute("data-name"))
        ).toEqual(["workflows.wb.review", "workflows.wb.requested"]);
        expect(screen.getByTestId("for-me").getAttribute("data-app")).toBe("wb");
        expect(screen.getByTestId("for-me").getAttribute("data-url")).toBe(
            "/cms/content-reviews?scope=pool&state=inReview"
        );
        expect(screen.getByTestId("my-requests").getAttribute("data-url")).toBe(
            "/cms/content-reviews?scope=myRequests&state=all"
        );
    });
});
