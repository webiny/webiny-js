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
import { RouterWithConfig } from "@webiny/app/config/RouterConfig.js";
import { useRouterConfig } from "@webiny/app/config/RouterConfig.js";
import { Route } from "@webiny/app/features/router/Route.js";
import { AdminConfig } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { AdminConfigPlugin } from "@webiny/app-admin/config/AdminConfig.js";
import { AdminWithConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { useAdminConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { CompositionProvider } from "@webiny/react-composition";
import { findElements } from "~/editor/testing/findElements.js";
import { ExclusionsPage } from "~/settings/presentation/exclusionsPage/components/ExclusionsPage.js";
import { ExclusionsRoute } from "~/settings/routes.js";
import { ExclusionsSettings } from "./ExclusionsSettings.js";

const permission = vi.hoisted(() => {
    return { editor: true };
});

vi.mock("~/presentation/permissions/useWorkflowsPermission.js", () => {
    return {
        useWorkflowsPermission: () => {
            return { editor: permission.editor, reassign: false };
        }
    };
});

// The page is not under test here; the test looks at the route element that holds it.
vi.mock("~/settings/presentation/exclusionsPage/components/ExclusionsPage.js", () => {
    return { ExclusionsPage: () => null };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useRouter: () => {
            return { getLink: (route: { path: string }) => route.path };
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
    pinnable: boolean | undefined;
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
        return {
            name: menu.name,
            parent: menu.parent ?? null,
            element: menu.element,
            pinnable: menu.pinnable
        };
    });
    const routeNames = captured.routes.map(item => item.name);
    const menuNames = captured.menus.map(item => item.name);

    return (
        <div
            data-testid="probe"
            data-routes={routeNames.join(",")}
            data-menus={menuNames.join(",")}
        />
    );
};

const { Menu } = AdminConfig;

// The router renders nothing without a route, so a sentinel route and menu keep the probe honest.
const sentinelRoute = new Route({ name: "Test/Sentinel", path: "/test/sentinel" });

const mount = async (): Promise<Captured> => {
    render(
        <CompositionProvider>
            <ExclusionsSettings />
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
    );

    const probe = await screen.findByTestId("probe");
    // The sentinels prove the configs flushed, so a missing route or menu is real.
    await vi.waitFor(() => {
        expect(probe.getAttribute("data-routes")).toContain("Test/Sentinel");
        expect(probe.getAttribute("data-menus")).toContain("test.sentinel");
    });

    return captured;
};

const getRouteElement = (result: Captured): React.ReactElement => {
    const route = result.routes.find(item => item.name === "Workflows/Settings/Exclusions");
    if (!route) {
        throw new Error("The exclusions route is not registered.");
    }
    return route.element;
};

const getMenu = (result: Captured, name: string): CapturedMenu => {
    const menu = result.menus.find(item => item.name === name);
    if (!menu) {
        throw new Error(`The menu ${name} is not registered.`);
    }
    return menu;
};

describe("ExclusionsRoute (R330)", () => {
    it("is named Workflows/Settings/Exclusions at /settings/workflows/exclusions", () => {
        expect(ExclusionsRoute.name).toBe("Workflows/Settings/Exclusions");
        expect(ExclusionsRoute.path).toBe("/settings/workflows/exclusions");
    });
});

describe("ExclusionsSettings (R329, R330)", () => {
    beforeEach(() => {
        permission.editor = true;
        captured.routes = [];
        captured.menus = [];
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the route for a viewer with the editor permission", async () => {
        const result = await mount();
        const routeNames = result.routes.map(item => item.name);

        expect(routeNames).toContain("Workflows/Settings/Exclusions");
    });

    it("registers the route but neither the group nor the item without the editor permission (Q61)", async () => {
        permission.editor = false;

        const result = await mount();
        const routeNames = result.routes.map(item => item.name);
        const menuNames = result.menus.map(item => item.name);

        expect(routeNames).toContain("Workflows/Settings/Exclusions");
        expect(menuNames).toContain("test.sentinel");
        expect(menuNames).not.toContain("settings.workflows");
        expect(menuNames).not.toContain("settings.workflows.exclusions");
    });

    it("renders the page inside the admin layout with the title and the three breadcrumbs", async () => {
        const result = await mount();
        const element = getRouteElement(result);

        const layouts = findElements(element, AdminLayout);
        const titles = findElements(element, "title");
        const pages = findElements(element, ExclusionsPage);
        const breadcrumbs = findElements(element, AdminConfig.Breadcrumb);
        const breadcrumbTexts = breadcrumbs.map(breadcrumb => {
            return `${breadcrumb.props.name}:${breadcrumb.props.label}`;
        });

        expect(layouts).toHaveLength(1);
        expect(titles).toHaveLength(1);
        expect(titles[0].props.children).toBe("Reviewer exclusions");
        expect(pages).toHaveLength(1);
        expect(breadcrumbTexts).toEqual([
            "settings:Settings",
            "settings.workflows:Workflows",
            "settings.workflows.exclusions:Reviewer exclusions"
        ]);
    });

    it("renders the same page element without the editor permission (the page shows no access)", async () => {
        permission.editor = false;

        const result = await mount();
        const element = getRouteElement(result);
        const pages = findElements(element, ExclusionsPage);

        expect(pages).toHaveLength(1);
    });

    it("adds the Workflows group under Settings, not collapsible", async () => {
        const result = await mount();
        const group = getMenu(result, "settings.workflows");

        expect(group.parent).toBe("settings");
        expect(group.element?.props.text).toBe("Workflows");
        expect(group.element?.props.collapsible).toBe(false);
    });

    it("adds the pinnable Reviewer exclusions item under the group, linked to the route", async () => {
        const result = await mount();
        const item = getMenu(result, "settings.workflows.exclusions");

        expect(item.parent).toBe("settings.workflows");
        expect(item.pinnable).toBe(true);
        expect(item.element?.props.text).toBe("Reviewer exclusions");
        expect(item.element?.props.to).toBe("/settings/workflows/exclusions");
        expect(item.element?.props.pinnable).toBe(true);
    });
});
