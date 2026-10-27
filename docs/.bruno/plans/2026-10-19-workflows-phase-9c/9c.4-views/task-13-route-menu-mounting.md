### Task 13: Route, menu and mounting

R329, R330, R316; Q61; QBZ-75, QBZ-90; A111; design DS:27-42 (sidebar and breadcrumb); 9c Global Constraints "Editor gate amended", "Gate"; 9a registration rule; Review Focus 6. The Reviewer exclusions page gets one route for every app, mounted once by `WorkflowsAdminApp` (inside its flag gate). The route is registered whenever the flag is on and its element is the page inside `AdminLayout`; without `editor` the page itself shows the no-access view (Task 11, R329). The Settings menu gets the `Workflows` group and the `Reviewer exclusions` item only with `editor`.

- `ExclusionsRoute = new Route({ name: "Workflows/Settings/Exclusions", path: "/settings/workflows/exclusions" })` in `[AWS]/routes.ts` (the `app-mailer/src/routes.ts` pattern; `[AW]/routes.ts` at the package root stays deleted, `app.cleanup.test.tsx`).
- `ExclusionsSettings` (`[AWS]/mounting/ExclusionsSettings.tsx`) renders inside one `AdminConfig`:
  - always: `AdminConfig.Route route={ExclusionsRoute}` with the element `AdminLayout` > `Helmet` `<title>Reviewer exclusions</title>`, the breadcrumbs `settings` / `Settings`, `settings.workflows` / `Workflows`, `settings.workflows.exclusions` / `Reviewer exclusions`, and `<ExclusionsPage />`;
  - only with `useWorkflowsPermission().editor`: `Menu name="settings.workflows" parent="settings" element={<Menu.Group text="Workflows" collapsible={false} />}` and `Menu name="settings.workflows.exclusions" parent="settings.workflows" pinnable={true} element={<Menu.Link text="Reviewer exclusions" to={router.getLink(ExclusionsRoute)} pinnable={true} />}` (the `AccessManagementExtension` group pattern and the `WorkflowEditorMenu` item pattern; QBZ-90 hides the group label with the item).
- `WorkflowsAdminApp` renders `<ExclusionsSettings />` after `<WorkflowEditorConfig />`, so nothing is registered with the flag off (the existing early `return null`). The group's position among the Settings groups follows registration order (A111).
- `[AW]/app.test.tsx` mocks `~/settings/mounting/ExclusionsSettings.js` as a `data-testid` div (the `WorkflowEditorConfig` precedent: the real component needs `useWorkflowsPermission` and `useRouter`, which the root test does not provide) and asserts it renders with the flag on and not off. The real behaviour is tested in `ExclusionsSettings.test.tsx`.

**Files:**
- Create: `packages/app-workflows/src/settings/routes.ts`
- Create: `packages/app-workflows/src/settings/mounting/ExclusionsSettings.tsx`
- Modify: `packages/app-workflows/src/app.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx`
- Test: `packages/app-workflows/src/settings/mounting/ExclusionsSettings.test.tsx`

**Interfaces:**
- Consumes: Task 11 (`ExclusionsPage` in `~/settings/presentation/exclusionsPage/components/ExclusionsPage.js`, no props). Existing (verified with codegraph and the sources): `Route` (`@webiny/app-admin`, as `app-headless-cms-workflows/src/routes.ts`), `AdminConfig` (`AdminConfig.Route`, `AdminConfig.Menu` with `Menu.Group` / `Menu.Link`, `AdminConfig.Breadcrumb`), `AdminLayout`, `useRouter` (`@webiny/app-admin`), `Helmet` (`react-helmet`, already a dependency), `useWorkflowsPermission` (`~/presentation/permissions/useWorkflowsPermission.js`); test helpers as `WorkflowEditorRoute.test.tsx` and `CmsWorkflowEditor.test.tsx`: `RouterWithConfig` / `useRouterConfig` (`@webiny/app/config/RouterConfig.js`), `AdminConfigPlugin` / `AdminWithConfig` / `useAdminConfig` (`@webiny/app-admin/config/AdminConfig.js`), `Route` (`@webiny/app/features/router/Route.js`), `CompositionProvider` (`@webiny/react-composition`), `findElements` (`~/editor/testing/findElements.js`).
- Produces: `ExclusionsRoute`, `ExclusionsSettings`, the mount in `WorkflowsAdminApp`.

**Test runner note:** admin package, `yarn test <path>` only.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/settings/mounting/ExclusionsSettings.test.tsx`:

```tsx
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
```

Modify `packages/app-workflows/src/app.test.tsx`. After the `WorkflowEditorConfig` mock block

```tsx
vi.mock("~/editor/WorkflowEditorConfig.js", async () => {
    const react = await import("react");
    return {
        WorkflowEditorConfig: () => {
            return react.createElement("div", { "data-testid": "workflow-editor-config" });
        }
    };
});
```

add

```tsx

// The real component needs `useWorkflowsPermission` and `useRouter`; `ExclusionsSettings.test.tsx` covers it.
vi.mock("~/settings/mounting/ExclusionsSettings.js", async () => {
    const react = await import("react");
    return {
        ExclusionsSettings: () => {
            return react.createElement("div", { "data-testid": "exclusions-settings" });
        }
    };
});
```

Append at the end of the file (after the last `describe` block, whichever task added it):

```tsx

describe("WorkflowsAdminApp exclusions settings (R330)", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("mounts the exclusions route and menu when the flag is on", () => {
        mount(true);

        expect(screen.getByTestId("exclusions-settings")).toBeDefined();
    });

    it("mounts nothing of it when the flag is off (R211)", () => {
        mount(false);

        expect(screen.queryByTestId("exclusions-settings")).toBeNull();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/settings/mounting/ExclusionsSettings.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: `ExclusionsSettings.test.tsx` fails with `Failed to resolve import "~/settings/routes.js"` (and `./ExclusionsSettings.js`). `app.test.tsx` fails `mounts the exclusions route and menu when the flag is on` (no `exclusions-settings` element); every other case still passes (the mock of a missing module is only loaded when imported). Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/settings/routes.ts`:

```ts
import { Route } from "@webiny/app-admin";

// The Reviewer exclusions page under Settings > Workflows, one route for every app (R330).
export const ExclusionsRoute = new Route({
    name: "Workflows/Settings/Exclusions",
    path: "/settings/workflows/exclusions"
});
```

Create `packages/app-workflows/src/settings/mounting/ExclusionsSettings.tsx`:

```tsx
import React from "react";
import Helmet from "react-helmet";
import { AdminConfig } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { useWorkflowsPermission } from "~/presentation/permissions/useWorkflowsPermission.js";
import { ExclusionsPage } from "~/settings/presentation/exclusionsPage/components/ExclusionsPage.js";
import { ExclusionsRoute } from "~/settings/routes.js";

/*
 * The Reviewer exclusions route and its Settings menu entries (R330). The route is registered
 * whenever `WorkflowsAdminApp` renders (the flag is on); without the workflows `editor` permission
 * the page shows the no-access view (R329, Q61). The Workflows group and its item show only with
 * `editor` (QBZ-90); the server keeps its own checks.
 */
export const ExclusionsSettings = () => {
    const router = useRouter();
    const permission = useWorkflowsPermission();
    const { Menu } = AdminConfig;

    let menu: React.ReactNode = null;
    if (permission.editor) {
        const link = router.getLink(ExclusionsRoute);
        menu = (
            <>
                <Menu
                    name="settings.workflows"
                    parent="settings"
                    element={<Menu.Group text="Workflows" collapsible={false} />}
                />
                <Menu
                    name="settings.workflows.exclusions"
                    parent="settings.workflows"
                    pinnable={true}
                    element={<Menu.Link text="Reviewer exclusions" to={link} pinnable={true} />}
                />
            </>
        );
    }

    return (
        <AdminConfig>
            <AdminConfig.Route
                route={ExclusionsRoute}
                element={
                    <AdminLayout>
                        <Helmet>
                            <title>Reviewer exclusions</title>
                        </Helmet>
                        <AdminConfig.Breadcrumb name="settings" label="Settings" />
                        <AdminConfig.Breadcrumb name="settings.workflows" label="Workflows" />
                        <AdminConfig.Breadcrumb
                            name="settings.workflows.exclusions"
                            label="Reviewer exclusions"
                        />
                        <ExclusionsPage />
                    </AdminLayout>
                }
            />
            {menu}
        </AdminConfig>
    );
};
```

Modify `packages/app-workflows/src/app.tsx`. Replace

```tsx
import { WorkflowEditorConfig } from "~/editor/WorkflowEditorConfig.js";
```

with

```tsx
import { WorkflowEditorConfig } from "~/editor/WorkflowEditorConfig.js";
import { ExclusionsSettings } from "~/settings/mounting/ExclusionsSettings.js";
```

Replace

```tsx
            <WorkflowEditorConfig />
            <SecurityPermissions />
```

with

```tsx
            <WorkflowEditorConfig />
            <ExclusionsSettings />
            <SecurityPermissions />
```

(Tasks 3, 7, 9 and 10 add `RegisterFeature` lines and imports to the same file; these two anchors are untouched by them. If an earlier task inserted a line between `<WorkflowEditorConfig />` and `<SecurityPermissions />`, put `<ExclusionsSettings />` directly after `<WorkflowEditorConfig />`.)

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/settings/mounting/ExclusionsSettings.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: PASS. If `menu.pinnable` is not carried into `useAdminConfig().menus` for the `Menu` element (the `WorkflowEditorMenu.test.tsx` case asserts it, so it should be), keep the `element.props.pinnable` assertion and report.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/mounting/components/WorkflowEditorMenu.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass (`app.cleanup.test.tsx` checks `app.tsx` against `~/routes.js`; the new import is `~/settings/mounting/ExclusionsSettings.js` and the root `routes.ts` stays deleted); no TypeScript errors.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): mount the reviewer exclusions route and settings menu" -m "The route /settings/workflows/exclusions is registered whenever the flag is on and shows the page, which renders the no-access view without the editor permission. The Settings > Workflows group and the Reviewer exclusions item show only with editor." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`pinnable` on both `Menu` and `Menu.Link`:** R330 says the item is `pinnable`; the `WorkflowEditorMenu` precedent sets it on both, so does this task. The group is not pinnable.
- **`AdminLayout` title:** R330 asks for the Helmet title (the `WorkflowEditorRoute` precedent), so `AdminLayout` gets no `title` prop (the mailer passes one; workflows does not).
- **`app.tsx` / `app.test.tsx` hunks** are written against the files as Tasks 3, 7, 9 and 10 leave them; the anchors (`WorkflowEditorConfig` import, the JSX pair, the `WorkflowEditorConfig` mock, the end of the file) are lines those tasks do not edit.
- **Route name and path:** `ExclusionsRoute.name` and `.path` are read in the test as `WorkflowEditorMenu.test.tsx` reads `route.path` (the app `Route` class exposes both).
- Size: small (two source files, two hunks, one new test file, one test hunk).

## Review fixes (sub-phase review)

- None. Imports, hunks (against the current `app.tsx`, `app.test.tsx`, `WorkflowEditorRoute.tsx` and its test, the CMS and WB route files and tests), commands and trailers checked; no change needed.
