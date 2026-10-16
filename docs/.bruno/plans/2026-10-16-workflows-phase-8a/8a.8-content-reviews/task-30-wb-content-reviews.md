### Task 30: WB Content Reviews mounting glue

Spec 13.5; R202, R206, R211, R223, R231, R237; A77; Decisions D113, D159; Review Focus 1, 8, 17, 21. The Website Builder mounts the shared Content Reviews pieces of Task 28 with its own use cases and content adapter. Pure glue: registration, route, menu, widgets and the sidebar item. Unlike the CMS there is no content type: the WB view has no "Content type" column and no content-type filter (D113), and its single namespace is `wb.page`, so nothing has to load before the list can start (no `ready` gating).

- **Registration (subclass rule, R237):** the shared `AppReviewRowProvider` and `ReviewNotificationHandler` are plain classes. The WB subclasses each in its own file and binds the subclass, in Task 12's naming style (`<Token>Impl.ts` exported under the token): `WbReviewRowProviderImpl.ts` exports `WbReviewRowProvider` (abstraction in `WbReviewRowProvider.ts`, dependencies `[WbReviewUseCases, WbReviewContentAdapter]`) and `WbReviewNotificationHandlerImpl.ts` exports `WbReviewNotificationHandler` (abstraction `WebsocketEventHandler`, dependencies `[ReviewNotificationService, WbReviewContentAdapter]`). `WbReviewFeature` registers both, so the handler ignores every namespace except `wb.page` (R223) and a CMS message never reaches it; the CMS bindings stay untouched in their own subclasses (Review Focus 1).
- **Mount (`WbContentReviews`):** one route (`Routes.Pages.WorkflowStateList`, name `WebsiteBuilder/Pages/WorkflowStateList`, `/website-builder/pages/content-reviews`, now with an optional `tab` parameter for "View all →"), one menu item `workflows.wb.contentReviews` nested under the Website Builder group (`parent: "wb"`, the group the existing WB workflow editor menu uses), the two widgets with prefix `wb` (`workflows.wb.review`, `workflows.wb.requested`), `namespaces: ["wb.page"]`, `showContentType: false`, `contentTypeFilter: null`.
- **Sidebar (`WbContentReviewsSidebarItem`):** replaces `PagesListContentReviews`; the "Content Reviews" item in the page list sidebar footer (`Browser.Sidebar.Footer name="contentReviews"`) now navigates to the route instead of opening an overlay. `PagesList` mounts it.

**Files:**
- Create: `packages/app-website-builder-workflows/src/features/gateway/WbReviewRowProvider.ts` (token), `.../features/gateway/WbReviewRowProviderImpl.ts` (subclass and binding), `.../features/gateway/WbReviewNotificationHandlerImpl.ts` (subclass and binding)
- Create: `packages/app-website-builder-workflows/src/Components/ContentReviews/{WbContentReviews,WbContentReviewsSidebarItem}.tsx`
- Create tests: `packages/app-website-builder-workflows/src/features/gateway/contentReviewsBindings.test.ts`, `packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.test.tsx`, `packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.smoke.test.tsx`, `packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviewsSidebarItem.test.tsx`, `packages/app-website-builder-workflows/src/Components/PagesList/PagesList.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/features/gateway/feature.ts` (Task 12: register the two bindings, resolve `rowProvider`), `packages/app-website-builder-workflows/src/routes.ts` (`tab` parameter), `packages/app-website-builder-workflows/src/index.tsx` (mount `WbContentReviews`), `packages/app-website-builder-workflows/src/Components/PagesList/PagesList.tsx` (mount the new sidebar item instead of `PagesListContentReviews`), `packages/app-website-builder-workflows/package.json` (dependency `@webiny/app-websockets`, devDependency `@webiny/react-composition` for the smoke test)
- Modify (root composition tests, exact hunks in Step 1): `packages/app-website-builder-workflows/src/index.test.tsx` (Task 12; the gated-root cases for this task are added here), `src/editorGlue.wiring.test.tsx` (Task 22), `src/publishAutosave.wiring.test.tsx` (Task 23), `src/pageListGlue.wiring.test.tsx` (Task 24), each only to stub the new component.
- `vitest.config.ts` is Task 12's and needs no change: the tests mock the `.svg` imports they render, as Tasks 22 and 23 do, and clean up with `afterEach(cleanup)`. The old `Components/PagesList/PagesListContentReviews.tsx` stops being mounted here and is deleted in Task 37.

**Interfaces:**
- Consumes (deep imports, `@webiny/app-workflows/<path>.js`): Task 28 (`review/mounting/AppReviewRowProvider.js`, `review/mounting/ReviewNotificationHandler.js`, `review/mounting/components/{ReviewContentReviewsRoute,ReviewContentReviewsMenu,ReviewDashboardWidgets}.js`); Task 25 (`IReviewRowProvider` from `review/presentation/reviewList/abstractions.js`); Task 10 (`ReviewNotificationService` from `review/notifications/abstractions.js`); Task 8 (`IReviewUseCases`, `IReviewContentAdapter`). Task 12 (verified in its plan): the token files `WbReviewUseCases.ts` and `WbReviewContentAdapter.ts`, the impl naming `WbReviewGatewayImpl.ts` exporting `WbReviewGateway`, `WbReviewFeature` in `features/gateway/feature.ts`, the composition test `src/index.test.tsx` with its `createContainer(isEnabled)` helper, `features/gateway/feature.test.ts`. Existing: `WB_PAGE_APP` (`~/constants.js`, `"wb.page"`), `Routes` (`~/routes.js`), `PageListConfig` (`@webiny/app-website-builder`), `WebsocketEventHandler` (`@webiny/app-websockets/events/abstractions.js`), `useRouter` (`@webiny/app-admin`), `useFeature` (`@webiny/app`), admin-ui `Sidebar`, `@webiny/icons/work_outline.svg`, `AdminWithConfig`, `AdminConfigPlugin`, `useAdminConfig` (`@webiny/app-admin/config/AdminConfig.js`), `RouterWithConfig`, `useRouterConfig` (`@webiny/app/config/RouterConfig.js`), `CompositionProvider` (`@webiny/react-composition`).
- Produces (no later consumer): `WbReviewRowProvider = createAbstraction<IReviewRowProvider>("WebsiteBuilder/Workflows/ReviewRowProvider")` with its implementation `WbReviewRowProvider` (`WbReviewRowProviderImpl.ts`); `WbReviewNotificationHandler`; `WbContentReviews`, `WbContentReviewsSidebarItem`; the mounted route, menu, widgets, sidebar item and handler. `WbReviewFeature.resolve` returns `{ useCases, contentAdapter, rowProvider }`.

verify before writing code (record each result in the commit body):
- Task 12's files as written: the token paths `~/features/gateway/WbReviewUseCases.js` and `~/features/gateway/WbReviewContentAdapter.js` (the import lines in the two Impl files below); if they moved, change those imports only.
- `[WBW]/index.tsx` as Tasks 22 to 24 left it: it mounts `<PagesList />` (which holds the old footer item) and registers `WbReviewFeature`; `[WBW]/Components/PagesList/PagesList.tsx` still mounts `<PagesListContentReviews />` and `<PageListChangeStatus />` (Task 24 rewrote `PageListChangeStatus.tsx` only).
- `PageListConfig` exposes `Browser.Sidebar.Footer` with a `name` and an `element` (as `PagesListContentReviews.tsx` uses it); the existing file also passes `className="w-full"` to `Sidebar.Item`, keep it.
- `useRouter().goToRoute(route)` takes no params for a route whose only parameter is optional (`packages/app/src/features/router/abstractions.ts`, `RouteParamsArgs`).
- For the smoke test: `RouterWithConfig` renders its composed config itself and its children only after the first property flush, while `AdminWithConfig` needs `AdminConfigPlugin` (`packages/react-properties/src/createConfigurableComponent.tsx`, `packages/app-admin/src/config/AdminConfig.tsx` lines 31-54). If the probe does not see the registrations, adjust the nesting, not the assertions.

- [ ] **Step 1: Write the failing tests**

`packages/app-website-builder-workflows/src/features/gateway/contentReviewsBindings.test.ts`:

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
import { CmsReviewContentAdapter } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewContentAdapter.js";
import { CmsReviewNotificationHandler } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewNotificationHandlerImpl.js";
import { CmsReviewRowProvider as CmsRowProviderAbstraction } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewRowProvider.js";
import { CmsReviewRowProvider } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewRowProviderImpl.js";
import { CmsReviewUseCases } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewUseCases.js";
import type { IReviewContentAdapter } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";
import { AppReviewRowProvider } from "@webiny/app-workflows/review/mounting/AppReviewRowProvider.js";
import { ReviewNotificationHandler } from "@webiny/app-workflows/review/mounting/ReviewNotificationHandler.js";
import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
import { WORKFLOWS_NOTIFICATION_ACTION } from "@webiny/app-workflows/review/domain/constants.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { WbReviewFeature } from "./feature.js";
import { WbReviewRowProvider } from "./WbReviewRowProvider.js";

const handle = vi.fn();

// The leaf dependency of Task 12's gateway (the fake its feature test registers) and the shared
// service the handler reports to.
const createContainer = (): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
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
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            title: "Review assigned",
            body: "Maja Kos asked you to review Home"
        }
    });
};

describe("WbReviewFeature Content Reviews registrations", () => {
    beforeEach(() => {
        handle.mockReset();
    });

    it("registers a row provider that binds only the page namespace", () => {
        const container = createContainer();
        WbReviewFeature.register(container);

        const provider = container.resolve(WbReviewRowProvider);

        expect(provider).toBeInstanceOf(AppReviewRowProvider);
        expect(provider.getBinding("wb.page")).not.toBeNull();
        expect(provider.getBinding("cms.article")).toBeNull();
    });

    it("hands out the same provider as the feature export", () => {
        const container = createContainer();
        WbReviewFeature.register(container);

        const { rowProvider } = WbReviewFeature.resolve(container);

        expect(rowProvider).toBe(container.resolve(WbReviewRowProvider));
    });

    it("registers a notification handler that handles page messages and ignores cms messages (R223)", async () => {
        const container = createContainer();
        WbReviewFeature.register(container);

        const handlers = container.resolveAll(WebsocketEventHandler);
        const own = handlers.filter(handler => handler instanceof ReviewNotificationHandler);
        expect(own).toHaveLength(1);

        await own[0].handle(message("wb.page"));
        expect(handle).toHaveBeenCalledTimes(1);
        expect(handle.mock.calls[0][0].data.namespace).toBe("wb.page");
        expect(handle.mock.calls[0][0].url).toContain("/website-builder/pages/editor/");

        await own[0].handle(message("cms.article"));
        expect(handle).toHaveBeenCalledTimes(1);
    });

    it("coexists with the CMS bindings in one container, each binding only its own namespace (R237)", async () => {
        const container = createContainer();
        WbReviewFeature.register(container);
        const cmsAdapter: IReviewContentAdapter = {
            canHandle: namespace => namespace.startsWith("cms."),
            getContentUrl: () => "/cms/content-entries/article?id=entry-1%230001",
            getContentTypeLabel: () => null
        };
        container.registerInstance(CmsReviewUseCases, createFakeUseCases());
        container.registerInstance(CmsReviewContentAdapter, cmsAdapter);
        container.register(CmsReviewRowProvider).inSingletonScope();
        container.register(CmsReviewNotificationHandler);

        const wbProvider = container.resolve(WbReviewRowProvider);
        const cmsProvider = container.resolve(CmsRowProviderAbstraction);

        expect(cmsProvider).not.toBe(wbProvider);
        expect(wbProvider.getBinding("wb.page")).not.toBeNull();
        expect(wbProvider.getBinding("cms.article")).toBeNull();
        expect(cmsProvider.getBinding("cms.article")).not.toBeNull();
        expect(cmsProvider.getBinding("wb.page")).toBeNull();

        const handlers = container
            .resolveAll(WebsocketEventHandler)
            .filter(handler => handler instanceof ReviewNotificationHandler);
        expect(handlers).toHaveLength(2);

        for (const handler of handlers) {
            await handler.handle(message("wb.page"));
        }
        expect(handle).toHaveBeenCalledTimes(1);
        expect(handle.mock.calls[0][0].url).toContain("/website-builder/pages/editor/");

        for (const handler of handlers) {
            await handler.handle(message("cms.article"));
        }
        expect(handle).toHaveBeenCalledTimes(2);
        expect(handle.mock.calls[1][0].url).toBe("/cms/content-entries/article?id=entry-1%230001");
    });
});
```

`packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import type { IReviewContentAdapter } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";
import type { IReviewRowProvider } from "@webiny/app-workflows/review/presentation/reviewList/abstractions.js";
import type { IReviewUseCases } from "@webiny/app-workflows/review/useCases/IReviewUseCases.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter.js";
import { WbReviewRowProvider } from "~/features/gateway/WbReviewRowProvider.js";
import { Routes } from "~/routes.js";
import { WbContentReviews } from "./WbContentReviews.js";

interface RouteStubProps {
    route: { name: string };
    useCases: { name: string };
    namespaces: string[];
    showContentType: boolean;
    contentTypeFilter: unknown;
    breadcrumbName: string;
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
                "data-filter": String(props.contentTypeFilter),
                "data-breadcrumb": props.breadcrumbName
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
                "data-route": props.viewAllRoute.name
            });
        }
    };
});

describe("WbContentReviews", () => {
    afterEach(() => {
        cleanup();
    });

    it("mounts the shared route, menu and widgets with the WB use cases and no content type", () => {
        const container = new Container();
        const useCases = { name: "wb" } as unknown as IReviewUseCases;
        const rowProvider: IReviewRowProvider = { getBinding: () => null };
        container.registerInstance(WbReviewUseCases, useCases);
        container.registerInstance(WbReviewContentAdapter, {} as unknown as IReviewContentAdapter);
        container.registerInstance(WbReviewRowProvider, rowProvider);

        render(
            <DiContainerProvider container={container}>
                <WbContentReviews />
            </DiContainerProvider>
        );

        const route = screen.getByTestId("route");
        expect(route.getAttribute("data-route")).toBe(Routes.Pages.WorkflowStateList.name);
        expect(route.getAttribute("data-usecases")).toBe("wb");
        expect(route.getAttribute("data-namespaces")).toBe("wb.page");
        expect(route.getAttribute("data-show-content-type")).toBe("false");
        expect(route.getAttribute("data-filter")).toBe("null");
        expect(route.getAttribute("data-breadcrumb")).toBe("wb.content-reviews");

        const menu = screen.getByTestId("menu");
        expect(menu.getAttribute("data-name")).toBe("workflows.wb.contentReviews");
        expect(menu.getAttribute("data-parent")).toBe("wb");
        expect(menu.getAttribute("data-route")).toBe(Routes.Pages.WorkflowStateList.name);

        const widgets = screen.getByTestId("widgets");
        expect(widgets.getAttribute("data-prefix")).toBe("wb");
        expect(widgets.getAttribute("data-usecases")).toBe("wb");
        expect(widgets.getAttribute("data-namespaces")).toBe("wb.page");
        expect(widgets.getAttribute("data-route")).toBe(Routes.Pages.WorkflowStateList.name);
    });
});
```

`packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.smoke.test.tsx` (the one place where the shared route, menu and widgets mount under the real admin and router configs, so a wrong property name or placement fails here and not in the browser):

```tsx
import React from "react";
import { afterEach } from "vitest";
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
import { AdminConfigPlugin } from "@webiny/app-admin/config/AdminConfig.js";
import { AdminWithConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { useAdminConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { CompositionProvider } from "@webiny/react-composition";
import type { IReviewContentAdapter } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";
import type { IReviewRowProvider } from "@webiny/app-workflows/review/presentation/reviewList/abstractions.js";
import type { IReviewUseCases } from "@webiny/app-workflows/review/useCases/IReviewUseCases.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter.js";
import { WbReviewRowProvider } from "~/features/gateway/WbReviewRowProvider.js";
import { WbContentReviews } from "./WbContentReviews.js";

// The menu icon is an svg import; the router is not under test (only `getLink` is read).
vi.mock("@webiny/icons/account_tree.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useRouter: () => {
            return {
                getLink: (route: { path: string }, params?: { tab: string }) => {
                    if (params) {
                        return `${route.path}?tab=${params.tab}`;
                    }
                    return route.path;
                }
            };
        }
    };
});

const Probe = () => {
    const adminConfig = useAdminConfig();
    const routerConfig = useRouterConfig();

    const menus = adminConfig.menus.map(menu => `${menu.name}:${menu.parent ?? ""}`);
    const widgets = adminConfig.widgets.map(widget => `${widget.name}:${widget.column}`);
    const routes = routerConfig.routes.map(item => item.route.name);

    return (
        <div
            data-testid="probe"
            data-menus={menus.join(",")}
            data-widgets={widgets.join(",")}
            data-routes={routes.join(",")}
        />
    );
};

describe("WbContentReviews under the real admin and router configs", () => {
    afterEach(() => {
        cleanup();
    });

    it("registers the route, the menu item and the two widgets", async () => {
        const container = new Container();
        container.registerInstance(WbReviewUseCases, { name: "wb" } as unknown as IReviewUseCases);
        container.registerInstance(WbReviewContentAdapter, {} as unknown as IReviewContentAdapter);
        container.registerInstance(WbReviewRowProvider, {
            getBinding: () => null
        } as IReviewRowProvider);

        render(
            <DiContainerProvider container={container}>
                <CompositionProvider>
                    <RouterWithConfig>
                        <AdminWithConfig>
                            <WbContentReviews />
                            {AdminConfigPlugin}
                            <Probe />
                        </AdminWithConfig>
                    </RouterWithConfig>
                </CompositionProvider>
            </DiContainerProvider>
        );

        const probe = await screen.findByTestId("probe");
        await vi.waitFor(() => {
            expect(probe.getAttribute("data-routes")).toBe("WebsiteBuilder/Pages/WorkflowStateList");
        });
        expect(probe.getAttribute("data-menus")).toBe("workflows.wb.contentReviews:wb");
        expect(probe.getAttribute("data-widgets")).toBe(
            "workflows.wb.review:right,workflows.wb.requested:right"
        );
    });
});
```

`packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviewsSidebarItem.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Routes } from "~/routes.js";
import { WbContentReviewsSidebarItem } from "./WbContentReviewsSidebarItem.js";

const goToRoute = vi.hoisted(() => vi.fn());

vi.mock("@webiny/icons/work_outline.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useRouter: () => {
            return { goToRoute };
        }
    };
});

vi.mock("@webiny/app-website-builder", async () => {
    const React = await import("react");
    const Footer = (props: { name: string; element: React.ReactElement }) => {
        return React.createElement(
            "div",
            { "data-testid": "footer", "data-name": props.name },
            props.element
        );
    };
    return { PageListConfig: { Browser: { Sidebar: { Footer } } } };
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

describe("WbContentReviewsSidebarItem", () => {
    afterEach(() => {
        cleanup();
    });

    it("adds a Content Reviews item to the page list footer that opens the route", () => {
        render(<WbContentReviewsSidebarItem />);

        expect(screen.getByTestId("footer").getAttribute("data-name")).toBe("contentReviews");
        fireEvent.click(screen.getByRole("button", { name: "Content Reviews" }));

        expect(goToRoute).toHaveBeenCalledTimes(1);
        expect(goToRoute).toHaveBeenCalledWith(Routes.Pages.WorkflowStateList);
    });
});
```

`packages/app-website-builder-workflows/src/Components/PagesList/PagesList.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { PagesList } from "./PagesList.js";

vi.mock("@webiny/app-website-builder", async () => {
    const React = await import("react");
    const Config = ({ children }: { children: React.ReactNode }) => {
        return React.createElement("div", { "data-testid": "page-list-config" }, children);
    };
    return {
        PageListConfig: Object.assign(Config, { Browser: { Sidebar: { Footer: () => null } } })
    };
});

vi.mock("./PageListChangeStatus.js", async () => {
    const React = await import("react");
    return {
        PageListChangeStatus: () => React.createElement("div", { "data-testid": "change-status" })
    };
});

vi.mock("~/Components/ContentReviews/WbContentReviewsSidebarItem.js", async () => {
    const React = await import("react");
    return {
        WbContentReviewsSidebarItem: () =>
            React.createElement("div", { "data-testid": "wb-content-reviews-sidebar" })
    };
});

describe("PagesList", () => {
    afterEach(() => {
        cleanup();
    });

    it("mounts the Content Reviews sidebar item next to the change status decoration", () => {
        render(<PagesList />);

        expect(screen.getByTestId("wb-content-reviews-sidebar")).toBeTruthy();
        expect(screen.getByTestId("change-status")).toBeTruthy();
    });
});
```

The four tests that mount the `WebsiteBuilderWorkflows` root get exact hunks, because `index.tsx` now mounts `WbContentReviews`, which needs the admin shell.

`packages/app-website-builder-workflows/src/index.test.tsx` (Task 12, as Tasks 22 to 24 left it). Add the stub next to the existing `vi.mock("~/Components/index.js", ...)`:

```diff
+vi.mock("~/Components/ContentReviews/WbContentReviews.js", () => {
+    return { WbContentReviews: () => null };
+});
```

add the imports next to the existing ones

```diff
+import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
+import { AppReviewRowProvider } from "@webiny/app-workflows/review/mounting/AppReviewRowProvider.js";
+import { ReviewNotificationHandler } from "@webiny/app-workflows/review/mounting/ReviewNotificationHandler.js";
+import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
+import { WbReviewRowProvider } from "~/features/gateway/WbReviewRowProvider.js";
```

register the shared service the handler resolves, in `createContainer`, after the `MainGraphQLClient` line

```diff
         container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
+        container.registerInstance(ReviewNotificationService, { handle: vi.fn() });
```

and add two cases to the `describe("WebsiteBuilderWorkflows composition", ...)` block:

```tsx
    it("registers the Content Reviews row provider and the notification handler with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolve(WbReviewRowProvider)).toBeInstanceOf(AppReviewRowProvider);
        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewNotificationHandler)).toBe(true);
    });

    it("registers neither the row provider nor the notification handler with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(WbReviewRowProvider)).toThrow("No registration found");
        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewNotificationHandler)).toBe(false);
    });
```

`packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx` (Task 22), `src/publishAutosave.wiring.test.tsx` (Task 23) and `src/pageListGlue.wiring.test.tsx` (Task 24): in each, add the same stub directly after the existing `vi.mock("~/Components/PagesList/index.js", ...)` block (the three files have it in the same form):

```diff
 vi.mock("~/Components/PagesList/index.js", () => {
     return { PagesList: () => null };
 });
+
+vi.mock("~/Components/ContentReviews/WbContentReviews.js", () => {
+    return { WbContentReviews: () => null };
+});
```

No other change in those three files: they mount the real root, which now also mounts the stubbed `WbContentReviews`.

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-website-builder-workflows/src/features/gateway/contentReviewsBindings.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.smoke.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviewsSidebarItem.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PagesList/PagesList.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -50
```

Expected: FAIL with `Failed to resolve import` for `./WbReviewRowProvider.js`, `./WbContentReviews.js`, `./WbContentReviewsSidebarItem.js` and `~/Components/ContentReviews/WbContentReviews.js` (none exist yet); the `PagesList` test fails because `PagesList.tsx` still mounts `PagesListContentReviews`.

- [ ] **Step 3: Implement**

`packages/app-website-builder-workflows/package.json`: add the dependency (keys sorted) and the test-only devDependency:

```diff
     "@webiny/app-website-builder": "0.0.0",
+    "@webiny/app-websockets": "0.0.0",
     "@webiny/app-workflows": "0.0.0",
```

```diff
   "devDependencies": {
     "@types/react": "18.3.31",
     "@webiny/build-tools": "0.0.0",
+    "@webiny/react-composition": "0.0.0",
```

(keep the devDependencies Task 12 added: `vitest`, `@testing-library/react`; `yarn adio` in the pre-commit chain confirms the final lists.)

`packages/app-website-builder-workflows/src/routes.ts`: the `tab` parameter lets the dashboard's "View all →" open the matching tab; name and path stay as they are (R206):

```diff
         WorkflowStateList: new Route({
             name: "WebsiteBuilder/Pages/WorkflowStateList",
-            path: "/website-builder/pages/content-reviews"
+            path: "/website-builder/pages/content-reviews",
+            params: zod => {
+                return {
+                    tab: zod.string().optional()
+                };
+            }
         })
```

`packages/app-website-builder-workflows/src/features/gateway/WbReviewRowProvider.ts` (token):

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewRowProvider } from "@webiny/app-workflows/review/presentation/reviewList/abstractions.js";

export const WbReviewRowProvider = createAbstraction<IReviewRowProvider>(
    "WebsiteBuilder/Workflows/ReviewRowProvider"
);

export namespace WbReviewRowProvider {
    export type Interface = IReviewRowProvider;
}
```

`packages/app-website-builder-workflows/src/features/gateway/WbReviewRowProviderImpl.ts`:

```ts
import { AppReviewRowProvider } from "@webiny/app-workflows/review/mounting/AppReviewRowProvider.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapter.js";
import { WbReviewRowProvider as Abstraction } from "./WbReviewRowProvider.js";
import { WbReviewUseCases } from "./WbReviewUseCases.js";

// A subclass of its own: `createImplementation` stores the abstraction on the class, so the shared
// class must never be bound directly (it would collide with the CMS binding).
class WbReviewRowProviderImpl extends AppReviewRowProvider implements Abstraction.Interface {}

export const WbReviewRowProvider = Abstraction.createImplementation({
    implementation: WbReviewRowProviderImpl,
    dependencies: [WbReviewUseCases, WbReviewContentAdapter]
});
```

`packages/app-website-builder-workflows/src/features/gateway/WbReviewNotificationHandlerImpl.ts`:

```ts
import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { ReviewNotificationHandler } from "@webiny/app-workflows/review/mounting/ReviewNotificationHandler.js";
import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapter.js";

// A subclass of its own (see WbReviewRowProviderImpl): the CMS binds its own.
class WbReviewNotificationHandlerImpl
    extends ReviewNotificationHandler
    implements WebsocketEventHandler.Interface {}

export const WbReviewNotificationHandler = WebsocketEventHandler.createImplementation({
    implementation: WbReviewNotificationHandlerImpl,
    dependencies: [ReviewNotificationService, WbReviewContentAdapter]
});
```

`packages/app-website-builder-workflows/src/features/gateway/feature.ts` (Task 12, in its alias style): re-read it, then add the imports next to the existing ones

```diff
+import { WbReviewRowProvider as RowProviderAbstraction } from "./WbReviewRowProvider.js";
+import { WbReviewRowProvider } from "./WbReviewRowProviderImpl.js";
+import { WbReviewNotificationHandler } from "./WbReviewNotificationHandlerImpl.js";
```

the registrations at the end of `register(container)`

```diff
+        container.register(WbReviewRowProvider).inSingletonScope();
+        container.register(WbReviewNotificationHandler);
```

and the new member of what `resolve(container)` returns (keep the members Task 12 and Task 22 defined):

```diff
+            rowProvider: container.resolve(RowProviderAbstraction),
```

`packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.tsx`:

```tsx
import React from "react";
import { useFeature } from "@webiny/app";
import { ReviewContentReviewsMenu } from "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsMenu.js";
import { ReviewContentReviewsRoute } from "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsRoute.js";
import { ReviewDashboardWidgets } from "@webiny/app-workflows/review/mounting/components/ReviewDashboardWidgets.js";
import { WB_PAGE_APP } from "~/constants.js";
import { WbReviewFeature } from "~/features/gateway/feature.js";
import { Routes } from "~/routes.js";

const NAMESPACES = [WB_PAGE_APP];

/**
 * Mounts the shared Content Reviews route, menu item and dashboard widgets with the Website
 * Builder use cases. Pages have no content type: no Content type column and no filter (D113).
 */
export const WbContentReviews = () => {
    const { useCases, rowProvider } = useFeature(WbReviewFeature);

    return (
        <>
            <ReviewContentReviewsRoute
                route={Routes.Pages.WorkflowStateList}
                useCases={useCases}
                rowProvider={rowProvider}
                namespaces={NAMESPACES}
                showContentType={false}
                contentTypeFilter={null}
                breadcrumbName="wb.content-reviews"
            />
            <ReviewContentReviewsMenu
                name="workflows.wb.contentReviews"
                route={Routes.Pages.WorkflowStateList}
                parent="wb"
            />
            <ReviewDashboardWidgets
                prefix="wb"
                useCases={useCases}
                namespaces={NAMESPACES}
                rowProvider={rowProvider}
                viewAllRoute={Routes.Pages.WorkflowStateList}
            />
        </>
    );
};
```

`packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviewsSidebarItem.tsx`:

```tsx
import React from "react";
import { Sidebar } from "@webiny/admin-ui";
import { useRouter } from "@webiny/app-admin";
import { PageListConfig } from "@webiny/app-website-builder";
import { ReactComponent as ContentReviewsIcon } from "@webiny/icons/work_outline.svg";
import { Routes } from "~/routes.js";

const { Browser } = PageListConfig;

const ContentReviewsSidebarLink = () => {
    const { goToRoute } = useRouter();

    return (
        <Sidebar.Item
            className={"w-full"}
            onClick={() => goToRoute(Routes.Pages.WorkflowStateList)}
            text={"Content Reviews"}
            icon={<Sidebar.Item.Icon element={<ContentReviewsIcon />} label={"Content Reviews"} />}
        />
    );
};

/** The "Content Reviews" item of the page list sidebar; it opens the route (replaces the overlay). */
export const WbContentReviewsSidebarItem = () => {
    return (
        <Browser.Sidebar.Footer name={"contentReviews"} element={<ContentReviewsSidebarLink />} />
    );
};
```

`packages/app-website-builder-workflows/src/Components/PagesList/PagesList.tsx`: mount the new item in place of the old one (the whole file after this change):

```tsx
import React from "react";
import { PageListConfig } from "@webiny/app-website-builder";
import { WbContentReviewsSidebarItem } from "~/Components/ContentReviews/WbContentReviewsSidebarItem.js";
import { PageListChangeStatus } from "./PageListChangeStatus.js";

export const PagesList = () => {
    return (
        <PageListConfig>
            {/* Add a Content Reviews item to the footer of the sidebar */}
            <WbContentReviewsSidebarItem />
            {/* Decorate the Change Status action in row options to hide it for pages in certain workflow states */}
            <PageListChangeStatus />
        </PageListConfig>
    );
};
```

(Re-read the file first and keep anything a later edit added; only the one element and its import change.)

`packages/app-website-builder-workflows/src/index.tsx`: re-read it as Tasks 22 to 24 left it, then

```diff
+import { WbContentReviews } from "~/Components/ContentReviews/WbContentReviews.js";
```

and inside the gated fragment, after `<RegisterFeature feature={WbReviewFeature} />` (which runs after the shared features, A77):

```diff
+            <WbContentReviews />
```

Nothing else in the file changes; the sidebar item is mounted through `PagesList`, which `index.tsx` already mounts.

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-website-builder-workflows/src/features/gateway/contentReviewsBindings.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.smoke.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviewsSidebarItem.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PagesList/PagesList.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -50
```

Expected: PASS. Admin packages run `yarn test <path>` only (no storage).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/publishAutosave.wiring.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/pageListGlue.wiring.test.tsx 2>&1 | tail -50
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

`check:test:types` lists only packages with a `__tests__/**/*.test.ts` file, which this package does not have, so the package build is the type check of its co-located tests (R243). Expected: PASS, no type errors. (If Task 12's `feature.test.ts` asserts the exact shape of what `WbReviewFeature.resolve` returns, extend that expectation by `rowProvider` and say so in the commit body. Run the other tests of Tasks 12 and 22 to 24 that touch `index.tsx`, `routes.ts` or `PagesList.tsx` the same way, one path per command.)

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
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(app-website-builder-workflows): mount Content Reviews, widgets and notifications" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.

**Contract notes:**
- The WB subclasses each shared class (R237) and binds the subclass; `contentReviewsBindings.test.ts` proves the WB and CMS bindings coexist in one container through the `@webiny/app-headless-cms-workflows` devDependency Task 12 added (the CMS row provider and handler are registered next to the WB ones with a fake CMS adapter and use cases). It imports the Task 29 files named in the contract (`CmsReviewRowProvider.ts`, `CmsReviewRowProviderImpl.ts`, `CmsReviewNotificationHandlerImpl.ts`); if Task 29 named them differently, change those imports only.
- `PagesList.tsx` is modified (the contract's file list names it): the thinnest way to keep the sidebar footer item in the one place the page list config is declared.
- The smoke test mounts the real shared route, menu and widgets under the real `AdminWithConfig` and `RouterWithConfig` and asserts what they register (the route name, the menu name with its `wb` parent, the two widget names in the right column); it is the one real-config mount for Tasks 29 and 30 (the CMS glue differs only in its model list).
- No `ready` gating here: the only namespace is a constant, so the list starts once. No vitest config change: Task 12's config stays, svg imports are mocked in the tests that render them, and `cleanup` is called in `afterEach` (Task 22's test runner note).
