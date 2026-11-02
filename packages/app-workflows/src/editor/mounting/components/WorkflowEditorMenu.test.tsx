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
import { AdminConfig } from "@webiny/app-admin";
import { AdminConfigPlugin } from "@webiny/app-admin/config/AdminConfig.js";
import { AdminWithConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { useAdminConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { Route } from "@webiny/app/features/router/Route.js";
import { CompositionProvider } from "@webiny/react-composition";
import { WorkflowEditorMenu } from "./WorkflowEditorMenu.js";

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

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useRouter: () => {
            return { getLink: (route: { path: string }) => route.path };
        }
    };
});

interface CapturedMenu {
    name: string;
    parent: string | null;
    element: React.ReactElement | undefined;
    pinnable: boolean | undefined;
}

interface CapturedMenus {
    items: CapturedMenu[];
}

const captured: CapturedMenus = { items: [] };

const route = new Route({ name: "Test/Workflows", path: "/test/workflows" });

const Probe = () => {
    const { menus } = useAdminConfig();
    captured.items = menus.map(menu => {
        return {
            name: menu.name,
            parent: menu.parent ?? null,
            element: menu.element,
            pinnable: menu.pinnable
        };
    });
    const names = captured.items.map(item => `${item.name}:${item.parent ?? ""}`);

    return <div data-testid="probe" data-menus={names.join(",")} />;
};

const { Menu } = AdminConfig;

const mount = async (): Promise<CapturedMenu[]> => {
    render(
        <CompositionProvider>
            <WorkflowEditorMenu
                name="headlessCMS.contentModels.workflows"
                parent="headlessCMS"
                route={route}
            />
            <AdminConfig>
                <Menu name="test.sentinel" element={<div />} />
            </AdminConfig>
            <AdminWithConfig>
                {AdminConfigPlugin}
                <Probe />
            </AdminWithConfig>
        </CompositionProvider>
    );

    const probe = await screen.findByTestId("probe");
    // The sentinel menu proves the admin config flushed, so a missing editor menu is real.
    await vi.waitFor(() => {
        expect(probe.getAttribute("data-menus")).toContain("test.sentinel");
    });

    return captured.items;
};

describe("WorkflowEditorMenu", () => {
    beforeEach(() => {
        permission.editor = true;
        captured.items = [];
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the Workflows menu item under its parent for a viewer with the editor permission", async () => {
        const items = await mount();

        const item = items.find(entry => entry.name === "headlessCMS.contentModels.workflows");

        expect(item).toBeDefined();
        expect(item?.parent).toBe("headlessCMS");
        expect(item?.pinnable).toBe(true);
    });

    it("links the item to the route with the text Workflows", async () => {
        const items = await mount();
        const item = items.find(entry => entry.name === "headlessCMS.contentModels.workflows");

        const link = item?.element;

        expect(link?.props.text).toBe("Workflows");
        expect(link?.props.to).toBe("/test/workflows");
        expect(link?.props.pinnable).toBe(true);
    });

    it("registers no menu item without the editor permission", async () => {
        permission.editor = false;

        const items = await mount();
        const names = items.map(item => item.name);

        expect(names).toContain("test.sentinel");
        expect(names).not.toContain("headlessCMS.contentModels.workflows");
    });
});
