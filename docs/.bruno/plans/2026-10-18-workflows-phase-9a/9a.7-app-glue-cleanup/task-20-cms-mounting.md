### Task 20: CMS mounting

R202, R237, R238, R243, R280; D162, D116, D133; Global Constraints "Editor gate" and "Registration"; Review Focus 10; design README 3 (the entry point: "One "Workflows" entry in the Headless CMS menu ... visible only with Manage workflows") and the prototype `Workflow Editor.dc.html:846-849` (`modelKind` `Headless CMS model`, `listLabel` `Content models`). The Headless CMS admin gets the new editor at `/cms/workflows`. The route, its breadcrumbs, its title and the menu item are written once in `app-workflows` (`WorkflowEditorRoute`, `WorkflowEditorMenu`, shared with Task 21) and render nothing without the workflows `editor` permission (`useWorkflowsPermission().editor`, D162). The CMS package contributes its adapter (`CmsWorkflowEditorAppAdapter`: `init` fills the admin `ModelsCache` through `ListModelsUseCase`, `renderModelIcon` draws the model icon from `CmsModel.icon`), a mounting feature that resolves the three things the shared view needs (the Task 7 editor use cases, the existing `CmsReviewUseCases`, the adapter), the `CmsWorkflowEditor` mount component and the root swap that removes the old editor mount. The old route, view and presenter files stay on disk, unreferenced, until Task 22 deletes them.

- **Shared route (`WorkflowEditorRoute`):** props `route`, `appBreadcrumbName`, `appBreadcrumbLabel`, `breadcrumbName`, `useCases`, `reviewUseCases`, `app`. It calls `useWorkflowsPermission()` and returns `null` when `editor` is false. Otherwise it registers `AdminConfig.Route` for `route` with `AdminLayout` > `Helmet` title `Workflows` > two `AdminConfig.Breadcrumb` (the app's, then `{breadcrumbName}` labelled `Workflows`) > `WorkflowEditorView` with `useCases`, `reviewUseCases` and `app` as props (Task 15 passes them to `presenter.init`, 8a mounting pattern). No `SecureRoute`: the old guards (`cms.contentModel`, `wb.page`) are replaced by the editor gate; the server keeps its checks.
- **Shared menu (`WorkflowEditorMenu`):** props `name`, `parent`, `route`. Returns `null` without `editor`; otherwise `AdminConfig.Menu` (`pinnable`) with `Menu.Link` text `Workflows` to `router.getLink(route)` (`pinnable`).
- **CMS adapter:** `appKind` `cms`, `panelLabel` `Content models`, `appliesToLabel` `Headless CMS model`, `contentAdapter` the existing `CmsReviewContentAdapter`. `init()` awaits `ListModelsUseCase.execute()` (its repository fills `ModelsCache` once and serves the cache afterwards, so a second `init` is cheap) and swallows a failure: the icon is cosmetic and an editor may lack CMS model permissions (the list use case then throws), so a failed `init` must not block the editor; the icons stay empty and a later `init` retries (the contract's rule that a rejected `app.init()` does not block the editor; its presenter test lives in Task 9). `renderModelIcon(modelId)` finds the model in `ModelsCache` by `modelId`, turns `model.icon` into an icon with `normalizeIcon` and returns admin-ui `Icon` (`size="sm"`, `className="text-neutral-strong"`, `label` the model name) around `FontAwesomeIcon`; `null` for an unknown model or an empty icon. The shared view never imports the CMS package or a font library (contract review 2, I2).
- **Mounting feature (`CmsWorkflowEditorMountingFeature`, name `CmsWorkflows/EditorMounting`):** registers the adapter as a singleton; `resolve` returns `{ useCases: CmsWorkflowEditorUseCases, reviewUseCases: CmsReviewUseCases, app: CmsWorkflowEditorAppAdapter }`. Registered in the CMS root (`CmsWorkflows`), so it exists only with the flag on.
- **Root:** `CmsWorkflows` registers the mounting feature and mounts `CmsWorkflowEditor` where it mounted `CmsWorkflowsEditor` and registered `CmsWorkflowsEditorPresenterFeature`. Task 7 registers its own editor-gateway feature in the same file; this task does not touch that line.

**Files:**
- Create: `packages/app-workflows/src/editor/testing/findElements.ts`
- Create: `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.tsx`
- Create: `packages/app-workflows/src/editor/mounting/components/WorkflowEditorMenu.tsx`
- Create: `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx`
- Create: `packages/app-workflows/src/editor/mounting/components/WorkflowEditorMenu.test.tsx`
- Create: `packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapter.ts`
- Create: `packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapterImpl.tsx`
- Create: `packages/app-headless-cms-workflows/src/features/editorMounting/feature.ts`
- Create: `packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapterImpl.test.tsx`
- Create: `packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts`
- Create: `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.tsx`
- Create: `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx`
- Modify: `packages/app-headless-cms-workflows/src/Routes/index.ts`
- Modify: `packages/app-headless-cms-workflows/src/index.tsx`
- Modify: `packages/app-headless-cms-workflows/src/index.test.tsx`
- Modify: `packages/app-headless-cms-workflows/src/index.editor.test.tsx`
- Modify: `packages/app-headless-cms-workflows/src/index.lists.test.tsx`
- Modify: `packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx`
- Modify: `packages/app-headless-cms-workflows/src/index.cleanup.test.tsx`

**Interfaces:**
- Consumes: Task 5 (`IWorkflowEditorUseCases` in `[AWE]/useCases/IWorkflowEditorUseCases.ts`), Task 6 (`IReviewReadUseCases.invalidateWorkflows`, `createFakeUseCases` in `[AWT]/fakeReviewUseCases.ts`), Task 7 (`CmsWorkflowEditorUseCases` token in `[CMSW]/features/editorGateway/CmsWorkflowEditorUseCases.ts`, registered by Task 7 in the CMS root), Task 9 (`WorkflowEditorAppAdapter { appKind: "cms" | "wb"; panelLabel: string; appliesToLabel: string; init(): Promise<void>; renderModelIcon(modelId: string): React.ReactNode; contentAdapter: IReviewContentAdapter }` in `[AWE]/WorkflowEditorAppAdapter.ts`), Task 15 (`WorkflowEditorView` in `[AWE]/presentation/editor/components/WorkflowEditorView.tsx`, props `useCases`, `reviewUseCases`, `app`). Existing (verified): `useWorkflowsPermission` (`app-workflows/src/presentation/permissions/useWorkflowsPermission.ts`, returns `{ editor, reassign }`), `AdminConfig` (`Route`, `Menu`, `Breadcrumb`), `AdminLayout`, `useRouter` from `@webiny/app-admin`, `Route` (`@webiny/app/features/router/Route.js`), `ModelsCache` (`@webiny/app-headless-cms/features/model/abstractions.js`, `IListCache<CmsModel>`), `ListModelsUseCase` (`.../features/model/listModels/abstractions.js`), `normalizeIcon` (`@webiny/app-headless-cms/utils/normalizeIcon.js`), `CmsReviewContentAdapter` (`~/features/gateway/CmsReviewContentAdapter.ts`), `CmsReviewUseCases` (`~/features/gateway/CmsReviewUseCases.ts`), `Routes.ContentModels.Workflows` (`~/routes.ts`, `/cms/workflows`), admin-ui `Icon`, `@fortawesome/react-fontawesome` (already a dependency of the package), `ListCache` (`@webiny/app-admin/features/listCache/index.js`).
- Produces: the shared mount-test helper `[AWET]/findElements.ts` (`findElements(node, type)`), which the CMS and WB mount tests import instead of each carrying its own copy (the fake adapters come from Task 9's `[AWET]/fakeEditorAppAdapter.ts`, the editor use cases from Task 5b's `createFakeEditorUseCases`); `WorkflowEditorRoute` and `WorkflowEditorRouteProps`, `WorkflowEditorMenu` and `WorkflowEditorMenuProps` (`@webiny/app-workflows/editor/mounting/components/*.js`, Task 21), `CmsWorkflowEditorAppAdapter` (token, `.Interface` is `WorkflowEditorAppAdapter`), `CmsWorkflowEditorMountingFeature`, `CmsWorkflowEditor`.

- [ ] **Step 1: Write the failing tests**

Create the shared tree helper first (pure, R243; the fake app adapter and content adapter already exist from Task 9, `[AWET]/fakeEditorAppAdapter.ts`). `packages/app-workflows/src/editor/testing/findElements.ts`:

```ts
import React from "react";

interface TreeProps {
    children?: React.ReactNode;
}

// Collects the elements of `type` in a React node tree without rendering it (a route's `element`).
export const findElements = (
    node: React.ReactNode,
    type: unknown,
    found: React.ReactElement[] = []
): React.ReactElement[] => {
    React.Children.forEach(node, child => {
        if (!React.isValidElement<TreeProps>(child)) {
            return;
        }
        if (child.type === type) {
            found.push(child);
        }
        findElements(child.props.children, type, found);
    });
    return found;
};
```

Create `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx`:

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
import { CompositionProvider } from "@webiny/react-composition";
import { createFakeAppAdapter } from "~/editor/testing/fakeEditorAppAdapter.js";
import { createFakeEditorUseCases } from "~/editor/testing/fakeWorkflowEditorUseCases.js";
import { findElements } from "~/editor/testing/findElements.js";
import { WorkflowEditorView } from "~/editor/presentation/editor/components/WorkflowEditorView.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
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

const useCases = createFakeEditorUseCases();

const reviewUseCases = createFakeUseCases();

const app = createFakeAppAdapter("cms");

const props: WorkflowEditorRouteProps = {
    route: editorRoute,
    appBreadcrumbName: "cms",
    appBreadcrumbLabel: "Headless CMS",
    breadcrumbName: "cms.workflows",
    useCases,
    reviewUseCases,
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

    it("registers no route without the editor permission", async () => {
        permission.editor = false;

        const items = await mount();
        const names = items.map(item => item.name);

        expect(names).toContain("Test/Sentinel");
        expect(names).not.toContain("Test/Workflows");
    });

    it("gives the view the use cases, the review use cases and the app adapter as props", async () => {
        const items = await mount();
        const element = getEditorElement(items);

        const views = findElements(element, WorkflowEditorView);

        expect(views).toHaveLength(1);
        expect(views[0].props.useCases).toBe(useCases);
        expect(views[0].props.reviewUseCases).toBe(reviewUseCases);
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
```

Create `packages/app-workflows/src/editor/mounting/components/WorkflowEditorMenu.test.tsx`:

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
```

Create `packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapterImpl.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter.js";
import { MODEL } from "~/testing/models.js";
import { CmsWorkflowEditorAppAdapter as AdapterAbstraction } from "./CmsWorkflowEditorAppAdapter.js";
import { CmsWorkflowEditorAppAdapter } from "./CmsWorkflowEditorAppAdapterImpl.js";

interface FontAwesomeElementProps {
    icon: string[];
}

interface RenderedIconProps {
    label: string;
    icon: React.ReactElement<FontAwesomeElementProps>;
}

const createModel = (modelId: string, name: string, icon: string): CmsModel => {
    return { ...MODEL, modelId, name, icon };
};

const contentAdapter = createFakeContentAdapter();

const createAdapter = (models: CmsModel[]) => {
    const cache = new ListCache<CmsModel>("modelId");
    // Mirrors `ListModelsRepository`: the first call fills the cache, later calls serve it.
    const execute = vi.fn(async () => {
        if (!cache.hasItems()) {
            cache.setItems(models);
        }
        return cache.getItems();
    });
    const container = new Container();
    container.registerInstance(ModelsCache, cache);
    container.registerInstance(ListModelsUseCase, { execute });
    container.registerInstance(CmsReviewContentAdapter, contentAdapter);
    container.register(CmsWorkflowEditorAppAdapter);
    const adapter = container.resolve(AdapterAbstraction);

    return { adapter, execute };
};

describe("CmsWorkflowEditorAppAdapter", () => {
    it("describes the CMS app", () => {
        const { adapter } = createAdapter([]);

        expect(adapter.appKind).toBe("cms");
        expect(adapter.panelLabel).toBe("Content models");
        expect(adapter.appliesToLabel).toBe("Headless CMS model");
        expect(adapter.contentAdapter).toBe(contentAdapter);
    });

    it("lists the models on init", async () => {
        const model = createModel("article", "Article", "fas/newspaper");
        const { adapter, execute } = createAdapter([model]);

        await adapter.init();

        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("does not reject when the models cannot be listed, renders no icon and retries on the next init", async () => {
        const model = createModel("article", "Article", "fas/newspaper");
        const { adapter, execute } = createAdapter([model]);
        execute.mockRejectedValueOnce(new Error("Not authorized."));

        await expect(adapter.init()).resolves.toBeUndefined();
        const before = adapter.renderModelIcon("article");
        await adapter.init();
        const after = adapter.renderModelIcon("article");

        expect(before).toBeNull();
        expect(after).not.toBeNull();
        expect(execute).toHaveBeenCalledTimes(2);
    });

    it("renders the model icon from the cached model", async () => {
        const model = createModel("article", "Article", "fas/newspaper");
        const { adapter } = createAdapter([model]);
        await adapter.init();

        const node = adapter.renderModelIcon("article");

        if (!React.isValidElement<RenderedIconProps>(node)) {
            throw new Error("The model icon is not an element.");
        }
        expect(node.props.label).toBe("Article");
        expect(node.props.icon.props.icon).toEqual(["fas", "newspaper"]);
    });

    it("renders nothing for a model that is not cached", async () => {
        const { adapter } = createAdapter([createModel("article", "Article", "fas/newspaper")]);
        await adapter.init();

        const node = adapter.renderModelIcon("missing");

        expect(node).toBeNull();
    });

    it("renders nothing for a model without an icon", async () => {
        const { adapter } = createAdapter([createModel("article", "Article", "")]);
        await adapter.init();

        const node = adapter.renderModelIcon("article");

        expect(node).toBeNull();
    });
});
```

Create `packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { createFakeEditorUseCases } from "@webiny/app-workflows/editor/testing/fakeWorkflowEditorUseCases.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsWorkflowEditorUseCases } from "~/features/editorGateway/CmsWorkflowEditorUseCases.js";
import { CmsWorkflowEditorAppAdapter } from "./CmsWorkflowEditorAppAdapter.js";
import { CmsWorkflowEditorMountingFeature } from "./feature.js";

const contentAdapter = createFakeContentAdapter();

const editorUseCases = createFakeEditorUseCases();

const createContainer = () => {
    const reviewUseCases = createFakeUseCases();
    const container = new Container();
    container.registerInstance(ModelsCache, new ListCache<CmsModel>("modelId"));
    container.registerInstance(ListModelsUseCase, { execute: vi.fn().mockResolvedValue([]) });
    container.registerInstance(CmsReviewContentAdapter, contentAdapter);
    container.registerInstance(CmsWorkflowEditorUseCases, editorUseCases);
    container.registerInstance(CmsReviewUseCases, reviewUseCases);
    CmsWorkflowEditorMountingFeature.register(container);

    return { container, reviewUseCases };
};

describe("CmsWorkflowEditorMountingFeature", () => {
    it("resolves the editor use cases, the review use cases and the app adapter for the view", () => {
        const { container, reviewUseCases } = createContainer();

        const { useCases, reviewUseCases: resolvedReview, app } =
            CmsWorkflowEditorMountingFeature.resolve(container);

        expect(useCases).toBe(editorUseCases);
        expect(resolvedReview).toBe(reviewUseCases);
        expect(app.appKind).toBe("cms");
        expect(app.contentAdapter).toBe(contentAdapter);
    });

    it("registers the adapter as a singleton", () => {
        const { container } = createContainer();

        const first = container.resolve(CmsWorkflowEditorAppAdapter);
        const second = container.resolve(CmsWorkflowEditorAppAdapter);

        expect(first).toBe(second);
    });
});
```

Create `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx`:

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
import { CmsWorkflowEditorUseCases } from "~/features/editorGateway/CmsWorkflowEditorUseCases.js";
import { CmsWorkflowEditorAppAdapter } from "~/features/editorMounting/CmsWorkflowEditorAppAdapter.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsWorkflowEditor } from "./CmsWorkflowEditor.js";

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

const app = createFakeAppAdapter("cms");

const { Menu } = AdminConfig;

// The real mounting feature resolves the three tokens, which the test registers as instances.
const mount = async (): Promise<Captured> => {
    const container = new Container();
    container.registerInstance(CmsWorkflowEditorUseCases, editorUseCases);
    container.registerInstance(CmsReviewUseCases, reviewUseCases);
    container.registerInstance(CmsWorkflowEditorAppAdapter, app);

    render(
        <DiContainerProvider container={container}>
            <CompositionProvider>
                <CmsWorkflowEditor />
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

describe("CmsWorkflowEditor", () => {
    beforeEach(() => {
        permission.editor = true;
        captured.routes = [];
        captured.menus = [];
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the /cms/workflows route and the Headless CMS menu item for an editor", async () => {
        const result = await mount();
        const routeNames = result.routes.map(item => item.name);
        const menuNames = result.menus.map(item => `${item.name}:${item.parent ?? ""}`);

        expect(routeNames).toContain("Cms/ContentModels/Workflows");
        expect(menuNames).toContain("headlessCMS.contentModels.workflows:headlessCMS");
    });

    it("links the menu item to /cms/workflows", async () => {
        const result = await mount();

        const menu = result.menus.find(item => item.name === "headlessCMS.contentModels.workflows");

        expect(menu?.element?.props.text).toBe("Workflows");
        expect(menu?.element?.props.to).toBe("/cms/workflows");
    });

    it("gives the view the CMS editor use cases, the CMS review use cases and the CMS adapter", async () => {
        const result = await mount();
        const route = result.routes.find(item => item.name === "Cms/ContentModels/Workflows");
        if (!route) {
            throw new Error("The editor route is not registered.");
        }

        const views = findElements(route.element, WorkflowEditorView);

        expect(views).toHaveLength(1);
        expect(views[0].props.useCases).toBe(editorUseCases);
        expect(views[0].props.reviewUseCases).toBe(reviewUseCases);
        expect(views[0].props.app).toBe(app);
    });

    it("names the breadcrumbs Headless CMS and Workflows", async () => {
        const result = await mount();
        const route = result.routes.find(item => item.name === "Cms/ContentModels/Workflows");
        if (!route) {
            throw new Error("The editor route is not registered.");
        }

        const breadcrumbs = findElements(route.element, AdminConfig.Breadcrumb);
        const texts = breadcrumbs.map(item => `${item.props.name}:${item.props.label}`);

        expect(texts).toEqual(["cms:Headless CMS", "cms.workflows:Workflows"]);
    });

    it("registers neither the route nor the menu item without the editor permission", async () => {
        permission.editor = false;

        const result = await mount();
        const routeNames = result.routes.map(item => item.name);
        const menuNames = result.menus.map(item => item.name);

        expect(routeNames).not.toContain("Cms/ContentModels/Workflows");
        expect(menuNames).not.toContain("headlessCMS.contentModels.workflows");
    });
});
```

Modify `packages/app-headless-cms-workflows/src/index.test.tsx`. Add after `import { CmsReviewRowProvider } from "~/features/gateway/CmsReviewRowProvider.js";`:

```ts
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter.js";
import { CmsWorkflowEditorUseCases } from "~/features/editorGateway/CmsWorkflowEditorUseCases.js";
import { CmsWorkflowEditorAppAdapter } from "~/features/editorMounting/CmsWorkflowEditorAppAdapter.js";
```

Change the mocked editor component name (the root now mounts `CmsWorkflowEditor`; the old mock name is replaced in the four root test files):

```ts
// before
vi.mock("~/Routes/index.js", () => {
    return { CmsWorkflowsEditor: () => null };
});
// after
vi.mock("~/Routes/index.js", () => {
    return { CmsWorkflowEditor: () => null };
});
```

(The same before and after in `index.editor.test.tsx`, `index.lists.test.tsx` and `features/trash/feature.test.tsx`; the block occurs once per file.) Add two cases at the end of `describe("CmsWorkflows composition", ...)`:

```tsx
    it("registers the workflow editor use cases and the CMS editor adapter with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const adapter = container.resolve(CmsWorkflowEditorAppAdapter);
        const contentAdapter = container.resolve(CmsReviewContentAdapter);

        expect(adapter.appKind).toBe("cms");
        expect(adapter.contentAdapter).toBe(contentAdapter);
        expect(container.resolve(CmsWorkflowEditorUseCases)).toBeDefined();
    });

    it("registers neither the workflow editor use cases nor the CMS editor adapter with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(CmsWorkflowEditorAppAdapter)).toThrow(
            "No registration found"
        );
        expect(() => container.resolve(CmsWorkflowEditorUseCases)).toThrow(
            "No registration found"
        );
    });
```

Modify `packages/app-headless-cms-workflows/src/index.cleanup.test.tsx` (the root keeps the editor mount under its new names; the old presenter feature is gone from the tree):

```ts
// before
    it("keeps the editor route and presenter and mounts no old component", () => {
        const entries = renderRoot();
        const typeNames = entries.map(entry => entry.typeName);
        const featureNames = entries.map(entry => entry.featureName).filter(name => name !== null);

        expect(typeNames).toContain("CmsWorkflowsEditor");
        expect(featureNames).toContain("CmsWorkflowsEditor/Presenter");
// after
    it("mounts the workflow editor and its mounting feature and no old component", () => {
        const entries = renderRoot();
        const typeNames = entries.map(entry => entry.typeName);
        const featureNames = entries.map(entry => entry.featureName).filter(name => name !== null);

        expect(typeNames).toContain("CmsWorkflowEditor");
        expect(typeNames).not.toContain("CmsWorkflowsEditor");
        expect(featureNames).toContain("CmsWorkflows/EditorMounting");
        expect(featureNames).not.toContain("CmsWorkflowsEditor/Presenter");
```

The `KEPT_PATHS` of that file are unchanged here; Task 22 rewrites them.

- [ ] **Step 2: Run the tests and expect failure**

```bash
yarn test packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/mounting/components/WorkflowEditorMenu.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapterImpl.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.cleanup.test.tsx 2>&1 | tail -30
```

Expected: the first five fail with `Failed to resolve import` for the missing `./WorkflowEditorRoute.js`, `./WorkflowEditorMenu.js`, `./CmsWorkflowEditorAppAdapter.js`, `./feature.js` and `./CmsWorkflowEditor.js`; `index.test.tsx` fails to resolve `~/features/editorMounting/CmsWorkflowEditorAppAdapter.js`; `index.cleanup.test.tsx` fails with `expected [...] to contain 'CmsWorkflowEditor'`.

- [ ] **Step 3: Implementation**

Create `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.tsx`:

```tsx
import React from "react";
import Helmet from "react-helmet";
import { AdminConfig } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";
import type { IWorkflowEditorUseCases } from "~/editor/useCases/IWorkflowEditorUseCases.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { WorkflowEditorView } from "~/editor/presentation/editor/components/WorkflowEditorView.js";
import { useWorkflowsPermission } from "~/presentation/permissions/useWorkflowsPermission.js";

export interface WorkflowEditorRouteProps {
    route: Route<any>;
    appBreadcrumbName: string;
    appBreadcrumbLabel: string;
    breadcrumbName: string;
    useCases: IWorkflowEditorUseCases;
    reviewUseCases: IReviewReadUseCases;
    app: WorkflowEditorAppAdapter;
}

/*
 * One workflow editor route per app over the shared view (R202). Only a viewer with the workflows
 * `editor` permission gets the route (D162); the server keeps its own checks.
 */
export const WorkflowEditorRoute = (props: WorkflowEditorRouteProps) => {
    const permission = useWorkflowsPermission();

    if (!permission.editor) {
        return null;
    }

    return (
        <AdminConfig>
            <AdminConfig.Route
                route={props.route}
                element={
                    <AdminLayout>
                        <Helmet>
                            <title>Workflows</title>
                        </Helmet>
                        <AdminConfig.Breadcrumb
                            name={props.appBreadcrumbName}
                            label={props.appBreadcrumbLabel}
                        />
                        <AdminConfig.Breadcrumb name={props.breadcrumbName} label="Workflows" />
                        <WorkflowEditorView
                            useCases={props.useCases}
                            reviewUseCases={props.reviewUseCases}
                            app={props.app}
                        />
                    </AdminLayout>
                }
            />
        </AdminConfig>
    );
};
```

Create `packages/app-workflows/src/editor/mounting/components/WorkflowEditorMenu.tsx`:

```tsx
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";
import { useWorkflowsPermission } from "~/presentation/permissions/useWorkflowsPermission.js";

export interface WorkflowEditorMenuProps {
    name: string;
    parent: string;
    route: Route<any>;
}

// The "Workflows" menu item of one app, shown only with the workflows `editor` permission (D162).
export const WorkflowEditorMenu = ({ name, parent, route }: WorkflowEditorMenuProps) => {
    const router = useRouter();
    const permission = useWorkflowsPermission();
    const { Menu } = AdminConfig;

    if (!permission.editor) {
        return null;
    }

    return (
        <AdminConfig>
            <Menu
                name={name}
                parent={parent}
                pinnable={true}
                element={
                    <Menu.Link text="Workflows" to={router.getLink(route)} pinnable={true} />
                }
            />
        </AdminConfig>
    );
};
```

Create `packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapter.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowEditorAppAdapter } from "@webiny/app-workflows/editor/WorkflowEditorAppAdapter.js";

export const CmsWorkflowEditorAppAdapter = createAbstraction<WorkflowEditorAppAdapter>(
    "Cms/Workflows/EditorAppAdapter"
);

export namespace CmsWorkflowEditorAppAdapter {
    export type Interface = WorkflowEditorAppAdapter;
}
```

Create `packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapterImpl.tsx`:

```tsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Icon } from "@webiny/admin-ui";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import { normalizeIcon } from "@webiny/app-headless-cms/utils/normalizeIcon.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter.js";
import { CmsWorkflowEditorAppAdapter as AdapterAbstraction } from "./CmsWorkflowEditorAppAdapter.js";

/*
 * The CMS knowledge of the shared editor view (R280): the models list fills the admin
 * `ModelsCache` (the editor's own list carries no icons), the icon is drawn from `CmsModel.icon`.
 * `ListModelsUseCase` fills the cache once and serves it afterwards.
 */
class CmsWorkflowEditorAppAdapterImpl implements AdapterAbstraction.Interface {
    public readonly appKind = "cms";
    public readonly panelLabel = "Content models";
    public readonly appliesToLabel = "Headless CMS model";

    constructor(
        private listModels: ListModelsUseCase.Interface,
        private modelsCache: ModelsCache.Interface,
        public readonly contentAdapter: CmsReviewContentAdapter.Interface
    ) {}

    async init(): Promise<void> {
        try {
            await this.listModels.execute();
        } catch {
            // The icons are cosmetic; an editor without CMS model permissions must still get the editor.
        }
    }

    renderModelIcon(modelId: string): React.ReactNode {
        const model = this.modelsCache.getItem(item => item.modelId === modelId);
        if (!model) {
            return null;
        }

        const icon = normalizeIcon(model.icon);
        if (!icon) {
            return null;
        }

        return (
            <Icon
                icon={<FontAwesomeIcon icon={icon} />}
                label={model.name}
                size="sm"
                className="text-neutral-strong"
            />
        );
    }
}

export const CmsWorkflowEditorAppAdapter = AdapterAbstraction.createImplementation({
    implementation: CmsWorkflowEditorAppAdapterImpl,
    dependencies: [ListModelsUseCase, ModelsCache, CmsReviewContentAdapter]
});
```

Create `packages/app-headless-cms-workflows/src/features/editorMounting/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsWorkflowEditorUseCases } from "~/features/editorGateway/CmsWorkflowEditorUseCases.js";
import { CmsWorkflowEditorAppAdapter as AdapterAbstraction } from "./CmsWorkflowEditorAppAdapter.js";
import { CmsWorkflowEditorAppAdapter } from "./CmsWorkflowEditorAppAdapterImpl.js";

export const CmsWorkflowEditorMountingFeature = createFeature({
    name: "CmsWorkflows/EditorMounting",
    register(container) {
        container.register(CmsWorkflowEditorAppAdapter).inSingletonScope();
    },
    resolve(container) {
        return {
            useCases: container.resolve(CmsWorkflowEditorUseCases),
            reviewUseCases: container.resolve(CmsReviewUseCases),
            app: container.resolve(AdapterAbstraction)
        };
    }
});
```

Create `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.tsx`:

```tsx
import React from "react";
import { useFeature } from "@webiny/app";
import { WorkflowEditorMenu } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorMenu.js";
import { WorkflowEditorRoute } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorRoute.js";
import { CmsWorkflowEditorMountingFeature } from "~/features/editorMounting/feature.js";
import { Routes } from "~/routes.js";

/*
 * Mounts the shared workflow editor route and menu item with the CMS use cases and adapter. Both
 * render nothing without the workflows `editor` permission (D162).
 */
export const CmsWorkflowEditor = () => {
    const { useCases, reviewUseCases, app } = useFeature(CmsWorkflowEditorMountingFeature);

    return (
        <>
            <WorkflowEditorRoute
                route={Routes.ContentModels.Workflows}
                appBreadcrumbName="cms"
                appBreadcrumbLabel="Headless CMS"
                breadcrumbName="cms.workflows"
                useCases={useCases}
                reviewUseCases={reviewUseCases}
                app={app}
            />
            <WorkflowEditorMenu
                name="headlessCMS.contentModels.workflows"
                parent="headlessCMS"
                route={Routes.ContentModels.Workflows}
            />
        </>
    );
};
```

Replace `packages/app-headless-cms-workflows/src/Routes/index.ts` (the old file `CmsWorkflowsEditor.tsx` stays on disk until Task 22):

```ts
export { CmsWorkflowEditor } from "./CmsWorkflowEditor.js";
```

Modify `packages/app-headless-cms-workflows/src/index.tsx`:

```tsx
// before
import { CmsWorkflowsEditor } from "~/Routes/index.js";
// after
import { CmsWorkflowEditor } from "~/Routes/index.js";
```

```tsx
// before
import { CmsWorkflowsEditorPresenterFeature } from "~/presentation/cmsWorkflowsEditor/feature.js";
// after
import { CmsWorkflowEditorMountingFeature } from "~/features/editorMounting/feature.js";
```

```tsx
// before
            <RegisterFeature feature={CmsWorkflowsEditorPresenterFeature} />
// after
            <RegisterFeature feature={CmsWorkflowEditorMountingFeature} />
```

```tsx
// before
            <CmsWorkflowsEditor />
// after
            <CmsWorkflowEditor />
```

- [ ] **Step 4: Run the tests and expect pass**

```bash
yarn test packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/mounting/components/WorkflowEditorMenu.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapterImpl.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.cleanup.test.tsx 2>&1 | tail -30
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code and type check**

```bash
yarn test packages/app-headless-cms-workflows/src/index.editor.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.lists.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
```

Expected: pass and clean builds. If the editor view's props in the build differ from `useCases`, `reviewUseCases`, `app`, fix `WorkflowEditorRoute` to Task 15's names (see Contract notes).

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
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-headless-cms-workflows): mount the workflow editor at /cms/workflows" -m "The route, breadcrumbs, title and menu item are shared components in app-workflows that render only with the workflows editor permission. The CMS package adds its app adapter (models cache and model icon), a mounting feature and the root swap that removes the old editor mount." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Shared mounting components are new files in `app-workflows`.** The contract lists only `[CMSW]` files for Task 20. The route (layout, title, breadcrumbs, gate) and the menu item are identical for both apps, so they are written once as `WorkflowEditorRoute` and `WorkflowEditorMenu` (`[AWE]/mounting/components/`, mirroring 8a's `ReviewContentReviewsRoute` and `ReviewContentReviewsMenu`) and Task 21 consumes them (R202, "no logic duplicated across CMS and WB").
- **Names taken from other writers' tasks (checked against Tasks 5b, 7, 9 and 15 by the consistency pass):** `WorkflowEditorView` at `[AWE]/presentation/editor/components/WorkflowEditorView.tsx` with props `useCases`, `reviewUseCases`, `app` (contract: "the shared view receives the per-app `useCases`, `reviewUseCases` and `app` adapter as props"); `WorkflowEditorAppAdapter` exported from `[AWE]/WorkflowEditorAppAdapter.ts` as a type usable in `createAbstraction<WorkflowEditorAppAdapter>`; `CmsWorkflowEditorUseCases` at `[CMSW]/features/editorGateway/CmsWorkflowEditorUseCases.ts` (a token with `.Interface`); the Task 7 CMS feature's export name (not needed here: Task 7 registers it in the root itself; if it does not, add its `RegisterFeature` line next to the mounting feature); `IWorkflowEditorUseCases` has exactly the four methods of Task 5's entry (`listModels`, `getWorkflow`, `storeWorkflow`, `deleteWorkflow`), so the fakes in the tests list those four.
- **A failed `init` does not block the editor.** The editor gate replaced `SecureRoute cms.contentModel`, so a viewer with `workflows.editor` and no CMS model permission reaches the route; for that identity `ListModelsUseCase` throws. The adapter swallows it (icons stay empty) and the presenter treats a rejected `app.init()` the same way (contract rule, Task 9 test).
- **`readonly appKind = "cms"`** infers the literal type `"cms"`, which satisfies `"cms" | "wb"`.
- **Old guards dropped.** The old route used `SecureRoute permission="cms.contentModel"` and the old menu `canCreateContentModels`; both are replaced by the single editor gate (D162, Global Constraints). `Routes.ContentModels.Workflows` keeps its optional `app` param in this task (the old view still reads it); Task 22 drops the param with the old view. The shared menu sets `pinnable` on both the `Menu` and the `Menu.Link` (the old CMS `Menu` had it only on the link), the same as 8a's `ReviewContentReviewsMenu`.
- **The old files stay until Task 22.** `Routes/CmsWorkflowsEditor.tsx`, `presentation/CmsWorkflowsEditorView.tsx` and `presentation/cmsWorkflowsEditor/**` are unreferenced after this task and still compile (they import the old `app-workflows` API that Task 22 deletes together). The four root tests keep their `cmsWorkflowsEditor/feature.js` mock until Task 22 removes it with the module.
- **Panel label.** R280 writes the WB panel label as `WEBSITE BUILDER`; the design prototype (`Workflow Editor.dc.html:849`) holds `Content models` and `Website Builder` and the panel uppercases by CSS, so the adapters store the prototype strings; the panel applies the uppercase style (contract R280, Task 15).
