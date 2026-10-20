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
import { CompositionProvider } from "@webiny/react-composition";
import { createFakeAppAdapter } from "~/editor/testing/fakeEditorAppAdapter.js";
import { findElements } from "~/editor/testing/findElements.js";
import { WorkflowEditorView } from "~/editor/presentation/editor/components/WorkflowEditorView.js";
import { EditorNoPermission } from "~/editor/presentation/editor/components/EditorNoPermission.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import type { WorkflowEditorRouteProps } from "./WorkflowEditorRoute.js";
import { WorkflowEditorRoute } from "./WorkflowEditorRoute.js";

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

// The view is not under test here; the test looks at the props the route gives it.
vi.mock("~/editor/presentation/editor/components/WorkflowEditorView.js", () => {
    return { WorkflowEditorView: () => null };
});

interface CapturedRoute {
    name: string;
    element: React.ReactElement;
}

interface CapturedRoutes {
    items: CapturedRoute[];
}

const captured: CapturedRoutes = { items: [] };

const editorRoute = new Route({ name: "Test/Workflows", path: "/test/workflows" });
const sentinelRoute = new Route({ name: "Test/Sentinel", path: "/test/sentinel" });

const Probe = () => {
    const routerConfig = useRouterConfig();
    captured.items = routerConfig.routes.map(item => {
        return { name: item.route.name, element: item.element };
    });
    const names = captured.items.map(item => item.name);

    return <div data-testid="probe" data-routes={names.join(",")} />;
};

const app = createFakeAppAdapter("cms");

const props: WorkflowEditorRouteProps = {
    route: editorRoute,
    appBreadcrumbName: "cms",
    appBreadcrumbLabel: "Headless CMS",
    breadcrumbName: "cms.workflows",
    app
};

// Mirrors App.tsx: the config declarations and the admin plugin come before the router.
const mount = async (): Promise<CapturedRoute[]> => {
    render(
        <CompositionProvider>
            <WorkflowEditorRoute {...props} />
            <AdminConfig>
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
    // The sentinel route proves the router flushed its config, so a missing editor route is real.
    await vi.waitFor(() => {
        expect(probe.getAttribute("data-routes")).toContain("Test/Sentinel");
    });

    return captured.items;
};

const getEditorElement = (items: CapturedRoute[]): React.ReactElement => {
    const item = items.find(entry => entry.name === "Test/Workflows");
    if (!item) {
        throw new Error("The editor route is not registered.");
    }
    return item.element;
};

describe("WorkflowEditorRoute", () => {
    beforeEach(() => {
        permission.editor = true;
        captured.items = [];
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the route for a viewer with the editor permission", async () => {
        const items = await mount();
        const names = items.map(item => item.name);

        expect(names).toContain("Test/Workflows");
    });

    it("registers the route and shows You don't have access to workflows without the editor permission; the editor view is not mounted", async () => {
        permission.editor = false;

        const items = await mount();
        const element = getEditorElement(items);
        const views = findElements(element, WorkflowEditorView);
        const noAccess = findElements(element, EditorNoPermission);

        expect(views).toHaveLength(0);
        expect(noAccess).toHaveLength(1);

        renderWithAdminUi(noAccess[0]);

        expect(screen.getByText("You don't have access to workflows")).toBeTruthy();
        expect(
            screen.getByText(
                "Building workflows needs the Manage workflows permission. Ask an administrator to add it to your role."
            )
        ).toBeTruthy();
    });

    it("keeps the title and the breadcrumbs without the editor permission", async () => {
        permission.editor = false;

        const items = await mount();
        const element = getEditorElement(items);
        const layouts = findElements(element, AdminLayout);
        const titles = findElements(element, "title");
        const breadcrumbs = findElements(element, AdminConfig.Breadcrumb);
        const breadcrumbTexts = breadcrumbs.map(breadcrumb => {
            return `${breadcrumb.props.name}:${breadcrumb.props.label}`;
        });

        expect(layouts).toHaveLength(1);
        expect(titles[0].props.children).toBe("Workflows");
        expect(breadcrumbTexts).toEqual(["cms:Headless CMS", "cms.workflows:Workflows"]);
    });

    it("gives the view the app adapter as its only prop", async () => {
        const items = await mount();
        const element = getEditorElement(items);

        const views = findElements(element, WorkflowEditorView);
        const noAccess = findElements(element, EditorNoPermission);

        expect(views).toHaveLength(1);
        expect(noAccess).toHaveLength(0);
        expect(Object.keys(views[0].props)).toEqual(["app"]);
        expect(views[0].props.app).toBe(app);
    });

    it("renders the view inside the admin layout with the title and the two breadcrumbs", async () => {
        const items = await mount();
        const element = getEditorElement(items);

        const layouts = findElements(element, AdminLayout);
        const titles = findElements(element, "title");
        const breadcrumbs = findElements(element, AdminConfig.Breadcrumb);
        const breadcrumbTexts = breadcrumbs.map(breadcrumb => {
            return `${breadcrumb.props.name}:${breadcrumb.props.label}`;
        });

        expect(layouts).toHaveLength(1);
        expect(titles).toHaveLength(1);
        expect(titles[0].props.children).toBe("Workflows");
        expect(breadcrumbTexts).toEqual(["cms:Headless CMS", "cms.workflows:Workflows"]);
    });
});
