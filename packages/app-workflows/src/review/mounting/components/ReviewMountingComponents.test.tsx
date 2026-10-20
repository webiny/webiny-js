import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import { Route } from "@webiny/app/features/router/Route.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewContentReviewsMenu } from "./ReviewContentReviewsMenu.js";
import { ReviewContentReviewsRoute } from "./ReviewContentReviewsRoute.js";
import { ReviewDashboardWidgets } from "./ReviewDashboardWidgets.js";

const routeState = vi.hoisted(() => {
    return { tab: undefined as string | undefined };
});

interface ListViewStubProps {
    app: string;
    namespaces: string[];
    showContentType: boolean;
    contentTypeFilter: { options: unknown[] } | null;
    initialTab?: string;
}

interface WidgetStubProps {
    app: string;
    namespaces: string[];
    viewAllUrl: (tab: string) => string;
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
            return { route: { params: { tab: routeState.tab } } };
        },
        useRouter: () => {
            return {
                getLink: (route: { path: string }, params?: { tab: string }) => {
                    if (params) {
                        return `${route.path}?tab=${params.tab}`;
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
            return React.createElement("div", {
                "data-testid": "list-view",
                "data-app": props.app,
                "data-namespaces": props.namespaces.join(","),
                "data-show-content-type": String(props.showContentType),
                "data-has-filter": String(props.contentTypeFilter !== null),
                "data-initial-tab": props.initialTab ?? ""
            });
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
                "data-url": props.viewAllUrl("pool")
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
                "data-url": props.viewAllUrl("myRequests")
            });
        }
    };
});

const route = new Route({
    name: "Cms/ContentEntries/WorkflowStateList",
    path: "/cms/content-reviews"
});
const rowProvider: IReviewRowProvider = { getBinding: () => null };

describe("ReviewContentReviewsRoute", () => {
    beforeEach(() => {
        routeState.tab = undefined;
    });

    it("registers the route with the title, the breadcrumb and the shared list view", () => {
        render(
            <ReviewContentReviewsRoute
                route={route}
                app={"cms"}
                rowProvider={rowProvider}
                namespaces={["cms.article", "cms.press"]}
                showContentType={true}
                contentTypeFilter={{ options: [{ label: "Article", value: "article" }] }}
                breadcrumbName="cms.content-reviews"
            />
        );

        expect(screen.getByTestId("route").getAttribute("data-name")).toBe(
            "Cms/ContentEntries/WorkflowStateList"
        );
        expect(within(screen.getByTestId("helmet")).getByText("Content Reviews")).toBeTruthy();
        const breadcrumb = screen.getByTestId("breadcrumb");
        expect(breadcrumb.getAttribute("data-name")).toBe("cms.content-reviews");
        expect(breadcrumb.getAttribute("data-label")).toBe("Content Reviews");
        const view = screen.getByTestId("list-view");
        expect(view.getAttribute("data-app")).toBe("cms");
        expect(view.getAttribute("data-namespaces")).toBe("cms.article,cms.press");
        expect(view.getAttribute("data-show-content-type")).toBe("true");
        expect(view.getAttribute("data-has-filter")).toBe("true");
        expect(view.getAttribute("data-initial-tab")).toBe("");
    });

    it("shows a loader instead of the list until the app is ready", () => {
        render(
            <ReviewContentReviewsRoute
                route={route}
                app={"cms"}
                rowProvider={rowProvider}
                namespaces={[]}
                showContentType={true}
                contentTypeFilter={null}
                breadcrumbName="cms.content-reviews"
                ready={false}
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
                namespaces={["wb.page"]}
                showContentType={false}
                contentTypeFilter={null}
                breadcrumbName="wb.content-reviews"
            />
        );

        const view = screen.getByTestId("list-view");
        expect(view.getAttribute("data-app")).toBe("wb");
        expect(view.getAttribute("data-show-content-type")).toBe("false");
        expect(view.getAttribute("data-has-filter")).toBe("false");
    });

    it("opens the tab named by the route parameter and ignores an unknown one", () => {
        routeState.tab = "pool";
        const first = render(
            <ReviewContentReviewsRoute
                route={route}
                app={"cms"}
                rowProvider={rowProvider}
                namespaces={["cms.article"]}
                showContentType={true}
                contentTypeFilter={null}
                breadcrumbName="cms.content-reviews"
            />
        );
        expect(screen.getByTestId("list-view").getAttribute("data-initial-tab")).toBe("pool");
        first.unmount();

        routeState.tab = "failedSteps";
        const second = render(
            <ReviewContentReviewsRoute
                route={route}
                app={"cms"}
                rowProvider={rowProvider}
                namespaces={["cms.article"]}
                showContentType={true}
                contentTypeFilter={null}
                breadcrumbName="cms.content-reviews"
            />
        );
        // The route parses the tab; the list presenter decides whether the viewer may open it.
        expect(screen.getByTestId("list-view").getAttribute("data-initial-tab")).toBe(
            "failedSteps"
        );
        second.unmount();

        routeState.tab = "nonsense";
        render(
            <ReviewContentReviewsRoute
                route={route}
                app={"cms"}
                rowProvider={rowProvider}
                namespaces={["cms.article"]}
                showContentType={true}
                contentTypeFilter={null}
                breadcrumbName="cms.content-reviews"
            />
        );
        expect(screen.getByTestId("list-view").getAttribute("data-initial-tab")).toBe("");
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
    it("registers the two widgets named per prefix in the right column (R231)", () => {
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
            "/cms/content-reviews?tab=pool"
        );
        expect(screen.getByTestId("my-requests").getAttribute("data-url")).toBe(
            "/cms/content-reviews?tab=myRequests"
        );
    });
});
