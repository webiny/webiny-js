### Task 21: WB mounting

R202, R237, R238, R243, R280; D162, D133; Global Constraints "Editor gate" and "Registration"; Review Focus 10; design README 3 (entry point: "one in the Website Builder menu, visible only with Manage workflows ... the Website Builder entry has a single item, Pages") and the prototype `Workflow Editor.dc.html:846-849` (`modelKind` `Website Builder`, `listLabel` `Website Builder`, no search). The Website Builder admin gets the new editor at `/website-builder/workflows`. This task is Task 20 for the WB package: it reuses the shared `WorkflowEditorRoute` and `WorkflowEditorMenu` from `app-workflows` (Task 20) and contributes only the WB adapter, a mounting feature and the rewritten `WebsiteBuilderWorkflowsMenu` mount component. The old menu had no editor gate (only the flag) and guarded its route with `SecureRoute permission="wb.page"`; the shared components replace both with the editor gate (D162). The WB root keeps mounting `WebsiteBuilderWorkflowsMenu` under that name, so the six WB test files that mock `~/Routes/index.js` keep working unchanged. The old `Components/PageWorkflows/**` files stay on disk, unreferenced, until Task 22 deletes them.

- **WB adapter (`WbWorkflowEditorAppAdapter`):** `appKind` `wb`, `panelLabel` `Website Builder`, `appliesToLabel` `Website Builder`, `contentAdapter` the existing `WbReviewContentAdapter`. `init()` loads nothing (the single model Pages needs no list and no cache). `renderModelIcon()` returns admin-ui `Icon` (`size="sm"`, `className="text-neutral-strong"`, `label` `Pages`) around the `web` icon (`@webiny/icons/web.svg`, the prototype's `web` symbol), whatever the model id.
- **Mounting feature (`WbWorkflowEditorMountingFeature`, name `WebsiteBuilderWorkflows/EditorMounting`):** registers the adapter as a singleton; `resolve` returns `{ useCases: WbWorkflowEditorUseCases, reviewUseCases: WbReviewUseCases, app: WbWorkflowEditorAppAdapter }`. Registered in the WB root (`WebsiteBuilderWorkflows`), so only with the flag on.
- **Mount component:** `WebsiteBuilderWorkflowsMenu` (rewritten in `Routes/WebsiteBuilderWorkflowsMenu.tsx`) renders `WorkflowEditorRoute` (route `Routes.Pages.Workflows`, app breadcrumb `wb` / `Website Builder`, breadcrumb `wb.workflows`) and `WorkflowEditorMenu` (name `websiteBuilder.pages.workflows`, parent `wb`). Both render nothing without the workflows `editor` permission.
- **Dependencies:** `react-helmet` is no longer imported by the WB package (the shared route owns `Helmet`); the dependency is removed from `package.json`.

**Files:**
- Create: `packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapter.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapterImpl.tsx`
- Create: `packages/app-website-builder-workflows/src/features/editorMounting/feature.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapterImpl.test.tsx`
- Create: `packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts`
- Create: `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.tsx`
- Modify: `packages/app-website-builder-workflows/src/index.tsx`
- Modify: `packages/app-website-builder-workflows/src/index.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/index.cleanup.test.tsx`
- Modify: `packages/app-website-builder-workflows/package.json`

**Interfaces:**
- Consumes: Task 20 (`WorkflowEditorRoute`, `WorkflowEditorMenu` from `@webiny/app-workflows/editor/mounting/components/*.js`; the test helper `findElements` from `@webiny/app-workflows/editor/testing/findElements.js`; Task 9's `createFakeAppAdapter` and `createFakeContentAdapter` from `@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js`), Task 5b (`createFakeEditorUseCases`), Task 5 (`IWorkflowEditorUseCases`), Task 6 (`createFakeUseCases`), Task 7 (`WbWorkflowEditorUseCases` token in `[WBW]/features/editorGateway/WbWorkflowEditorUseCases.ts`, registered by Task 7 in the WB root), Task 9 (`WorkflowEditorAppAdapter`), Task 15 (`WorkflowEditorView`). Existing (verified): `WbReviewContentAdapter` (`~/features/gateway/WbReviewContentAdapter.ts`), `WbReviewUseCases` (`~/features/gateway/WbReviewUseCases.ts`), `Routes.Pages.Workflows` (`~/routes.ts`, `/website-builder/workflows`, name `WebsiteBuilder/PageWorkflow`), `WB_PAGE_APP` (`~/constants.ts`), `@webiny/icons/web.svg` (generated icon, used by `app-headless-cms/src/presentation/menus/CmsMenuLoader.tsx`; the package's vitest config stubs `.svg` imports), admin-ui `Icon`, `useWorkflowsPermission`.
- Produces: `WbWorkflowEditorAppAdapter` (token, `.Interface` is `WorkflowEditorAppAdapter`), `WbWorkflowEditorMountingFeature`, the rewritten `WebsiteBuilderWorkflowsMenu`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapterImpl.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter.js";
import { WbWorkflowEditorAppAdapter as AdapterAbstraction } from "./WbWorkflowEditorAppAdapter.js";
import { WbWorkflowEditorAppAdapter } from "./WbWorkflowEditorAppAdapterImpl.js";

interface RenderedIconProps {
    label: string;
}

const contentAdapter = createFakeContentAdapter();

const createAdapter = () => {
    const container = new Container();
    container.registerInstance(WbReviewContentAdapter, contentAdapter);
    container.register(WbWorkflowEditorAppAdapter);

    return container.resolve(AdapterAbstraction);
};

describe("WbWorkflowEditorAppAdapter", () => {
    it("describes the Website Builder app", () => {
        const adapter = createAdapter();

        expect(adapter.appKind).toBe("wb");
        expect(adapter.panelLabel).toBe("Website Builder");
        expect(adapter.appliesToLabel).toBe("Website Builder");
        expect(adapter.contentAdapter).toBe(contentAdapter);
    });

    it("loads nothing on init", async () => {
        const adapter = createAdapter();

        await expect(adapter.init()).resolves.toBeUndefined();
    });

    it("renders the Pages icon for any model id", () => {
        const adapter = createAdapter();

        const node = adapter.renderModelIcon("wb.page");

        if (!React.isValidElement<RenderedIconProps>(node)) {
            throw new Error("The model icon is not an element.");
        }
        expect(node.props.label).toBe("Pages");
    });
});
```

Create `packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { createFakeEditorUseCases } from "@webiny/app-workflows/editor/testing/fakeWorkflowEditorUseCases.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WbWorkflowEditorUseCases } from "~/features/editorGateway/WbWorkflowEditorUseCases.js";
import { WbWorkflowEditorAppAdapter } from "./WbWorkflowEditorAppAdapter.js";
import { WbWorkflowEditorMountingFeature } from "./feature.js";

const contentAdapter = createFakeContentAdapter();

const editorUseCases = createFakeEditorUseCases();

const createContainer = () => {
    const reviewUseCases = createFakeUseCases();
    const container = new Container();
    container.registerInstance(WbReviewContentAdapter, contentAdapter);
    container.registerInstance(WbWorkflowEditorUseCases, editorUseCases);
    container.registerInstance(WbReviewUseCases, reviewUseCases);
    WbWorkflowEditorMountingFeature.register(container);

    return { container, reviewUseCases };
};

describe("WbWorkflowEditorMountingFeature", () => {
    it("resolves the editor use cases, the review use cases and the app adapter for the view", () => {
        const { container, reviewUseCases } = createContainer();

        const {
            useCases,
            reviewUseCases: resolvedReview,
            app
        } = WbWorkflowEditorMountingFeature.resolve(container);

        expect(useCases).toBe(editorUseCases);
        expect(resolvedReview).toBe(reviewUseCases);
        expect(app.appKind).toBe("wb");
        expect(app.contentAdapter).toBe(contentAdapter);
    });

    it("registers the adapter as a singleton", () => {
        const { container } = createContainer();

        const first = container.resolve(WbWorkflowEditorAppAdapter);
        const second = container.resolve(WbWorkflowEditorAppAdapter);

        expect(first).toBe(second);
    });
});
```

Create `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx`:

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
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { RouterWithConfig } from "@webiny/app/config/RouterConfig.js";
import { useRouterConfig } from "@webiny/app/config/RouterConfig.js";
import { AdminConfig } from "@webiny/app-admin";
import { AdminConfigPlugin } from "@webiny/app-admin/config/AdminConfig.js";
import { AdminWithConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { useAdminConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { CompositionProvider } from "@webiny/react-composition";
import { createFakeAppAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { createFakeEditorUseCases } from "@webiny/app-workflows/editor/testing/fakeWorkflowEditorUseCases.js";
import { findElements } from "@webiny/app-workflows/editor/testing/findElements.js";
import { WorkflowEditorView } from "@webiny/app-workflows/editor/presentation/editor/components/WorkflowEditorView.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { WbWorkflowEditorUseCases } from "~/features/editorGateway/WbWorkflowEditorUseCases.js";
import { WbWorkflowEditorAppAdapter } from "~/features/editorMounting/WbWorkflowEditorAppAdapter.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WebsiteBuilderWorkflowsMenu } from "./WebsiteBuilderWorkflowsMenu.js";

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

const editorUseCases = createFakeEditorUseCases();

const reviewUseCases = createFakeUseCases();

const app = createFakeAppAdapter("wb");

const { Menu } = AdminConfig;

// The real mounting feature resolves the three tokens, which the test registers as instances.
const mount = async (): Promise<Captured> => {
    const container = new Container();
    container.registerInstance(WbWorkflowEditorUseCases, editorUseCases);
    container.registerInstance(WbReviewUseCases, reviewUseCases);
    container.registerInstance(WbWorkflowEditorAppAdapter, app);

    render(
        <DiContainerProvider container={container}>
            <CompositionProvider>
                <WebsiteBuilderWorkflowsMenu />
                <AdminConfig>
                    <Menu name="test.sentinel" element={<div />} />
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

    it("gives the view the WB editor use cases, the WB review use cases and the WB adapter", async () => {
        const result = await mount();
        const route = result.routes.find(item => item.name === "WebsiteBuilder/PageWorkflow");
        if (!route) {
            throw new Error("The editor route is not registered.");
        }

        const views = findElements(route.element, WorkflowEditorView);

        expect(views).toHaveLength(1);
        expect(views[0].props.useCases).toBe(editorUseCases);
        expect(views[0].props.reviewUseCases).toBe(reviewUseCases);
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

    it("registers neither the route nor the menu item without the editor permission", async () => {
        permission.editor = false;

        const result = await mount();
        const routeNames = result.routes.map(item => item.name);
        const menuNames = result.menus.map(item => item.name);

        expect(routeNames).not.toContain("WebsiteBuilder/PageWorkflow");
        expect(menuNames).not.toContain("websiteBuilder.pages.workflows");
    });
});
```

Modify `packages/app-website-builder-workflows/src/index.test.tsx`. Add after `import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";`:

```ts
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter.js";
import { WbWorkflowEditorUseCases } from "~/features/editorGateway/WbWorkflowEditorUseCases.js";
import { WbWorkflowEditorAppAdapter } from "~/features/editorMounting/WbWorkflowEditorAppAdapter.js";
```

Add two cases at the end of `describe("WebsiteBuilderWorkflows composition", ...)`, replacing the last case's tail. Before:

```tsx
        expect(screen.queryByTestId("wb-content-reviews")).toBeNull();
    });
});
```

After:

```tsx
        expect(screen.queryByTestId("wb-content-reviews")).toBeNull();
    });

    it("registers the workflow editor use cases and the WB editor adapter with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        const adapter = container.resolve(WbWorkflowEditorAppAdapter);
        const contentAdapter = container.resolve(WbReviewContentAdapter);

        expect(adapter.appKind).toBe("wb");
        expect(adapter.contentAdapter).toBe(contentAdapter);
        expect(container.resolve(WbWorkflowEditorUseCases)).toBeDefined();
    });

    it("registers neither the workflow editor use cases nor the WB editor adapter with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(WbWorkflowEditorAppAdapter)).toThrow(
            "No registration found"
        );
        expect(() => container.resolve(WbWorkflowEditorUseCases)).toThrow("No registration found");
    });
});
```

Modify `packages/app-website-builder-workflows/src/index.cleanup.test.tsx` (the root keeps mounting `WebsiteBuilderWorkflowsMenu`; the mounting feature is new in the tree):

```ts
// before
    it("keeps the editor menu and mounts no old component", () => {
        const typeNames = renderRoot().map(entry => entry.typeName);

        expect(typeNames).toContain("WebsiteBuilderWorkflowsMenu");
// after
    it("keeps the editor menu, registers its mounting feature and mounts no old component", () => {
        const entries = renderRoot();
        const typeNames = entries.map(entry => entry.typeName);
        const featureNames = entries.map(entry => entry.featureName).filter(name => name !== null);

        expect(typeNames).toContain("WebsiteBuilderWorkflowsMenu");
        expect(featureNames).toContain("WebsiteBuilderWorkflows/EditorMounting");
```

- [ ] **Step 2: Run the tests and expect failure**

```bash
yarn test packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapterImpl.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.cleanup.test.tsx 2>&1 | tail -30
```

Expected: the first two fail with `Failed to resolve import` for `./WbWorkflowEditorAppAdapter.js` and `./feature.js`; the menu test fails with `Failed to resolve import` for `~/features/editorMounting/WbWorkflowEditorAppAdapter.js`; `index.test.tsx` fails to resolve `~/features/editorMounting/WbWorkflowEditorAppAdapter.js`; `index.cleanup.test.tsx` fails with `expected [...] to contain 'WebsiteBuilderWorkflows/EditorMounting'`.

- [ ] **Step 3: Implementation**

Create `packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapter.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowEditorAppAdapter } from "@webiny/app-workflows/editor/WorkflowEditorAppAdapter.js";

export const WbWorkflowEditorAppAdapter = createAbstraction<WorkflowEditorAppAdapter>(
    "WebsiteBuilder/Workflows/EditorAppAdapter"
);

export namespace WbWorkflowEditorAppAdapter {
    export type Interface = WorkflowEditorAppAdapter;
}
```

Create `packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapterImpl.tsx`:

```tsx
import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as PagesIcon } from "@webiny/icons/web.svg";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter.js";
import { WbWorkflowEditorAppAdapter as AdapterAbstraction } from "./WbWorkflowEditorAppAdapter.js";

/*
 * The Website Builder knowledge of the shared editor view (R280): one model, Pages, so there is no
 * list to load and one fixed icon.
 */
class WbWorkflowEditorAppAdapterImpl implements AdapterAbstraction.Interface {
    public readonly appKind = "wb";
    public readonly panelLabel = "Website Builder";
    public readonly appliesToLabel = "Website Builder";

    constructor(public readonly contentAdapter: WbReviewContentAdapter.Interface) {}

    async init(): Promise<void> {
        // Pages need nothing loaded.
    }

    renderModelIcon(): React.ReactNode {
        return (
            <Icon
                icon={<PagesIcon />}
                label="Pages"
                size="sm"
                className="text-neutral-strong"
            />
        );
    }
}

export const WbWorkflowEditorAppAdapter = AdapterAbstraction.createImplementation({
    implementation: WbWorkflowEditorAppAdapterImpl,
    dependencies: [WbReviewContentAdapter]
});
```

Create `packages/app-website-builder-workflows/src/features/editorMounting/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WbWorkflowEditorUseCases } from "~/features/editorGateway/WbWorkflowEditorUseCases.js";
import { WbWorkflowEditorAppAdapter as AdapterAbstraction } from "./WbWorkflowEditorAppAdapter.js";
import { WbWorkflowEditorAppAdapter } from "./WbWorkflowEditorAppAdapterImpl.js";

export const WbWorkflowEditorMountingFeature = createFeature({
    name: "WebsiteBuilderWorkflows/EditorMounting",
    register(container) {
        container.register(WbWorkflowEditorAppAdapter).inSingletonScope();
    },
    resolve(container) {
        return {
            useCases: container.resolve(WbWorkflowEditorUseCases),
            reviewUseCases: container.resolve(WbReviewUseCases),
            app: container.resolve(AdapterAbstraction)
        };
    }
});
```

Replace the whole of `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.tsx` (the component keeps its name, so `Routes/index.ts` and the six tests that mock `~/Routes/index.js` stay as they are):

```tsx
import React from "react";
import { useFeature } from "@webiny/app";
import { WorkflowEditorMenu } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorMenu.js";
import { WorkflowEditorRoute } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorRoute.js";
import { WbWorkflowEditorMountingFeature } from "~/features/editorMounting/feature.js";
import { Routes } from "~/routes.js";

/*
 * Mounts the shared workflow editor route and menu item with the Website Builder use cases and
 * adapter. Both render nothing without the workflows `editor` permission (D162).
 */
export const WebsiteBuilderWorkflowsMenu = () => {
    const { useCases, reviewUseCases, app } = useFeature(WbWorkflowEditorMountingFeature);

    return (
        <>
            <WorkflowEditorRoute
                route={Routes.Pages.Workflows}
                appBreadcrumbName="wb"
                appBreadcrumbLabel="Website Builder"
                breadcrumbName="wb.workflows"
                useCases={useCases}
                reviewUseCases={reviewUseCases}
                app={app}
            />
            <WorkflowEditorMenu
                name="websiteBuilder.pages.workflows"
                parent="wb"
                route={Routes.Pages.Workflows}
            />
        </>
    );
};
```

Modify `packages/app-website-builder-workflows/src/index.tsx`:

```tsx
// before
import { WbReviewFeature } from "~/features/gateway/feature.js";
// after
import { WbReviewFeature } from "~/features/gateway/feature.js";
import { WbWorkflowEditorMountingFeature } from "~/features/editorMounting/feature.js";
```

```tsx
// before
            <RegisterFeature feature={WbReviewFeature} />
            <WbContentReviews />
// after
            <RegisterFeature feature={WbReviewFeature} />
            <RegisterFeature feature={WbWorkflowEditorMountingFeature} />
            <WbContentReviews />
```

Modify `packages/app-website-builder-workflows/package.json`: remove the dependency line `"react-helmet": "^6.1.0"` (and the comma left over on its predecessor so the object stays valid; it sits last in `dependencies`):

```json
// before
    "react-dom": "18.3.1",
    "react-helmet": "^6.1.0"
  },
// after
    "react-dom": "18.3.1"
  },
```

Check first that nothing else in the package imports it: `git grep -n "react-helmet" -- packages/app-website-builder-workflows/src` must print nothing.

- [ ] **Step 4: Run the tests and expect pass**

```bash
yarn test packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapterImpl.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.cleanup.test.tsx 2>&1 | tail -30
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code and type check**

```bash
yarn test packages/app-website-builder-workflows/src/features/trash/feature.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/pageListGlue.wiring.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/pageListChangeStatus.wiring.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/publishAutosave.wiring.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: pass (they mock `~/Routes/index.js`, so the new component never renders there) and a clean build.

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
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-website-builder-workflows): mount the workflow editor at /website-builder/workflows" -m "The Website Builder reuses the shared route and menu components, which render only with the workflows editor permission (the old menu had no editor gate). The package adds its app adapter (the single item Pages), a mounting feature and the rewritten mount component, and drops the react-helmet dependency." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`WebsiteBuilderWorkflowsMenu` keeps its name and file.** The contract lists `[WBW]` "route and menu" for this task and, for Task 22, only `Components/PageWorkflows/**` as WB deletions, so the route file is rewritten in place rather than replaced. This also keeps `~/Routes/index.js` and its six test mocks valid.
- **Panel label.** R280 writes `WEBSITE BUILDER`; the design prototype's string is `Website Builder` and the panel uppercases by CSS (see Task 20, Contract notes), so `panelLabel` and `appliesToLabel` are `Website Builder` (`Workflow Editor.dc.html:846-849`).
- **Editor gate added.** The old WB menu showed for everyone with the flag; the shared menu and route render only with `editor` (Global Constraints, D162). The old `SecureRoute permission="wb.page"` is gone with the old route.
- **Names from other writers' tasks (checked against Tasks 5b, 7, 9 and 15 by the consistency pass):** `WbWorkflowEditorUseCases` at `[WBW]/features/editorGateway/WbWorkflowEditorUseCases.ts` (token with `.Interface`, the WB mirror of Task 7's CMS token; Task 7 must use exactly this file and token name); Task 7's WB feature registers itself in the WB root; the same `WorkflowEditorView` and `WorkflowEditorAppAdapter` names as Task 20. `IWorkflowEditorUseCases` is faked with its four methods.
- **`init` is an empty async body with a comment** because Pages need no list (contract: "the WB app adapter (`init` no-op)").
- **`react-helmet`** moves with the route to `app-workflows`, which already depends on it.
