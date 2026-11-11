### Task 29: CMS Content Reviews mounting glue

Spec 13.5; R202, R206, R211, R223, R231; A77, A80; Decisions D113, D159; Review Focus 1, 8, 17. The CMS mounts the shared Content Reviews pieces of Task 28 with its own use cases and content adapter. This task contains only registration, route, menu, widget and sidebar glue plus the one thing that is really CMS: the list of content types (models) for the Content type column and filter (D113, A80). No review logic lives here (R202).

- **Registration (binding rule):** the shared `AppReviewRowProvider` and `ReviewNotificationHandler` are plain classes. The CMS subclasses each in its own file and binds the subclass, in Task 11's naming style (`<Token>Impl.ts` exported under the token): `CmsReviewRowProviderImpl.ts` exports `CmsReviewRowProvider` (abstraction in `CmsReviewRowProvider.ts`, dependencies `[CmsReviewUseCases, CmsReviewContentAdapter]`) and `CmsReviewNotificationHandlerImpl.ts` exports `CmsReviewNotificationHandler` (abstraction `WebsocketEventHandler`, dependencies `[ReviewNotificationService, CmsReviewContentAdapter]`). `CmsReviewFeature` registers both, so the handler ignores every namespace that is not `cms.<modelId>` (R223) and a Website Builder message never reaches it.
- **Content types (A80):** CMS namespaces are `cms.<modelId>`. `CmsContentReviewsPresenter` lists the models through the CMS `ListModelsUseCase` (the call that also fills `ModelsCache`, which Task 11's content adapter reads for the content type label) and keeps those a workflow can bind (not tagged `$publishing:false`, not being deleted; the mirror of `isBindableModel` in `packages/api-headless-cms-workflows/src/utils/isBindableModel.ts`). Private models never reach this list: `listContentModels` calls the use case with `includePrivate: false` (`packages/api-headless-cms/src/graphql/schema/contentModels.ts`). It exposes `namespaces` (`createAppName(model)`) and the filter options (`label` = model name, `value` = model id, sorted by name).
- **One list start, no silent loss of live updates:** the route and the widgets are registered at once (the router needs the route at start-up), but the page shows a loader and the widgets stay unregistered until the model list is known (`ready` of Task 28), so the list starts once with the real namespaces. If the model list fails, the presenter ends loading with no namespaces and raises one admin error notification ("Could not load the content types" / "Content Reviews will not update live. Reload the page to try again."), so the list still opens but the viewer knows why live updates and the Content type filter are missing.
- **Mount (`CmsContentReviews`):** one route (`Routes.ContentEntries.ContentReviews`, name `Cms/ContentEntries/WorkflowStateList`, `/cms/content-reviews`, now with an optional `tab` parameter for "View all →"), one menu item `workflows.cms.contentReviews` nested under the Headless CMS group (`parent: "headlessCMS"`, the group the existing CMS workflow editor menu uses), the two widgets with prefix `cms` (`workflows.cms.review`, `workflows.cms.requested`), `showContentType: true`.
- **Sidebar (`CmsContentReviewsSidebarItem`):** replaces `CmsEntriesWorkflowStateListFooterMenu`; the "Content Reviews" item in the content entries sidebar footer (shown only for publishable models, as before) now navigates to the route. Behaviour change: the old item opened an overlay scoped to the model being browsed; the route lists the reviews of **all** models, filterable by content type (D113).

**Files:**
- Create: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewRowProvider.ts` (token), `.../features/gateway/CmsReviewRowProviderImpl.ts` (subclass and binding), `.../features/gateway/CmsReviewNotificationHandlerImpl.ts` (subclass and binding)
- Create: `packages/app-headless-cms-workflows/src/presentation/contentReviews/{abstractions,toContentTypes,CmsContentReviewsPresenterImpl,feature}.ts`
- Create: `packages/app-headless-cms-workflows/src/Components/ContentReviews/{CmsContentReviews,CmsContentReviewsSidebarItem}.tsx`
- Create tests: `packages/app-headless-cms-workflows/src/features/gateway/contentReviewsBindings.test.ts`, `packages/app-headless-cms-workflows/src/presentation/contentReviews/CmsContentReviewsPresenterImpl.test.ts`, `packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviews.test.tsx`, `packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviewsSidebarItem.test.tsx`
- Modify: `packages/app-headless-cms-workflows/src/features/gateway/feature.ts` (Task 11: register the two bindings, resolve `rowProvider`), `packages/app-headless-cms-workflows/src/routes.ts` (`tab` parameter), `packages/app-headless-cms-workflows/src/index.tsx` (mount the glue, drop the old footer menu), `packages/app-headless-cms-workflows/package.json` (dependency `@webiny/app-websockets`)
- Modify (root composition tests, exact hunks in Step 1): `packages/app-headless-cms-workflows/src/index.test.tsx` (Task 11; the gated-root cases for this task are added here), `packages/app-headless-cms-workflows/src/index.editor.test.tsx` (Task 20) and `packages/app-headless-cms-workflows/src/index.lists.test.tsx` (Task 21), each only to stub the two new components.
- The old `Components/CmsEntriesWorkflowStateList/` stops being mounted here and is deleted in Task 37. `vitest.config.ts`, the DOM setup file and the svg alias are Task 20's; this task adds none.

**Interfaces:**
- Consumes (deep imports, `@webiny/app-workflows/<path>.js`): Task 28 (`review/mounting/AppReviewRowProvider.js`, `review/mounting/ReviewNotificationHandler.js`, `review/mounting/components/{ReviewContentReviewsRoute,ReviewContentReviewsMenu,ReviewDashboardWidgets}.js`); Task 25 (`IReviewRowProvider` from `review/presentation/reviewList/abstractions.js`); Task 26 (`IReviewContentTypeFilter` from `review/presentation/reviewList/IReviewContentTypeFilter.js`); Task 10 (`ReviewNotificationService` from `review/notifications/abstractions.js`); Task 8 (`IReviewUseCases`, `IReviewContentAdapter`). Task 11 (verified in its plan): the token files `CmsReviewUseCases.ts` and `CmsReviewContentAdapter.ts` and the impl naming `CmsReviewGatewayImpl.ts` exporting `CmsReviewGateway`, `CmsReviewFeature` in `features/gateway/feature.ts`, the composition test `src/index.test.tsx` with its `createContainer(isEnabled)` helper, `features/gateway/feature.test.ts`, the adapter's dependency `ModelsCache`. Task 20: the vitest setup (DOM setup file, svg alias). Existing: `createAppName` (`~/utils/appName.js`), `Routes` (`~/routes.js`), `ListModelsUseCase` (`@webiny/app-headless-cms/features/model/listModels/abstractions.js`), `Notifications` (`@webiny/app-admin/features/notifications/abstractions.js`, `error` from Task 7), `ContentEntryListConfig` (`@webiny/app-headless-cms/admin/config/contentEntries/index.js`), `IsModelPublishable` (`@webiny/app-headless-cms/exports/admin/cms.js`), `WebsocketEventHandler` (`@webiny/app-websockets/events/abstractions.js`), `createReactiveComponent` and `useRouter` (`@webiny/app-admin`), `useFeature` (`@webiny/app`).
- Produces (no later consumer): `CmsReviewRowProvider = createAbstraction<IReviewRowProvider>("Cms/Workflows/ReviewRowProvider")` with its implementation `CmsReviewRowProvider` (`CmsReviewRowProviderImpl.ts`); `CmsReviewNotificationHandler`; `CmsContentReviewsPresenter` token and `CmsContentReviewsPresenterFeature` (`resolve` -> `{ presenter }`, vm `{ loading; namespaces: string[]; options: { label; value }[] }`); the mounted route, menu, widgets, sidebar item and handler. `CmsReviewFeature.resolve` returns `{ useCases, contentAdapter, rowProvider }`.

verify before writing code (record each result in the commit body):
- Task 11's files as written: the token paths `~/features/gateway/CmsReviewUseCases.js` and `~/features/gateway/CmsReviewContentAdapter.js` (the import lines in the two Impl files below); if they moved, change those imports only.
- The admin `CmsModel` (`@webiny/app-headless-cms/types.js`) has `modelId`, `name`, `tags` and `isBeingDeleted` (`packages/app-headless-cms/src/admin/viewsGraphql.ts` reads `isBeingDeleted`).
- `[CMSW]/index.tsx` as Tasks 20 and 21 left it: it still mounts `<CmsEntriesWorkflowStateListFooterMenu />` (replaced here) and registers `CmsReviewFeature`.
- `useRouter().goToRoute(route)` takes no params for a route whose only parameter is optional (`packages/app/src/features/router/abstractions.ts`, `RouteParamsArgs`).
- `INotifications.error` exists (Task 7) with `INotificationInput { title; description? }`.

- [ ] **Step 1: Write the failing tests**

`packages/app-headless-cms-workflows/src/presentation/contentReviews/CmsContentReviewsPresenterImpl.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { CmsContentReviewsPresenter } from "./abstractions.js";
import type { ListedModel } from "./abstractions.js";
import { CmsContentReviewsPresenterFeature } from "./feature.js";

const model = (modelId: string, name: string, overrides: Partial<ListedModel> = {}): ListedModel => {
    return { modelId, name, tags: [], ...overrides };
};

const setup = (execute: () => Promise<ListedModel[]>) => {
    const notifications = { notify: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() };
    const container = new Container();
    container.registerInstance(ListModelsUseCase, {
        execute
    } as unknown as ListModelsUseCase.Interface);
    container.registerInstance(Notifications, notifications as unknown as Notifications.Interface);
    CmsContentReviewsPresenterFeature.register(container);
    return { presenter: container.resolve(CmsContentReviewsPresenter), notifications };
};

describe("CmsContentReviewsPresenter", () => {
    it("starts loading with nothing", () => {
        const { presenter } = setup(() => new Promise(() => undefined));

        expect(presenter.vm).toEqual({ loading: true, namespaces: [], options: [] });
    });

    it("exposes the namespaces and filter options of the models a workflow can bind, sorted by name", async () => {
        const { presenter, notifications } = setup(async () => [
            model("press", "Press release"),
            model("article", "Article"),
            model("hidden", "Hidden", { tags: ["$publishing:false"] }),
            model("gone", "Gone", { isBeingDeleted: true })
        ]);

        await presenter.init();

        expect(presenter.vm).toEqual({
            loading: false,
            namespaces: ["cms.article", "cms.press"],
            options: [
                { label: "Article", value: "article" },
                { label: "Press release", value: "press" }
            ]
        });
        expect(notifications.error).not.toHaveBeenCalled();
    });

    it("ends loading with nothing and tells the viewer once when the list fails", async () => {
        const { presenter, notifications } = setup(() => Promise.reject(new Error("network")));

        await presenter.init();

        expect(presenter.vm).toEqual({ loading: false, namespaces: [], options: [] });
        expect(notifications.error).toHaveBeenCalledTimes(1);
        expect(notifications.error).toHaveBeenCalledWith({
            title: "Could not load the content types",
            description: "Content Reviews will not update live. Reload the page to try again."
        });
    });
});
```

`packages/app-headless-cms-workflows/src/features/gateway/contentReviewsBindings.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { WebsocketEvent } from "@webiny/app-websockets/events/WebsocketEvent.js";
import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { AppReviewRowProvider } from "@webiny/app-workflows/review/mounting/AppReviewRowProvider.js";
import { ReviewNotificationHandler } from "@webiny/app-workflows/review/mounting/ReviewNotificationHandler.js";
import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
import { WORKFLOWS_NOTIFICATION_ACTION } from "@webiny/app-workflows/review/domain/constants.js";
import { CmsReviewFeature } from "./feature.js";
import { CmsReviewRowProvider } from "./CmsReviewRowProvider.js";

const handle = vi.fn();

// The leaf dependencies of Task 11's gateway and adapter (the `MainGraphQLClient` and `ModelsCache`
// registrations its feature test also makes; here `ModelsCache` is a stub because only the handler
// is under test) and the shared service the handler reports to.
const createContainer = (): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, {
        execute: vi.fn()
    } as unknown as MainGraphQLClient.Interface);
    container.registerInstance(ModelsCache, {
        getItem: () => undefined,
        getItems: () => [],
        hasItems: () => true
    } as unknown as ModelsCache.Interface);
    container.registerInstance(ReviewNotificationService, { handle });
    return container;
};

const message = (namespace: string) => {
    return new WebsocketEvent({
        action: WORKFLOWS_NOTIFICATION_ACTION,
        data: {
            event: "assigned",
            reviewId: "review-1",
            stepId: "step-1",
            namespace,
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            title: "Review assigned",
            body: "Maja Kos asked you to review Spring launch"
        }
    });
};

describe("CmsReviewFeature Content Reviews registrations", () => {
    beforeEach(() => {
        handle.mockReset();
    });

    it("registers a row provider that binds only cms namespaces", () => {
        const container = createContainer();
        CmsReviewFeature.register(container);

        const provider = container.resolve(CmsReviewRowProvider);

        expect(provider).toBeInstanceOf(AppReviewRowProvider);
        expect(provider.getBinding("cms.article")).not.toBeNull();
        expect(provider.getBinding("wb.page")).toBeNull();
    });

    it("hands out the same provider as the feature export", () => {
        const container = createContainer();
        CmsReviewFeature.register(container);

        const { rowProvider } = CmsReviewFeature.resolve(container);

        expect(rowProvider).toBe(container.resolve(CmsReviewRowProvider));
    });

    it("registers a notification handler that handles cms messages and ignores wb messages (R223)", async () => {
        const container = createContainer();
        CmsReviewFeature.register(container);

        const handlers = container.resolveAll(WebsocketEventHandler);
        const own = handlers.filter(handler => handler instanceof ReviewNotificationHandler);
        expect(own).toHaveLength(1);

        await own[0].handle(message("cms.article"));
        expect(handle).toHaveBeenCalledTimes(1);
        expect(handle.mock.calls[0][0].data.namespace).toBe("cms.article");
        expect(handle.mock.calls[0][0].url).toContain("/cms/content-entries/article");

        await own[0].handle(message("wb.page"));
        expect(handle).toHaveBeenCalledTimes(1);
    });
});
```

`packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviews.test.tsx`:

```tsx
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
import type { IReviewContentAdapter } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";
import type { IReviewRowProvider } from "@webiny/app-workflows/review/presentation/reviewList/abstractions.js";
import type { IReviewUseCases } from "@webiny/app-workflows/review/useCases/IReviewUseCases.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter.js";
import { CmsReviewRowProvider } from "~/features/gateway/CmsReviewRowProvider.js";
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

vi.mock("@webiny/app-workflows/review/mounting/components/ReviewContentReviewsRoute.js", async () => {
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
});

vi.mock("@webiny/app-workflows/review/mounting/components/ReviewContentReviewsMenu.js", async () => {
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
});

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
        const container = createContainer(() => Promise.reject(new Error("network")));

        mount(container);

        await waitFor(() => {
            expect(screen.getByTestId("route").getAttribute("data-ready")).toBe("true");
        });
        expect(screen.getByTestId("route").getAttribute("data-namespaces")).toBe("");
        expect(JSON.parse(screen.getByTestId("route").getAttribute("data-filter") ?? "null")).toEqual({
            options: []
        });
    });
});
```

`packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviewsSidebarItem.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Routes } from "~/routes.js";
import { CmsContentReviewsSidebarItem } from "./CmsContentReviewsSidebarItem.js";

const goToRoute = vi.hoisted(() => vi.fn());

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useRouter: () => {
            return { goToRoute };
        }
    };
});

vi.mock("@webiny/app-headless-cms/admin/config/contentEntries/index.js", async () => {
    const React = await import("react");
    const Footer = (props: { name: string; element: React.ReactElement }) => {
        return React.createElement(
            "div",
            { "data-testid": "footer", "data-name": props.name },
            props.element
        );
    };
    const Config = ({ children }: { children: React.ReactNode }) => {
        return React.createElement(React.Fragment, null, children);
    };
    return { ContentEntryListConfig: Object.assign(Config, { Browser: { Sidebar: { Footer } } }) };
});

vi.mock("@webiny/app-headless-cms/exports/admin/cms.js", async () => {
    const React = await import("react");
    return {
        IsModelPublishable: ({ children }: { children: React.ReactNode }) => {
            return React.createElement(React.Fragment, null, children);
        }
    };
});

vi.mock("@webiny/admin-ui", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/admin-ui")>();
    const React = await import("react");
    const Item = (props: { text: string; onClick: () => void }) => {
        return React.createElement("button", { onClick: props.onClick }, props.text);
    };
    const ItemIcon = () => React.createElement("span");
    return {
        ...actual,
        Sidebar: { ...actual.Sidebar, Item: Object.assign(Item, { Icon: ItemIcon }) }
    };
});

describe("CmsContentReviewsSidebarItem", () => {
    it("adds a Content Reviews item to the sidebar footer that opens the route", () => {
        render(<CmsContentReviewsSidebarItem />);

        expect(screen.getByTestId("footer").getAttribute("data-name")).toBe("content-reviews");
        fireEvent.click(screen.getByRole("button", { name: "Content Reviews" }));

        expect(goToRoute).toHaveBeenCalledTimes(1);
        expect(goToRoute).toHaveBeenCalledWith(Routes.ContentEntries.ContentReviews);
    });
});
```

The three composition tests that mount the `CmsWorkflows` root get exact hunks, because `index.tsx` now mounts two components that need the admin shell.

`packages/app-headless-cms-workflows/src/index.test.tsx` (Task 11, as Tasks 20 and 21 left it). Replace the mock of the old footer menu

```diff
-vi.mock("~/Components/CmsEntriesWorkflowStateList/index.js", () => {
-    return { CmsEntriesWorkflowStateListFooterMenu: () => null };
-});
+vi.mock("~/Components/ContentReviews/CmsContentReviews.js", () => {
+    return { CmsContentReviews: () => null };
+});
+
+vi.mock("~/Components/ContentReviews/CmsContentReviewsSidebarItem.js", () => {
+    return { CmsContentReviewsSidebarItem: () => null };
+});
```

add the imports next to the existing ones

```diff
+import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
+import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
+import { AppReviewRowProvider } from "@webiny/app-workflows/review/mounting/AppReviewRowProvider.js";
+import { ReviewNotificationHandler } from "@webiny/app-workflows/review/mounting/ReviewNotificationHandler.js";
+import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
+import { CmsReviewRowProvider } from "~/features/gateway/CmsReviewRowProvider.js";
```

register the two leaf dependencies the handler and the provider resolve, in `createContainer`, after the `MainGraphQLClient` line

```diff
         container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
+        container.registerInstance(ModelsCache, {
+            getItem: () => undefined,
+            getItems: () => [],
+            hasItems: () => true
+        } as unknown as ModelsCache.Interface);
+        container.registerInstance(ReviewNotificationService, { handle: vi.fn() });
```

and add two cases to the `describe("CmsWorkflows composition", ...)` block:

```tsx
    it("registers the Content Reviews row provider and the notification handler with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolve(CmsReviewRowProvider)).toBeInstanceOf(AppReviewRowProvider);
        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewNotificationHandler)).toBe(true);
    });

    it("registers neither the row provider nor the notification handler with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(CmsReviewRowProvider)).toThrow("No registration found");
        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewNotificationHandler)).toBe(false);
    });
```

`packages/app-headless-cms-workflows/src/index.editor.test.tsx` (Task 20) and `packages/app-headless-cms-workflows/src/index.lists.test.tsx` (Task 21): in each, replace the same footer-menu mock with the two new mocks (the block is identical in both files as the two tasks wrote them):

```diff
-vi.mock("~/Components/CmsEntriesWorkflowStateList/index.js", () => {
-    return { CmsEntriesWorkflowStateListFooterMenu: () => null };
-});
+vi.mock("~/Components/ContentReviews/CmsContentReviews.js", () => {
+    return { CmsContentReviews: () => null };
+});
+
+vi.mock("~/Components/ContentReviews/CmsContentReviewsSidebarItem.js", () => {
+    return { CmsContentReviewsSidebarItem: () => null };
+});
```

In `index.editor.test.tsx` only, the comment above the first stub names the old module; change its first line to match (Task 21's `index.lists.test.tsx` has no such comment):

```diff
- * The editor route, the Content Reviews footer menu, the "open in new window" option and the old
+ * The editor route, the Content Reviews route, menu and sidebar item, the "open in new window" option and the old
```

No other change in those two files: they mount the real `CmsWorkflows` root, which now registers `CmsContentReviewsPresenterFeature` (register-only, harmless) and mounts the two stubbed components.

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-headless-cms-workflows/src/presentation/contentReviews/CmsContentReviewsPresenterImpl.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/gateway/contentReviewsBindings.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviews.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviewsSidebarItem.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -50
```

Expected: FAIL with `Failed to resolve import` for `./abstractions.js`, `./CmsReviewRowProvider.js`, `./CmsContentReviews.js`, `./CmsContentReviewsSidebarItem.js` and `~/Components/ContentReviews/CmsContentReviews.js` (none exist yet); the two new `index.test.tsx` cases fail for the same missing modules, which the edited mocks name.

- [ ] **Step 3: Implement**

`packages/app-headless-cms-workflows/package.json`: add to `dependencies`, keeping the keys sorted:

```diff
     "@webiny/app-headless-cms-common": "0.0.0",
+    "@webiny/app-websockets": "0.0.0",
     "@webiny/app-workflows": "0.0.0",
```

`packages/app-headless-cms-workflows/src/routes.ts`: the `tab` parameter lets the dashboard's "View all →" open the matching tab; name and path stay as they are (R206):

```diff
         ContentReviews: new Route({
             name: "Cms/ContentEntries/WorkflowStateList",
-            path: "/cms/content-reviews"
+            path: "/cms/content-reviews",
+            params: zod => {
+                return {
+                    tab: zod.string().optional()
+                };
+            }
         })
```

`packages/app-headless-cms-workflows/src/features/gateway/CmsReviewRowProvider.ts` (token):

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewRowProvider } from "@webiny/app-workflows/review/presentation/reviewList/abstractions.js";

export const CmsReviewRowProvider = createAbstraction<IReviewRowProvider>(
    "Cms/Workflows/ReviewRowProvider"
);

export namespace CmsReviewRowProvider {
    export type Interface = IReviewRowProvider;
}
```

`packages/app-headless-cms-workflows/src/features/gateway/CmsReviewRowProviderImpl.ts`:

```ts
import { AppReviewRowProvider } from "@webiny/app-workflows/review/mounting/AppReviewRowProvider.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter.js";
import { CmsReviewRowProvider as Abstraction } from "./CmsReviewRowProvider.js";
import { CmsReviewUseCases } from "./CmsReviewUseCases.js";

// A subclass of its own: `createImplementation` stores the abstraction on the class, so the shared
// class must never be bound directly (it would collide with the Website Builder binding).
class CmsReviewRowProviderImpl extends AppReviewRowProvider implements Abstraction.Interface {}

export const CmsReviewRowProvider = Abstraction.createImplementation({
    implementation: CmsReviewRowProviderImpl,
    dependencies: [CmsReviewUseCases, CmsReviewContentAdapter]
});
```

`packages/app-headless-cms-workflows/src/features/gateway/CmsReviewNotificationHandlerImpl.ts`:

```ts
import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { ReviewNotificationHandler } from "@webiny/app-workflows/review/mounting/ReviewNotificationHandler.js";
import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter.js";

// A subclass of its own (see CmsReviewRowProviderImpl): the Website Builder binds its own.
class CmsReviewNotificationHandlerImpl
    extends ReviewNotificationHandler
    implements WebsocketEventHandler.Interface {}

export const CmsReviewNotificationHandler = WebsocketEventHandler.createImplementation({
    implementation: CmsReviewNotificationHandlerImpl,
    dependencies: [ReviewNotificationService, CmsReviewContentAdapter]
});
```

`packages/app-headless-cms-workflows/src/features/gateway/feature.ts` (Task 11, in its alias style): re-read it, then add the imports next to the existing ones

```diff
+import { CmsReviewRowProvider as RowProviderAbstraction } from "./CmsReviewRowProvider.js";
+import { CmsReviewRowProvider } from "./CmsReviewRowProviderImpl.js";
+import { CmsReviewNotificationHandler } from "./CmsReviewNotificationHandlerImpl.js";
```

the registrations at the end of `register(container)`

```diff
+        container.register(CmsReviewRowProvider).inSingletonScope();
+        container.register(CmsReviewNotificationHandler);
```

and the new member of what `resolve(container)` returns (keep the members Task 11 and Task 20 defined):

```diff
+            rowProvider: container.resolve(RowProviderAbstraction),
```

`packages/app-headless-cms-workflows/src/presentation/contentReviews/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";

/** The part of an admin model the content type list needs. */
export interface ListedModel {
    modelId: string;
    name: string;
    tags?: string[];
    isBeingDeleted?: boolean;
}

export interface ContentType {
    modelId: string;
    name: string;
}

export interface CmsContentTypeOption {
    label: string;
    value: string;
}

export interface ICmsContentReviewsViewModel {
    loading: boolean;
    namespaces: string[];
    options: CmsContentTypeOption[];
}

export interface ICmsContentReviewsPresenter {
    readonly vm: ICmsContentReviewsViewModel;
    init(): Promise<void>;
}

export const CmsContentReviewsPresenter = createAbstraction<ICmsContentReviewsPresenter>(
    "Cms/Workflows/ContentReviewsPresenter"
);

export namespace CmsContentReviewsPresenter {
    export type Interface = ICmsContentReviewsPresenter;
    export type ViewModel = ICmsContentReviewsViewModel;
}
```

`packages/app-headless-cms-workflows/src/presentation/contentReviews/toContentTypes.ts`:

```ts
import type { ContentType } from "./abstractions.js";
import type { ListedModel } from "./abstractions.js";

/** Models that cannot be published cannot be bound to a workflow (mirror of `isBindableModel`). */
const UNPUBLISHABLE_MODEL_TAG = "$publishing:false";

/**
 * The content types a Content Reviews list can show: bindable models that are not being deleted,
 * sorted by name. Private models are not in the admin list (`listContentModels` excludes them).
 */
export const toContentTypes = (models: ListedModel[]): ContentType[] => {
    const bindable = models.filter(model => {
        if (model.isBeingDeleted) {
            return false;
        }
        return !(model.tags ?? []).includes(UNPUBLISHABLE_MODEL_TAG);
    });

    return bindable
        .map(model => {
            return { modelId: model.modelId, name: model.name };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
};
```

`packages/app-headless-cms-workflows/src/presentation/contentReviews/CmsContentReviewsPresenterImpl.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { createAppName } from "~/utils/appName.js";
import { CmsContentReviewsPresenter as Abstraction } from "./abstractions.js";
import type { CmsContentTypeOption } from "./abstractions.js";
import type { ContentType } from "./abstractions.js";
import type { ListedModel } from "./abstractions.js";
import { toContentTypes } from "./toContentTypes.js";

class CmsContentReviewsPresenterImpl implements Abstraction.Interface {
    private _loading = true;
    private _contentTypes: ContentType[] = [];

    constructor(
        private listModels: ListModelsUseCase.Interface,
        private notifications: Notifications.Interface
    ) {
        makeAutoObservable<CmsContentReviewsPresenterImpl, "listModels" | "notifications">(this, {
            listModels: false,
            notifications: false
        });
    }

    get vm(): Abstraction.ViewModel {
        const namespaces = this._contentTypes.map(contentType => {
            return createAppName(contentType);
        });
        const options: CmsContentTypeOption[] = this._contentTypes.map(contentType => {
            return { label: contentType.name, value: contentType.modelId };
        });

        return { loading: this._loading, namespaces, options };
    }

    async init(): Promise<void> {
        try {
            const models = await this.listModels.execute();
            this.applyModels(models);
        } catch {
            this.applyFailure();
            // Without the model list the list has no namespaces to follow: say so once.
            this.notifications.error({
                title: "Could not load the content types",
                description: "Content Reviews will not update live. Reload the page to try again."
            });
        }
    }

    private applyModels(models: ListedModel[]): void {
        this._contentTypes = toContentTypes(models);
        this._loading = false;
    }

    private applyFailure(): void {
        this._contentTypes = [];
        this._loading = false;
    }
}

export const CmsContentReviewsPresenter = Abstraction.createImplementation({
    implementation: CmsContentReviewsPresenterImpl,
    dependencies: [ListModelsUseCase, Notifications]
});
```

`packages/app-headless-cms-workflows/src/presentation/contentReviews/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { CmsContentReviewsPresenter as Abstraction } from "./abstractions.js";
import { CmsContentReviewsPresenter } from "./CmsContentReviewsPresenterImpl.js";

export const CmsContentReviewsPresenterFeature = createFeature({
    name: "Cms/Workflows/ContentReviewsPresenter",
    register(container) {
        // Transient (R212): `useFeature` memoizes the one instance the root component holds.
        container.register(CmsContentReviewsPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
```

`packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviews.tsx`:

```tsx
import React, { useEffect } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { ReviewContentReviewsMenu } from "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsMenu.js";
import { ReviewContentReviewsRoute } from "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsRoute.js";
import { ReviewDashboardWidgets } from "@webiny/app-workflows/review/mounting/components/ReviewDashboardWidgets.js";
import type { IReviewContentTypeFilter } from "@webiny/app-workflows/review/presentation/reviewList/IReviewContentTypeFilter.js";
import { CmsReviewFeature } from "~/features/gateway/feature.js";
import { CmsContentReviewsPresenterFeature } from "~/presentation/contentReviews/feature.js";
import { Routes } from "~/routes.js";

/**
 * Mounts the shared Content Reviews route, menu item and dashboard widgets with the CMS use cases.
 * Only the content type list is CMS knowledge (D113, A80); the page and the widgets wait for it
 * (`ready`), so the list starts once with the real namespaces.
 */
export const CmsContentReviews = createReactiveComponent(() => {
    const { presenter } = useFeature(CmsContentReviewsPresenterFeature);
    const { useCases, rowProvider } = useFeature(CmsReviewFeature);

    useEffect(() => {
        void presenter.init();
    }, [presenter]);

    const vm = presenter.vm;
    const ready = !vm.loading;
    const contentTypeFilter: IReviewContentTypeFilter = { options: vm.options };

    return (
        <>
            <ReviewContentReviewsRoute
                route={Routes.ContentEntries.ContentReviews}
                useCases={useCases}
                rowProvider={rowProvider}
                namespaces={vm.namespaces}
                showContentType={true}
                contentTypeFilter={contentTypeFilter}
                breadcrumbName="cms.content-reviews"
                ready={ready}
            />
            <ReviewContentReviewsMenu
                name="workflows.cms.contentReviews"
                route={Routes.ContentEntries.ContentReviews}
                parent="headlessCMS"
            />
            <ReviewDashboardWidgets
                prefix="cms"
                useCases={useCases}
                namespaces={vm.namespaces}
                rowProvider={rowProvider}
                viewAllRoute={Routes.ContentEntries.ContentReviews}
                ready={ready}
            />
        </>
    );
});
```

`packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviewsSidebarItem.tsx`:

```tsx
import React from "react";
import { Sidebar } from "@webiny/admin-ui";
import { useRouter } from "@webiny/app-admin";
import { ReactComponent as ContentReviewsIcon } from "@webiny/icons/flowchart.svg";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { IsModelPublishable } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { Routes } from "~/routes.js";

const { Browser } = ContentEntryListConfig;

const ContentReviewsSidebarLink = () => {
    const { goToRoute } = useRouter();

    return (
        <IsModelPublishable>
            <div className={"list-none"}>
                <Sidebar.Item
                    onClick={() => goToRoute(Routes.ContentEntries.ContentReviews)}
                    text={"Content Reviews"}
                    icon={
                        <Sidebar.Item.Icon
                            element={<ContentReviewsIcon />}
                            label={"Content Reviews"}
                        />
                    }
                />
            </div>
        </IsModelPublishable>
    );
};

/** The "Content Reviews" item of the content entries sidebar; it opens the route (replaces the overlay). */
export const CmsContentReviewsSidebarItem = () => {
    return (
        <ContentEntryListConfig>
            <Browser.Sidebar.Footer name={"content-reviews"} element={<ContentReviewsSidebarLink />} />
        </ContentEntryListConfig>
    );
};
```

`packages/app-headless-cms-workflows/src/index.tsx`: re-read it as Tasks 20 and 21 left it, then

```diff
-import { CmsEntriesWorkflowStateListFooterMenu } from "~/Components/CmsEntriesWorkflowStateList/index.js";
+import { CmsContentReviews } from "~/Components/ContentReviews/CmsContentReviews.js";
+import { CmsContentReviewsSidebarItem } from "~/Components/ContentReviews/CmsContentReviewsSidebarItem.js";
+import { CmsContentReviewsPresenterFeature } from "~/presentation/contentReviews/feature.js";
```

and inside the gated fragment

```diff
+            <RegisterFeature feature={CmsContentReviewsPresenterFeature} />
```

next to the other `RegisterFeature` lines (after `<RegisterFeature feature={CmsReviewFeature} />`, which runs after the shared features, A77), and

```diff
-            <CmsEntriesWorkflowStateListFooterMenu />
+            <CmsContentReviews />
+            <CmsContentReviewsSidebarItem />
```

where the old footer menu element was mounted. Nothing else in the file changes.

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-headless-cms-workflows/src/presentation/contentReviews/CmsContentReviewsPresenterImpl.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/gateway/contentReviewsBindings.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviews.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviewsSidebarItem.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -50
```

Expected: PASS. Admin packages run `yarn test <path>` only (no storage).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.editor.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.lists.test.tsx 2>&1 | tail -50
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
```

Expected: PASS, no type errors (the package has no `__tests__/**/*.test.ts`, so the build is its type check of the co-located tests, R243). (If Task 11's `feature.test.ts` asserts the exact shape of what `CmsReviewFeature.resolve` returns, extend that expectation by `rowProvider` and say so in the commit body.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full (the `package.json` change makes `yarn`, `adio`, `generateTsConfigsInPackages` and `sync-dependencies` matter) and restore `.gitleaks.toml`:

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(app-headless-cms-workflows): mount Content Reviews, widgets and notifications" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.

**Contract notes:**
- Remaining limit: the route itself is registered at start-up (the router needs it). A direct page load shows the loader until `ListModelsUseCase` returns; the same call fills `ModelsCache`, which Task 11's adapter reads for the content type label, so the labels are ready when the first row renders. If the model list fails the presenter ends loading with no namespaces and raises one error notification (A80).
- The gated-root cases live in Task 11's `index.test.tsx` (flag on: row provider and handler registered; flag off: neither). Tasks 20 and 21's root tests only stub the two new components. The real route and menu under the real `AdminConfig` are smoke-mounted once, in Task 30.
- `AdminConfig.Menu` supports `parent`, so the item nests under `headlessCMS` (the group the existing workflow editor item uses, `packages/app-headless-cms-workflows/src/presentation/CmsWorkflowsEditorView.tsx`); no top-level fallback is needed.
