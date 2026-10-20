import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import type { IReviewContentAdapter } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";
import type { IReviewRowProvider } from "@webiny/app-workflows/review/presentation/reviewList/abstractions.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter/abstractions.js";
import { WbReviewRowProvider } from "~/features/gateway/WbReviewRowProvider/abstractions.js";
import { Routes } from "~/routes.js";
import { WbContentReviews } from "./WbContentReviews.js";

interface RouteStubProps {
    route: { name: string };
    app: string;
    namespaces: string[];
    showContentType: boolean;
    contentTypeFilter: unknown;
    breadcrumbName: string;
}

interface MenuStubProps {
    name: string;
    route: { name: string };
    parent?: string;
}

interface WidgetsStubProps {
    prefix: string;
    namespaces: string[];
    viewAllRoute: { name: string };
}

vi.mock(
    "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsRoute.js",
    async () => {
        const React = await import("react");
        return {
            ReviewContentReviewsRoute: (props: RouteStubProps) => {
                return React.createElement("div", {
                    "data-testid": "route",
                    "data-route": props.route.name,
                    "data-app": props.app,
                    "data-namespaces": props.namespaces.join(","),
                    "data-show-content-type": String(props.showContentType),
                    "data-filter": String(props.contentTypeFilter),
                    "data-breadcrumb": props.breadcrumbName
                });
            }
        };
    }
);

vi.mock(
    "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsMenu.js",
    async () => {
        const React = await import("react");
        return {
            ReviewContentReviewsMenu: (props: MenuStubProps) => {
                return React.createElement("div", {
                    "data-testid": "menu",
                    "data-name": props.name,
                    "data-route": props.route.name,
                    "data-parent": props.parent ?? ""
                });
            }
        };
    }
);

vi.mock("@webiny/app-workflows/review/mounting/components/ReviewDashboardWidgets.js", async () => {
    const React = await import("react");
    return {
        ReviewDashboardWidgets: (props: WidgetsStubProps) => {
            return React.createElement("div", {
                "data-testid": "widgets",
                "data-prefix": props.prefix,
                "data-namespaces": props.namespaces.join(","),
                "data-route": props.viewAllRoute.name
            });
        }
    };
});

describe("WbContentReviews", () => {
    afterEach(() => {
        cleanup();
    });

    it("mounts the shared route, menu and widgets for the wb app and no content type", () => {
        const container = new Container();
        const rowProvider: IReviewRowProvider = { getBinding: () => null };
        container.registerInstance(WbReviewContentAdapter, {} as unknown as IReviewContentAdapter);
        container.registerInstance(WbReviewRowProvider, rowProvider);

        render(
            <DiContainerProvider container={container}>
                <WbContentReviews />
            </DiContainerProvider>
        );

        const route = screen.getByTestId("route");
        expect(route.getAttribute("data-route")).toBe(Routes.Pages.WorkflowStateList.name);
        expect(route.getAttribute("data-app")).toBe("wb");
        expect(route.getAttribute("data-namespaces")).toBe("wb.page");
        expect(route.getAttribute("data-show-content-type")).toBe("false");
        expect(route.getAttribute("data-filter")).toBe("null");
        expect(route.getAttribute("data-breadcrumb")).toBe("wb.content-reviews");

        const menu = screen.getByTestId("menu");
        expect(menu.getAttribute("data-name")).toBe("workflows.wb.contentReviews");
        expect(menu.getAttribute("data-parent")).toBe("wb");
        expect(menu.getAttribute("data-route")).toBe(Routes.Pages.WorkflowStateList.name);

        const widgets = screen.getByTestId("widgets");
        expect(widgets.getAttribute("data-prefix")).toBe("wb");
        expect(widgets.getAttribute("data-namespaces")).toBe("wb.page");
        expect(widgets.getAttribute("data-route")).toBe(Routes.Pages.WorkflowStateList.name);
    });
});
