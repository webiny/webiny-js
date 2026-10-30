### Task 28: Row provider, notification handler, route, menu, widgets components

Spec 13.5; R202, R206, R211, R223, R224, R231; Decisions D133, D159; design README 8; Review Focus 8, 13, 17. The shared mounting pieces every app reuses so that Tasks 29 and 30 contain only registration and glue: the row provider that binds a list to one app's use cases and content adapter, the websocket handler that turns `workflows.notification` messages of one app into toasts, and three components (route, menu item, two dashboard widgets). `app-workflows` still knows no app.

**Binding rule (controller rule, `createImplementation` stores its abstraction and dependencies on the class):** `AppReviewRowProvider` and `ReviewNotificationHandler` are exported as **plain shared classes**. This task never calls `createImplementation` on them. Each app subclasses them once in its own file and binds the subclass (Tasks 29 and 30), so the CMS and WB bindings cannot overwrite each other.

- **`AppReviewRowProvider`:** constructor `(useCases: IReviewUseCases, adapter: IReviewContentAdapter)`; `getBinding(namespace)` returns the app's binding only when `adapter.canHandle(namespace)`, otherwise `null` (an unbound namespace degrades, R206). The binding is `{ useCases, getContentUrl, getContentTypeLabel }` delegating to the adapter.
- **`ReviewNotificationHandler`:** constructor `(service: ReviewNotificationService.Interface, adapter: IReviewContentAdapter)`; ignores every action except `WORKFLOWS_NOTIFICATION_ACTION` and every namespace the adapter cannot handle (each app's handler ignores the other app's messages, R223); otherwise calls `service.handle({ data, url })` with `url = adapter.getContentUrl(...)` built from the message ids (a notification carries no content type id, so the adapter derives it from the namespace).
- **`ReviewContentReviewsRoute`:** `AdminConfig` route inside `AdminLayout` with `Helmet` title "Content Reviews", the breadcrumb "Content Reviews" and the shared `ReviewListView`; reads the optional `tab` route parameter (`parseReviewListTab`) so the widgets' "View all →" opens the matching tab.
- **`ReviewContentReviewsMenu`:** one `AdminConfig.Menu` item "Content Reviews" with a link to the route, optionally nested under an app menu group through `parent`.
- **`ReviewDashboardWidgets`:** two `AdminConfig.Dashboard.Widget` entries named `workflows.<prefix>.review` and `workflows.<prefix>.requested` (R231), column `right`, "View all →" built from the route and the tab.

**Files:**
- Create: `packages/app-workflows/src/review/mounting/AppReviewRowProvider.ts`, `packages/app-workflows/src/review/mounting/ReviewNotificationHandler.ts`
- Create: `packages/app-workflows/src/review/mounting/components/{ReviewContentReviewsRoute,ReviewContentReviewsMenu,ReviewDashboardWidgets}.tsx`
- Create (test support, a vitest fake in the testing folder because a co-located test cannot import from `__tests__/`, TS6059, R243): `packages/app-workflows/src/review/testing/adminConfigStub.tsx`
- Create tests: `packages/app-workflows/src/review/mounting/AppReviewRowProvider.test.ts`, `packages/app-workflows/src/review/mounting/ReviewNotificationHandler.test.ts`, `packages/app-workflows/src/review/mounting/components/ReviewMountingComponents.test.tsx`
- Modify: `packages/app-workflows/package.json` (dependency `@webiny/app-websockets`)

**Interfaces:**
- Consumes: Task 25 (`IReviewRowProvider`, `IReviewRowBinding`, `ReviewListTab`, `parseReviewListTab`); Task 26 (`ReviewListView`, `IReviewContentTypeFilter`); Task 14 (the vitest config with the DOM setup and the svg alias that the icon import of the menu needs); Task 27 (`ReviewForMeWidget`, `ReviewMyRequestsWidget`); Task 10 (`ReviewNotificationService`, `WORKFLOWS_NOTIFICATION_ACTION`, `WorkflowsNotificationData`); Task 8 (`IReviewContentAdapter`, `IReviewUseCases`, `IReviewListUseCases`). Existing: `AdminConfig`, `AdminLayout`, `useRoute`, `useRouter` (`@webiny/app-admin`), `Route` (`@webiny/app/features/router/Route.js`), `WebsocketEventHandler` and `WebsocketEvent` (`@webiny/app-websockets/events/abstractions.js`, `.../events/WebsocketEvent.js`), `react-helmet`, `@webiny/icons/account_tree.svg`; the files these components replace: `packages/app-workflows/src/presentation/ContentReviews.tsx` and `.../workflowStateList/components/WorkflowsMenu.tsx`.
- Produces (consumed by Tasks 29 and 30):
  - `class AppReviewRowProvider implements IReviewRowProvider`, constructor `(useCases: IReviewUseCases, adapter: IReviewContentAdapter)`; plain class, subclassed per app.
  - `class ReviewNotificationHandler implements WebsocketEventHandler.Interface`, constructor `(service: ReviewNotificationService.Interface, adapter: IReviewContentAdapter)`; plain class, subclassed per app.
  - `ReviewContentReviewsRoute` props `{ route: Route<any>; useCases: IReviewListUseCases; rowProvider: IReviewRowProvider; namespaces: string[]; showContentType: boolean; contentTypeFilter: IReviewContentTypeFilter | null; breadcrumbName: string; ready?: boolean }` (`ready` is additive: `false` shows a loader instead of the list, so an app that still loads its namespaces does not start the list twice).
  - `ReviewContentReviewsMenu` props `{ name: string; route: Route<any>; parent?: string }` (the optional `parent` is additive: it nests the item under an app's menu group).
  - `ReviewDashboardWidgets` props `{ prefix: "cms" | "wb"; useCases: IReviewListUseCases; namespaces: string[]; rowProvider: IReviewRowProvider; viewAllRoute: Route<any>; ready?: boolean }` (`ready` additive: `false` registers no widget yet).
  - No barrel additions (R-k): the app packages (Tasks 29 and 30) import these through deep paths, `@webiny/app-workflows/review/mounting/AppReviewRowProvider.js` and so on.

verify before writing code (record each result in the commit body):
- `useRoute` and `useRouter` are exported by `@webiny/app-admin` (`packages/app-admin/src/index.ts`), and `router.getLink(route, params)` accepts `{ tab }` for a route that declares a `tab` parameter (Tasks 29 and 30 add it).
- `AdminConfig.Menu` accepts `parent`, `pinnable`, `element` and `AdminConfig.Dashboard.Widget` accepts `name`, `column`, `element` (`packages/app-admin/src/config/AdminConfig/Menu.tsx`, `Widget.tsx`).
- `WebsocketEvent` carries `payload: { action, data, ... }` (`packages/app-websockets/src/events/WebsocketEvent.ts`); the existing handler `packages/app-file-manager/src/modules/AiEnrichment/AiImageEnrichmentEventHandler.ts` reads `event.payload.data`.
- The Task 10 names `ReviewNotificationService` (namespace `Interface`), `HandleReviewNotificationParams`, `WORKFLOWS_NOTIFICATION_ACTION`, `WorkflowsNotificationData` and their paths.

- [ ] **Step 1: Write the failing tests**

`packages/app-workflows/src/review/testing/adminConfigStub.tsx`:

```tsx
import React from "react";

interface StubProps {
    children?: React.ReactNode;
    [key: string]: unknown;
}

const Passthrough = ({ children }: StubProps) => {
    return <>{children}</>;
};

const Route = (props: StubProps) => {
    const route = props.route as { name: string };
    return (
        <div data-testid="route" data-name={route.name}>
            {props.element as React.ReactNode}
        </div>
    );
};

const MenuLinkIcon = () => {
    return <span />;
};

const MenuLink = (props: StubProps) => {
    return (
        <a data-testid="menu-link" href={props.to as string}>
            {props.text as string}
        </a>
    );
};

const Menu = (props: StubProps) => {
    return (
        <div
            data-testid="menu"
            data-name={props.name as string}
            data-parent={(props.parent as string | undefined) ?? ""}
        >
            {props.element as React.ReactNode}
        </div>
    );
};

const Widget = (props: StubProps) => {
    return (
        <div
            data-testid="widget"
            data-name={props.name as string}
            data-column={props.column as string}
        >
            {props.element as React.ReactNode}
        </div>
    );
};

const Breadcrumb = (props: StubProps) => {
    return (
        <span
            data-testid="breadcrumb"
            data-name={props.name as string}
            data-label={props.label as string}
        />
    );
};

/** Test double of the pieces of `@webiny/app-admin` the mounting components use. */
export const createAdminConfigStub = () => {
    const MenuWithLink = Object.assign(Menu, {
        Link: Object.assign(MenuLink, { Icon: MenuLinkIcon })
    });
    const AdminConfig = Object.assign(Passthrough, {
        Route,
        Menu: MenuWithLink,
        Breadcrumb,
        Dashboard: { Widget }
    });
    return { AdminConfig, AdminLayout: Passthrough };
};
```

`packages/app-workflows/src/review/mounting/AppReviewRowProvider.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { AppReviewRowProvider } from "./AppReviewRowProvider.js";

const createAdapter = (): IReviewContentAdapter => {
    return {
        canHandle: namespace => namespace.startsWith("cms."),
        getContentUrl: vi.fn(ref => `/url/${ref.targetRevisionId}`),
        getContentTypeLabel: vi.fn(contentTypeId => `Label ${contentTypeId}`)
    };
};

describe("AppReviewRowProvider", () => {
    const useCases = { name: "cms" } as unknown as IReviewUseCases;

    it("binds only the namespaces the adapter handles (R206)", () => {
        const provider = new AppReviewRowProvider(useCases, createAdapter());

        expect(provider.getBinding("cms.article")).not.toBeNull();
        expect(provider.getBinding("wb.page")).toBeNull();
    });

    it("hands out the app's use cases and delegates links and labels to the adapter", () => {
        const adapter = createAdapter();
        const provider = new AppReviewRowProvider(useCases, adapter);

        const binding = provider.getBinding("cms.article");

        expect(binding).not.toBeNull();
        expect(binding?.useCases).toBe(useCases);
        const ref = {
            namespace: "cms.article",
            targetId: "e1",
            targetRevisionId: "e1#0001",
            contentTypeId: "article"
        };
        expect(binding?.getContentUrl(ref)).toBe("/url/e1#0001");
        expect(adapter.getContentUrl).toHaveBeenCalledWith(ref);
        expect(binding?.getContentTypeLabel("article")).toBe("Label article");
    });

    it("keeps two providers on two adapters independent (R202)", () => {
        const cms = new AppReviewRowProvider(useCases, createAdapter());
        const wbUseCases = { name: "wb" } as unknown as IReviewUseCases;
        const wb = new AppReviewRowProvider(wbUseCases, {
            canHandle: namespace => namespace === "wb.page",
            getContentUrl: () => "/wb",
            getContentTypeLabel: () => null
        });

        expect(cms.getBinding("wb.page")).toBeNull();
        expect(wb.getBinding("cms.article")).toBeNull();
        expect(wb.getBinding("wb.page")?.useCases).toBe(wbUseCases);
    });
});
```

`packages/app-workflows/src/review/mounting/ReviewNotificationHandler.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { WebsocketEvent } from "@webiny/app-websockets/events/WebsocketEvent.js";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import { WORKFLOWS_NOTIFICATION_ACTION } from "~/review/domain/constants.js";
import type { WorkflowsNotificationData } from "~/review/notifications/abstractions.js";
import type { ReviewNotificationService } from "~/review/notifications/abstractions.js";
import { ReviewNotificationHandler } from "./ReviewNotificationHandler.js";

const data: WorkflowsNotificationData = {
    event: "assigned",
    reviewId: "review-1",
    stepId: "step-1",
    namespace: "cms.article",
    targetId: "entry-1",
    targetRevisionId: "entry-1#0002",
    title: "Review assigned",
    body: "Maja Kos asked you to review Spring launch"
};

const setup = () => {
    const handle = vi.fn();
    const service: ReviewNotificationService.Interface = { handle };
    const adapter: IReviewContentAdapter = {
        canHandle: namespace => namespace.startsWith("cms."),
        getContentUrl: vi.fn(ref => `/cms/content-entries/article?id=${ref.targetRevisionId}`),
        getContentTypeLabel: () => null
    };
    const handler = new ReviewNotificationHandler(service, adapter);
    return { handle, adapter, handler };
};

describe("ReviewNotificationHandler", () => {
    it("ignores an action that is not a workflows notification", async () => {
        const { handle, handler } = setup();

        await handler.handle(new WebsocketEvent({ action: "aco.folder.created", data }));

        expect(handle).not.toHaveBeenCalled();
    });

    it("ignores a malformed message without data or namespace", async () => {
        const { handle, handler } = setup();

        await handler.handle(new WebsocketEvent({ action: WORKFLOWS_NOTIFICATION_ACTION }));
        await handler.handle(
            new WebsocketEvent({ action: WORKFLOWS_NOTIFICATION_ACTION, data: { title: "x" } })
        );

        expect(handle).not.toHaveBeenCalled();
    });

    it("ignores a namespace its app cannot handle (each app ignores the other's messages)", async () => {
        const { handle, handler } = setup();

        await handler.handle(
            new WebsocketEvent({
                action: WORKFLOWS_NOTIFICATION_ACTION,
                data: { ...data, namespace: "wb.page" }
            })
        );

        expect(handle).not.toHaveBeenCalled();
    });

    it("passes a matching message to the service with the adapter's URL", async () => {
        const { handle, adapter, handler } = setup();

        await handler.handle(new WebsocketEvent({ action: WORKFLOWS_NOTIFICATION_ACTION, data }));

        expect(adapter.getContentUrl).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0002",
            contentTypeId: null
        });
        expect(handle).toHaveBeenCalledTimes(1);
        expect(handle).toHaveBeenCalledWith({
            data,
            url: "/cms/content-entries/article?id=entry-1#0002"
        });
    });
});
```

`packages/app-workflows/src/review/mounting/components/ReviewMountingComponents.test.tsx`:

```tsx
import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import { Route } from "@webiny/app/features/router/Route.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewContentReviewsMenu } from "./ReviewContentReviewsMenu.js";
import { ReviewContentReviewsRoute } from "./ReviewContentReviewsRoute.js";
import { ReviewDashboardWidgets } from "./ReviewDashboardWidgets.js";

const routeState = vi.hoisted(() => {
    return { tab: undefined as string | undefined };
});

interface ListViewStubProps {
    namespaces: string[];
    showContentType: boolean;
    contentTypeFilter: { options: unknown[] } | null;
    initialTab?: string;
}

interface WidgetStubProps {
    namespaces: string[];
    viewAllUrl: (tab: string) => string;
}

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const { createAdminConfigStub } = await import("~/review/testing/adminConfigStub.js");
    const stub = createAdminConfigStub();
    return {
        ...actual,
        AdminConfig: stub.AdminConfig,
        AdminLayout: stub.AdminLayout,
        useRoute: () => {
            return { route: { params: { tab: routeState.tab } } };
        },
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

vi.mock("react-helmet", async () => {
    const React = await import("react");
    return {
        default: ({ children }: { children: React.ReactNode }) => {
            return React.createElement("div", { "data-testid": "helmet" }, children);
        }
    };
});

vi.mock("~/review/presentation/reviewList/components/ReviewListView.js", async () => {
    const React = await import("react");
    return {
        ReviewListView: (props: ListViewStubProps) => {
            return React.createElement("div", {
                "data-testid": "list-view",
                "data-namespaces": props.namespaces.join(","),
                "data-show-content-type": String(props.showContentType),
                "data-has-filter": String(props.contentTypeFilter !== null),
                "data-initial-tab": props.initialTab ?? ""
            });
        }
    };
});

vi.mock("~/review/presentation/reviewWidget/components/ReviewForMeWidget.js", async () => {
    const React = await import("react");
    return {
        ReviewForMeWidget: (props: WidgetStubProps) => {
            return React.createElement("div", {
                "data-testid": "for-me",
                "data-namespaces": props.namespaces.join(","),
                "data-url": props.viewAllUrl("pool")
            });
        }
    };
});

vi.mock("~/review/presentation/reviewWidget/components/ReviewMyRequestsWidget.js", async () => {
    const React = await import("react");
    return {
        ReviewMyRequestsWidget: (props: WidgetStubProps) => {
            return React.createElement("div", {
                "data-testid": "my-requests",
                "data-url": props.viewAllUrl("myRequests")
            });
        }
    };
});

const route = new Route({ name: "Cms/ContentEntries/WorkflowStateList", path: "/cms/content-reviews" });
const useCases = {} as unknown as IReviewListUseCases;
const rowProvider: IReviewRowProvider = { getBinding: () => null };

describe("ReviewContentReviewsRoute", () => {
    beforeEach(() => {
        routeState.tab = undefined;
    });

    it("registers the route with the title, the breadcrumb and the shared list view", () => {
        render(
            <ReviewContentReviewsRoute
                route={route}
                useCases={useCases}
                rowProvider={rowProvider}
                namespaces={["cms.article", "cms.press"]}
                showContentType={true}
                contentTypeFilter={{ options: [{ label: "Article", value: "article" }] }}
                breadcrumbName="cms.content-reviews"
            />
        );

        expect(screen.getByTestId("route").getAttribute("data-name")).toBe(
            "Cms/ContentEntries/WorkflowStateList"
        );
        expect(within(screen.getByTestId("helmet")).getByText("Content Reviews")).toBeTruthy();
        const breadcrumb = screen.getByTestId("breadcrumb");
        expect(breadcrumb.getAttribute("data-name")).toBe("cms.content-reviews");
        expect(breadcrumb.getAttribute("data-label")).toBe("Content Reviews");
        const view = screen.getByTestId("list-view");
        expect(view.getAttribute("data-namespaces")).toBe("cms.article,cms.press");
        expect(view.getAttribute("data-show-content-type")).toBe("true");
        expect(view.getAttribute("data-has-filter")).toBe("true");
        expect(view.getAttribute("data-initial-tab")).toBe("");
    });

    it("shows a loader instead of the list until the app is ready", () => {
        render(
            <ReviewContentReviewsRoute
                route={route}
                useCases={useCases}
                rowProvider={rowProvider}
                namespaces={[]}
                showContentType={true}
                contentTypeFilter={null}
                breadcrumbName="cms.content-reviews"
                ready={false}
            />
        );

        expect(screen.queryByTestId("list-view")).toBeNull();
        expect(screen.getByTestId("route")).toBeTruthy();
    });

    it("passes no content type column or filter through for an app without them", () => {
        render(
            <ReviewContentReviewsRoute
                route={route}
                useCases={useCases}
                rowProvider={rowProvider}
                namespaces={["wb.page"]}
                showContentType={false}
                contentTypeFilter={null}
                breadcrumbName="wb.content-reviews"
            />
        );

        const view = screen.getByTestId("list-view");
        expect(view.getAttribute("data-show-content-type")).toBe("false");
        expect(view.getAttribute("data-has-filter")).toBe("false");
    });

    it("opens the tab named by the route parameter and ignores an unknown one", () => {
        routeState.tab = "pool";
        const first = render(
            <ReviewContentReviewsRoute
                route={route}
                useCases={useCases}
                rowProvider={rowProvider}
                namespaces={["cms.article"]}
                showContentType={true}
                contentTypeFilter={null}
                breadcrumbName="cms.content-reviews"
            />
        );
        expect(screen.getByTestId("list-view").getAttribute("data-initial-tab")).toBe("pool");
        first.unmount();

        routeState.tab = "failedSteps";
        render(
            <ReviewContentReviewsRoute
                route={route}
                useCases={useCases}
                rowProvider={rowProvider}
                namespaces={["cms.article"]}
                showContentType={true}
                contentTypeFilter={null}
                breadcrumbName="cms.content-reviews"
            />
        );
        expect(screen.getByTestId("list-view").getAttribute("data-initial-tab")).toBe("");
    });
});

describe("ReviewContentReviewsMenu", () => {
    it("renders one Content Reviews link to the route under its group", () => {
        render(
            <ReviewContentReviewsMenu
                name="workflows.cms.contentReviews"
                route={route}
                parent="headlessCMS"
            />
        );

        const menu = screen.getByTestId("menu");
        expect(menu.getAttribute("data-name")).toBe("workflows.cms.contentReviews");
        expect(menu.getAttribute("data-parent")).toBe("headlessCMS");
        const link = screen.getByTestId("menu-link");
        expect(link.getAttribute("href")).toBe("/cms/content-reviews");
        expect(link.textContent).toBe("Content Reviews");
    });

    it("is top level without a parent", () => {
        render(<ReviewContentReviewsMenu name="workflows.wb.contentReviews" route={route} />);

        expect(screen.getByTestId("menu").getAttribute("data-parent")).toBe("");
    });
});

describe("ReviewDashboardWidgets", () => {
    it("registers the two widgets named per prefix in the right column (R231)", () => {
        render(
            <ReviewDashboardWidgets
                prefix="cms"
                useCases={useCases}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllRoute={route}
            />
        );

        const widgets = screen.getAllByTestId("widget");
        expect(widgets.map(widget => widget.getAttribute("data-name"))).toEqual([
            "workflows.cms.review",
            "workflows.cms.requested"
        ]);
        expect(widgets.map(widget => widget.getAttribute("data-column"))).toEqual([
            "right",
            "right"
        ]);
        expect(screen.getByTestId("for-me").getAttribute("data-namespaces")).toBe("cms.article");
    });

    it("registers no widget until the app is ready", () => {
        render(
            <ReviewDashboardWidgets
                prefix="cms"
                useCases={useCases}
                namespaces={[]}
                rowProvider={rowProvider}
                viewAllRoute={route}
                ready={false}
            />
        );

        expect(screen.queryAllByTestId("widget")).toHaveLength(0);
    });

    it("names the Website Builder widgets with the wb prefix and builds View all links with the tab", () => {
        render(
            <ReviewDashboardWidgets
                prefix="wb"
                useCases={useCases}
                namespaces={["wb.page"]}
                rowProvider={rowProvider}
                viewAllRoute={route}
            />
        );

        expect(
            screen.getAllByTestId("widget").map(widget => widget.getAttribute("data-name"))
        ).toEqual(["workflows.wb.review", "workflows.wb.requested"]);
        expect(screen.getByTestId("for-me").getAttribute("data-url")).toBe(
            "/cms/content-reviews?tab=pool"
        );
        expect(screen.getByTestId("my-requests").getAttribute("data-url")).toBe(
            "/cms/content-reviews?tab=myRequests"
        );
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/mounting/AppReviewRowProvider.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/mounting/ReviewNotificationHandler.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/mounting/components/ReviewMountingComponents.test.tsx 2>&1 | tail -50
```

Expected: FAIL with `Failed to resolve import "./AppReviewRowProvider.js"`, `"./ReviewNotificationHandler.js"` and `"./ReviewContentReviewsMenu.js"` (nothing exists yet). The handler test also needs `@webiny/app-websockets` listed as a dependency (Step 3).

- [ ] **Step 3: Implement**

`packages/app-workflows/package.json`: add to `dependencies`, keeping the keys sorted:

```diff
     "@webiny/app-admin": "0.0.0",
+    "@webiny/app-websockets": "0.0.0",
     "@webiny/feature": "0.0.0",
```

`packages/app-workflows/src/review/mounting/AppReviewRowProvider.ts`:

```ts
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import type { IReviewRowBinding } from "~/review/presentation/reviewList/abstractions.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";

/**
 * Binds the shared list to one app: its use cases and its content adapter. Exported as a plain
 * class on purpose; each app subclasses it in its own file and binds the subclass with
 * `createImplementation`, so two apps never share one class's metadata.
 */
export class AppReviewRowProvider implements IReviewRowProvider {
    private readonly binding: IReviewRowBinding;

    constructor(
        useCases: IReviewUseCases,
        private adapter: IReviewContentAdapter
    ) {
        this.binding = {
            useCases,
            getContentUrl: ref => this.adapter.getContentUrl(ref),
            getContentTypeLabel: contentTypeId => this.adapter.getContentTypeLabel(contentTypeId)
        };
    }

    getBinding(namespace: string): IReviewRowBinding | null {
        if (!this.adapter.canHandle(namespace)) {
            return null;
        }
        return this.binding;
    }
}
```

`packages/app-workflows/src/review/mounting/ReviewNotificationHandler.ts`:

```ts
import type { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import { WORKFLOWS_NOTIFICATION_ACTION } from "~/review/domain/constants.js";
import type { ReviewNotificationService } from "~/review/notifications/abstractions.js";
import type { WorkflowsNotificationData } from "~/review/notifications/abstractions.js";

interface WorkflowsNotificationMessage {
    data?: WorkflowsNotificationData;
}

/**
 * Turns `workflows.notification` websocket messages of one app into toasts. Exported as a plain
 * class; each app subclasses it in its own file and binds the subclass to `WebsocketEventHandler`,
 * so the handler of one app ignores the namespaces of the other (R223).
 */
export class ReviewNotificationHandler implements WebsocketEventHandler.Interface {
    constructor(
        private service: ReviewNotificationService.Interface,
        private adapter: IReviewContentAdapter
    ) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        if (event.payload.action !== WORKFLOWS_NOTIFICATION_ACTION) {
            return;
        }

        // The envelope is `{ action, data }`; the data is the phase 7 contract (R187). A malformed
        // message is ignored rather than allowed to throw inside the event publisher.
        const message = event.payload as WorkflowsNotificationMessage;
        const data = message.data;
        if (!data || typeof data.namespace !== "string") {
            return;
        }
        if (!this.adapter.canHandle(data.namespace)) {
            return;
        }

        const url = this.adapter.getContentUrl({
            namespace: data.namespace,
            targetId: data.targetId,
            targetRevisionId: data.targetRevisionId,
            contentTypeId: null
        });
        this.service.handle({ data, url });
    }
}
```

`packages/app-workflows/src/review/mounting/components/ReviewContentReviewsRoute.tsx`:

```tsx
import React from "react";
import Helmet from "react-helmet";
import { OverlayLoader } from "@webiny/admin-ui";
import { AdminConfig } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { useRoute } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewContentTypeFilter } from "~/review/presentation/reviewList/IReviewContentTypeFilter.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewListView } from "~/review/presentation/reviewList/components/ReviewListView.js";
import { parseReviewListTab } from "~/review/presentation/reviewList/parseReviewListTab.js";

export interface ReviewContentReviewsRouteProps {
    route: Route<any>;
    useCases: IReviewListUseCases;
    rowProvider: IReviewRowProvider;
    namespaces: string[];
    showContentType: boolean;
    contentTypeFilter: IReviewContentTypeFilter | null;
    breadcrumbName: string;
    /** `false` while the app still loads what the list needs (the CMS model list); a loader shows instead of the list. */
    ready?: boolean;
}

const ReviewContentReviewsPage = (props: ReviewContentReviewsRouteProps) => {
    const { route, useCases, rowProvider, namespaces, showContentType, contentTypeFilter } = props;
    const { route: matched } = useRoute(route);
    const tab = parseReviewListTab(matched?.params?.tab);

    let view: React.ReactNode = <OverlayLoader />;
    if (props.ready ?? true) {
        view = (
            <ReviewListView
                useCases={useCases}
                rowProvider={rowProvider}
                namespaces={namespaces}
                showContentType={showContentType}
                contentTypeFilter={contentTypeFilter}
                initialTab={tab ?? undefined}
            />
        );
    }

    return (
        <AdminLayout>
            <Helmet>
                <title>Content Reviews</title>
            </Helmet>
            <AdminConfig.Breadcrumb name={props.breadcrumbName} label="Content Reviews" />
            {view}
        </AdminLayout>
    );
};

/** One Content Reviews route per app over the shared list view (R206). */
export const ReviewContentReviewsRoute = (props: ReviewContentReviewsRouteProps) => {
    return (
        <AdminConfig>
            <AdminConfig.Route
                route={props.route}
                element={<ReviewContentReviewsPage {...props} />}
            />
        </AdminConfig>
    );
};
```

`packages/app-workflows/src/review/mounting/components/ReviewContentReviewsMenu.tsx`:

```tsx
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";
import { ReactComponent as ContentReviewsIcon } from "@webiny/icons/account_tree.svg";

export interface ReviewContentReviewsMenuProps {
    name: string;
    route: Route<any>;
    parent?: string;
}

/** The "Content Reviews" menu item of one app; `parent` nests it under that app's menu group. */
export const ReviewContentReviewsMenu = ({ name, route, parent }: ReviewContentReviewsMenuProps) => {
    const router = useRouter();
    const { Menu } = AdminConfig;

    return (
        <Menu
            name={name}
            parent={parent ?? null}
            pinnable={true}
            element={
                <Menu.Link
                    icon={
                        <Menu.Link.Icon
                            label="Content Reviews"
                            element={<ContentReviewsIcon />}
                        />
                    }
                    text="Content Reviews"
                    to={router.getLink(route)}
                    pinnable={true}
                />
            }
        />
    );
};
```

`packages/app-workflows/src/review/mounting/components/ReviewDashboardWidgets.tsx`:

```tsx
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewForMeWidget } from "~/review/presentation/reviewWidget/components/ReviewForMeWidget.js";
import { ReviewMyRequestsWidget } from "~/review/presentation/reviewWidget/components/ReviewMyRequestsWidget.js";

export interface ReviewDashboardWidgetsProps {
    prefix: "cms" | "wb";
    useCases: IReviewListUseCases;
    namespaces: string[];
    rowProvider: IReviewRowProvider;
    viewAllRoute: Route<any>;
    /** `false` while the app still loads its namespaces: no widget is registered yet, so none starts twice. */
    ready?: boolean;
}

/** The two dashboard widgets of one app (R231): For me to review, and My requests. */
export const ReviewDashboardWidgets = (props: ReviewDashboardWidgetsProps) => {
    const { prefix, useCases, namespaces, rowProvider, viewAllRoute } = props;
    const router = useRouter();
    const { Widget } = AdminConfig.Dashboard;

    if (props.ready === false) {
        return null;
    }

    const viewAllUrl = (tab: ReviewListTab): string => {
        return router.getLink(viewAllRoute, { tab });
    };

    return (
        <AdminConfig>
            <Widget
                name={`workflows.${prefix}.review`}
                column="right"
                element={
                    <ReviewForMeWidget
                        useCases={useCases}
                        namespaces={namespaces}
                        rowProvider={rowProvider}
                        viewAllUrl={viewAllUrl}
                    />
                }
            />
            <Widget
                name={`workflows.${prefix}.requested`}
                column="right"
                element={
                    <ReviewMyRequestsWidget
                        useCases={useCases}
                        namespaces={namespaces}
                        rowProvider={rowProvider}
                        viewAllUrl={viewAllUrl}
                    />
                }
            />
        </AdminConfig>
    );
};
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/mounting/AppReviewRowProvider.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/mounting/ReviewNotificationHandler.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/mounting/components/ReviewMountingComponents.test.tsx 2>&1 | tail -50
```

Expected: PASS. Admin packages run `yarn test <path>` only (no storage).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx 2>&1 | tail -50
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: PASS, no type errors.

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
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(app-workflows): add the shared Content Reviews mounting pieces" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start. The package is built here because Tasks 29 and 30 import it.

**Contract notes:**
- A notification carries no content type id, so `ReviewNotificationHandler` passes `contentTypeId: null` to `getContentUrl`. **verify (Task 11):** the CMS adapter's `getContentUrl` must derive the model id from `ref.namespace` (`cms.<modelId>`), not from `ref.contentTypeId`. If it uses `contentTypeId`, change the CMS adapter, not this handler.
- The test stub `src/review/testing/adminConfigStub.tsx` (the contract's Files name `__tests__/support/`; a co-located test importing from `__tests__/` fails the build with TS6059, R243, so it sits next to the other vitest fakes) replaces `AdminConfig`, `AdminLayout`, `useRoute` and `useRouter` of `@webiny/app-admin` in the component tests because the real config components only emit properties into the admin shell; the real mounting is asserted from each app's root in Tasks 29 and 30.
