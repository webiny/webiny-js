import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
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
import type { IReviewContentTypesSource } from "@webiny/app-workflows/review/presentation/reviewList/IReviewContentTypesSource.js";
import type { IReviewRowProvider } from "@webiny/app-workflows/review/presentation/reviewList/abstractions.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter/abstractions.js";
import { CmsReviewRowProvider } from "~/features/gateway/CmsReviewRowProvider/abstractions.js";
import { CmsContentReviewsPresenterFeature } from "~/presentation/contentReviews/feature.js";
import { Routes } from "~/routes.js";
import { CmsContentReviews } from "./CmsContentReviews.js";

interface RouteStubProps {
    route: { name: string };
    app: string;
    showContentType: boolean;
    contentTypes: IReviewContentTypesSource;
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
    ready: boolean;
}

const permission = vi.hoisted(() => {
    return { canAccessManageEndpoint: true, canReadContentModels: true };
});

vi.mock("@webiny/app-headless-cms/admin/hooks/usePermission.js", () => {
    return {
        usePermission: () => {
            return {
                canAccessManageEndpoint: permission.canAccessManageEndpoint,
                canReadContentModels: permission.canReadContentModels
            };
        }
    };
});

vi.mock(
    "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsRoute.js",
    async () => {
        const React = await import("react");
        return {
            ReviewContentReviewsRoute: (props: RouteStubProps) => {
                const vm = props.contentTypes.vm;
                return React.createElement("div", {
                    "data-testid": "route",
                    "data-route": props.route.name,
                    "data-app": props.app,
                    "data-namespaces": vm.namespaces.join(","),
                    "data-show-content-type": String(props.showContentType),
                    "data-options": JSON.stringify(vm.options),
                    "data-breadcrumb": props.breadcrumbName,
                    "data-ready": String(!vm.loading)
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
                "data-route": props.viewAllRoute.name,
                "data-ready": String(props.ready)
            });
        }
    };
});

const createNotifications = (): Notifications.Interface => {
    return {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn()
    } as unknown as Notifications.Interface;
};

const createContainer = (
    execute: () => Promise<unknown>,
    notifications: Notifications.Interface = createNotifications()
): Container => {
    const container = new Container();
    const rowProvider: IReviewRowProvider = { getBinding: () => null };
    const adapter = {} as unknown as IReviewContentAdapter;
    container.registerInstance(CmsReviewContentAdapter, adapter);
    container.registerInstance(CmsReviewRowProvider, rowProvider);
    container.registerInstance(ListModelsUseCase, {
        execute
    } as unknown as ListModelsUseCase.Interface);
    // The admin registers the signed-in identity; the model list waits for one.
    container.registerInstance(IdentityContext, createWorkflowsIdentityContext());
    container.registerInstance(Notifications, notifications);
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
    beforeEach(() => {
        permission.canAccessManageEndpoint = true;
        permission.canReadContentModels = true;
    });

    it.each([
        ["the manage endpoint", { canAccessManageEndpoint: false, canReadContentModels: true }],
        ["reading content models", { canAccessManageEndpoint: true, canReadContentModels: false }]
    ])("mounts nothing and loads no models without %s", async (_name, flags) => {
        Object.assign(permission, flags);
        const execute = vi.fn(async () => []);
        const notifications = createNotifications();
        const container = createContainer(execute, notifications);

        mount(container);
        await act(async () => {});

        expect(screen.queryByTestId("route")).toBeNull();
        expect(screen.queryByTestId("menu")).toBeNull();
        expect(screen.queryByTestId("widgets")).toBeNull();
        expect(execute).not.toHaveBeenCalled();
        expect(notifications.error).not.toHaveBeenCalled();
    });

    it("mounts the shared route, menu and widgets for the cms app with the model list, ready once the models are known", async () => {
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
        expect(route.getAttribute("data-app")).toBe("cms");
        expect(route.getAttribute("data-show-content-type")).toBe("true");
        expect(route.getAttribute("data-breadcrumb")).toBe("cms.content-reviews");
        expect(JSON.parse(route.getAttribute("data-options") ?? "null")).toEqual([
            { label: "Article", value: "article" },
            { label: "Press release", value: "press" }
        ]);

        const menu = screen.getByTestId("menu");
        expect(menu.getAttribute("data-name")).toBe("workflows.cms.contentReviews");
        expect(menu.getAttribute("data-parent")).toBe("headlessCMS");
        expect(menu.getAttribute("data-route")).toBe(Routes.ContentEntries.ContentReviews.name);

        const widgets = screen.getByTestId("widgets");
        expect(widgets.getAttribute("data-ready")).toBe("true");
        expect(widgets.getAttribute("data-prefix")).toBe("cms");
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
            JSON.parse(screen.getByTestId("route").getAttribute("data-options") ?? "null")
        ).toEqual([]);
        consoleError.mockRestore();
    });
});
