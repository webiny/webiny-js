import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { createWorkflowsIdentityContext } from "@webiny/app-workflows/review/testing/createWorkflowsIdentityContext.js";
import type { IReviewContentAdapter } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";
import type { IReviewRowProvider } from "@webiny/app-workflows/review/presentation/reviewList/abstractions.js";
import type { IReviewUseCases } from "@webiny/app-workflows/review/useCases/IReviewUseCases.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases/abstractions.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter/abstractions.js";
import { CmsReviewRowProvider } from "~/features/gateway/CmsReviewRowProvider/abstractions.js";
import { CmsContentReviewsPresenterFeature } from "~/presentation/contentReviews/feature.js";
import { Routes } from "~/routes.js";
import { CmsContentReviews } from "./CmsContentReviews.js";

interface RouteStubProps {
    route: { name: string };
    useCases: { name: string };
    namespaces: string[];
    showContentType: boolean;
    contentTypeFilter: { options: { label: string; value: string }[] } | null;
    breadcrumbName: string;
    ready: boolean;
}

interface MenuStubProps {
    name: string;
    route: { name: string };
    parent?: string;
}

interface WidgetsStubProps {
    prefix: string;
    useCases: { name: string };
    namespaces: string[];
    viewAllRoute: { name: string };
    ready: boolean;
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
                    "data-usecases": props.useCases.name,
                    "data-namespaces": props.namespaces.join(","),
                    "data-show-content-type": String(props.showContentType),
                    "data-filter": JSON.stringify(props.contentTypeFilter),
                    "data-breadcrumb": props.breadcrumbName,
                    "data-ready": String(props.ready)
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
                "data-usecases": props.useCases.name,
                "data-namespaces": props.namespaces.join(","),
                "data-route": props.viewAllRoute.name,
                "data-ready": String(props.ready)
            });
        }
    };
});

const createContainer = (execute: () => Promise<unknown>): Container => {
    const container = new Container();
    const useCases = { name: "cms" } as unknown as IReviewUseCases;
    const rowProvider: IReviewRowProvider = { getBinding: () => null };
    const adapter = {} as unknown as IReviewContentAdapter;
    container.registerInstance(CmsReviewUseCases, useCases);
    container.registerInstance(CmsReviewContentAdapter, adapter);
    container.registerInstance(CmsReviewRowProvider, rowProvider);
    container.registerInstance(ListModelsUseCase, {
        execute
    } as unknown as ListModelsUseCase.Interface);
    // The admin registers the signed-in identity; the model list waits for one.
    container.registerInstance(IdentityContext, createWorkflowsIdentityContext());
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn()
    } as unknown as Notifications.Interface);
    CmsContentReviewsPresenterFeature.register(container);
    return container;
};

const mount = (container: Container) => {
    render(
        <DiContainerProvider container={container}>
            <CmsContentReviews />
        </DiContainerProvider>
    );
};

describe("CmsContentReviews", () => {
    it("mounts the shared route, menu and widgets with the CMS use cases and the model list, ready once the models are known", async () => {
        const container = createContainer(async () => [
            { modelId: "press", name: "Press release", tags: [] },
            { modelId: "article", name: "Article", tags: [] },
            { modelId: "hidden", name: "Hidden", tags: ["$publishing:false"] }
        ]);

        mount(container);

        await waitFor(() => {
            expect(screen.getByTestId("route").getAttribute("data-ready")).toBe("true");
        });
        const route = screen.getByTestId("route");
        expect(route.getAttribute("data-namespaces")).toBe("cms.article,cms.press");
        expect(route.getAttribute("data-route")).toBe(Routes.ContentEntries.ContentReviews.name);
        expect(route.getAttribute("data-usecases")).toBe("cms");
        expect(route.getAttribute("data-show-content-type")).toBe("true");
        expect(route.getAttribute("data-breadcrumb")).toBe("cms.content-reviews");
        expect(JSON.parse(route.getAttribute("data-filter") ?? "null")).toEqual({
            options: [
                { label: "Article", value: "article" },
                { label: "Press release", value: "press" }
            ]
        });

        const menu = screen.getByTestId("menu");
        expect(menu.getAttribute("data-name")).toBe("workflows.cms.contentReviews");
        expect(menu.getAttribute("data-parent")).toBe("headlessCMS");
        expect(menu.getAttribute("data-route")).toBe(Routes.ContentEntries.ContentReviews.name);

        const widgets = screen.getByTestId("widgets");
        expect(widgets.getAttribute("data-ready")).toBe("true");
        expect(widgets.getAttribute("data-prefix")).toBe("cms");
        expect(widgets.getAttribute("data-usecases")).toBe("cms");
        expect(widgets.getAttribute("data-namespaces")).toBe("cms.article,cms.press");
        expect(widgets.getAttribute("data-route")).toBe(Routes.ContentEntries.ContentReviews.name);
    });

    it("keeps the list and the widgets from starting until the model list is known", async () => {
        let release: (models: unknown[]) => void = () => undefined;
        const pending = new Promise<unknown[]>(resolve => {
            release = resolve;
        });
        const container = createContainer(() => pending);

        mount(container);

        expect(screen.getByTestId("route").getAttribute("data-ready")).toBe("false");
        expect(screen.getByTestId("widgets").getAttribute("data-ready")).toBe("false");

        release([{ modelId: "article", name: "Article", tags: [] }]);

        await waitFor(() => {
            expect(screen.getByTestId("route").getAttribute("data-ready")).toBe("true");
        });
        expect(screen.getByTestId("route").getAttribute("data-namespaces")).toBe("cms.article");
    });

    it("becomes ready with no namespaces when the model list fails", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const container = createContainer(() => Promise.reject(new Error("network")));

        mount(container);

        await waitFor(() => {
            expect(screen.getByTestId("route").getAttribute("data-ready")).toBe("true");
        });
        expect(screen.getByTestId("route").getAttribute("data-namespaces")).toBe("");
        expect(
            JSON.parse(screen.getByTestId("route").getAttribute("data-filter") ?? "null")
        ).toEqual({
            options: []
        });
        consoleError.mockRestore();
    });
});
