import React from "react";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { Route } from "@webiny/app/features/router/Route.js";
import { RouterWithConfig } from "@webiny/app/config/RouterConfig.js";
import { useRouterConfig } from "@webiny/app/config/RouterConfig.js";
import { AdminConfig } from "@webiny/app-admin";
import { AdminConfigPlugin } from "@webiny/app-admin/config/AdminConfig.js";
import { AdminWithConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { useAdminConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { CompositionProvider } from "@webiny/react-composition";
import { createFakeAppAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { findElements } from "@webiny/app-workflows/editor/testing/findElements.js";
import { WorkflowEditorView } from "@webiny/app-workflows/editor/presentation/editor/components/WorkflowEditorView.js";
import { WbWorkflowEditorAppAdapter } from "~/features/editorMounting/abstractions.js";
import { WebsiteBuilderWorkflowsMenu } from "./WebsiteBuilderWorkflowsMenu.js";

interface RouteStub {
    path: string;
}

const permission = vi.hoisted(() => {
    return { editor: true };
});

vi.mock("@webiny/app-workflows/presentation/permissions/useWorkflowsPermission.js", () => {
    return {
        useWorkflowsPermission: () => {
            return { editor: permission.editor, reassign: false };
        }
    };
});

vi.mock("@webiny/app-workflows/editor/presentation/editor/components/WorkflowEditorView.js", () => {
    return { WorkflowEditorView: () => null };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useRouter: () => {
            return { getLink: (route: RouteStub) => route.path };
        }
    };
});

interface CapturedRoute {
    name: string;
    element: React.ReactElement;
}

interface CapturedMenu {
    name: string;
    parent: string | null;
    element: React.ReactElement | undefined;
}

interface Captured {
    routes: CapturedRoute[];
    menus: CapturedMenu[];
}

const captured: Captured = { routes: [], menus: [] };

const Probe = () => {
    const routerConfig = useRouterConfig();
    const adminConfig = useAdminConfig();
    captured.routes = routerConfig.routes.map(item => {
        return { name: item.route.name, element: item.element };
    });
    captured.menus = adminConfig.menus.map(menu => {
        return { name: menu.name, parent: menu.parent ?? null, element: menu.element };
    });
    const routeNames = captured.routes.map(item => item.name);
    const menuNames = captured.menus.map(item => `${item.name}:${item.parent ?? ""}`);

    return (
        <div
            data-testid="probe"
            data-routes={routeNames.join(",")}
            data-menus={menuNames.join(",")}
        />
    );
};

const app = createFakeAppAdapter("wb");

const { Menu } = AdminConfig;

// The router renders nothing without a route, so a sentinel keeps the probe mounted.
const sentinelRoute = new Route({ name: "Test/Sentinel", path: "/test/sentinel" });

// The real mounting feature resolves the two tokens, which the test registers as instances.
const mount = async (): Promise<Captured> => {
    const container = new Container();
    container.registerInstance(WbWorkflowEditorAppAdapter, app);

    render(
        <DiContainerProvider container={container}>
            <CompositionProvider>
                <WebsiteBuilderWorkflowsMenu />
                <AdminConfig>
                    <Menu name="test.sentinel" element={<div />} />
                    <AdminConfig.Route route={sentinelRoute} element={<div />} />
                </AdminConfig>
                <AdminWithConfig>
                    {AdminConfigPlugin}
                    <RouterWithConfig>
                        <Probe />
                    </RouterWithConfig>
                </AdminWithConfig>
            </CompositionProvider>
        </DiContainerProvider>
    );

    const probe = await screen.findByTestId("probe");
    // The sentinel menu proves the configs flushed, so a missing editor route or menu is real.
    await vi.waitFor(() => {
        expect(probe.getAttribute("data-menus")).toContain("test.sentinel");
    });

    return captured;
};

describe("WebsiteBuilderWorkflowsMenu", () => {
    beforeEach(() => {
        permission.editor = true;
        captured.routes = [];
        captured.menus = [];
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the /website-builder/workflows route and the Website Builder menu item for an editor", async () => {
        const result = await mount();
        const routeNames = result.routes.map(item => item.name);
        const menuNames = result.menus.map(item => `${item.name}:${item.parent ?? ""}`);

        expect(routeNames).toContain("WebsiteBuilder/PageWorkflow");
        expect(menuNames).toContain("websiteBuilder.pages.workflows:wb");
    });

    it("links the menu item to /website-builder/workflows", async () => {
        const result = await mount();

        const menu = result.menus.find(item => item.name === "websiteBuilder.pages.workflows");

        expect(menu?.element?.props.text).toBe("Workflows");
        expect(menu?.element?.props.to).toBe("/website-builder/workflows");
    });

    it("gives the view the WB review use cases and the WB adapter, no editor use cases (R353)", async () => {
        const result = await mount();
        const route = result.routes.find(item => item.name === "WebsiteBuilder/PageWorkflow");
        if (!route) {
            throw new Error("The editor route is not registered.");
        }

        const views = findElements(route.element, WorkflowEditorView);

        expect(views).toHaveLength(1);
        expect(views[0].props).not.toHaveProperty("useCases");
        expect(Object.keys(views[0].props)).toEqual(["app"]);
        expect(views[0].props.app).toBe(app);
    });

    it("names the breadcrumbs Website Builder and Workflows", async () => {
        const result = await mount();
        const route = result.routes.find(item => item.name === "WebsiteBuilder/PageWorkflow");
        if (!route) {
            throw new Error("The editor route is not registered.");
        }

        const breadcrumbs = findElements(route.element, AdminConfig.Breadcrumb);
        const texts = breadcrumbs.map(item => `${item.props.name}:${item.props.label}`);

        expect(texts).toEqual(["wb:Website Builder", "wb.workflows:Workflows"]);
    });

    it("registers the route but not the menu item without the editor permission", async () => {
        permission.editor = false;

        const result = await mount();
        const routeNames = result.routes.map(item => item.name);
        const menuNames = result.menus.map(item => item.name);

        expect(routeNames).toContain("WebsiteBuilder/PageWorkflow");
        expect(menuNames).not.toContain("websiteBuilder.pages.workflows");
    });
});
