### Task 12: The Content Reviews list and the dashboard widgets inject `ListReviewsUseCase`

R348 (#23), R349, R352, R353, R354, R355; Q69, Q70; Review Focus 3, 4, 8 (`../00-shared.md`). The admin-layers Global Constraints apply unchanged (R342; one class or component per file; one named import per line; no inline object types; no nested call arguments; presenters own render-ready state, R234; namespace types outside the declaring file; targeted tests by path, one command at a time; the pre-commit chain; one commit). Inherited: 8a R210 (live refetch rules, unchanged), R231 (widgets per app).

The Content Reviews list and the two dashboard widgets are per app; they stop receiving the app's list use case at runtime and route by `app` instead (R348 #23: lists route by app, the namespace's app, A117). The CMS and Website Builder review features stop resolving `useCases` (R354), so nothing in the plugin pass resolves a use case (R349).

- **Presenters (R352).** `ReviewListPresenter` and `ReviewWidgetPresenter` depend on `[ListReviewsUseCase, ReviewActivity, IdentityContext]`. They keep `private app: WorkflowAppKind | null` (set by `init`, cleared by `dispose`) where they kept the use cases, and every load sends `{ app, ...the old request }` to `listReviewsUseCase.execute`. `ReviewListPresenter.createParams(app, limit, after)` returns `ListReviewsUseCase.Params` (R345: presenters reach the parameter types only through `XUseCase.Params`). The generation tokens, the queued refetch, the refetch window and the row diffing stay (Review Focus 4).
- **Init params and props (R353).** `ReviewListInitParams` and `ReviewWidgetInitParams` replace `useCases` by `app: WorkflowAppKind`. `ReviewContentReviewsRoute`, `ReviewListView`, `ReviewForMeWidget`, `ReviewMyRequestsWidget` and `ReviewWidgetCard` replace their `useCases` prop by `app`. `ReviewDashboardWidgets` drops `useCases` and passes `app={prefix}` (its `prefix` is already `"cms" | "wb"`). `CmsContentReviews` passes `app="cms"`, `WbContentReviews` `app="wb"`.
- **Features (R354).** `CmsReviewFeature` and `WbReviewFeature` resolve `{ contentAdapter, rowProvider }`; they still register the old per-app bundles (the trash decorators use them until Task 13; Task 14 removes them).
- **Tests (R355).** Each list and widget test registers one `{ execute: vi.fn() }` under `ListReviewsUseCase` and reads it as `listReviews.execute`; exact request assertions gain `app`. The mounting and Content Reviews tests assert the `app` that each mount passes (Review Focus 3: the CMS list sends `app: "cms"`, the WB list `app: "wb"`). The two-widget independence test keeps its assertion with one injected use case answering by list kind.

**Files:**
- Modify: `packages/app-workflows/src/review/presentation/reviewList/{abstractions.ts,ReviewListPresenter.ts,components/ReviewListView.tsx}`
- Modify: `packages/app-workflows/src/review/presentation/reviewWidget/{abstractions.ts,ReviewWidgetPresenter.ts,components/ReviewWidgetCard.tsx,components/ReviewForMeWidget.tsx,components/ReviewMyRequestsWidget.tsx}`
- Modify: `packages/app-workflows/src/review/mounting/components/{ReviewContentReviewsRoute.tsx,ReviewDashboardWidgets.tsx}`
- Modify: `packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviews.tsx`, `packages/app-headless-cms-workflows/src/features/gateway/feature.ts`
- Modify: `packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.tsx`, `packages/app-website-builder-workflows/src/features/gateway/feature.ts`
- Modify (tests): `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts`, `packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx`, `packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.test.ts`, `packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx` (whole file), `packages/app-workflows/src/review/mounting/components/ReviewMountingComponents.test.tsx`, `packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviews.test.tsx`, `packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.test.tsx`, `packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.smoke.test.tsx`, `packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts`, `packages/app-website-builder-workflows/src/features/gateway/feature.test.ts`

**Interfaces:**
- Consumes: Task 8 (`ListReviewsUseCase` with `Params` `ListReviewsUseCaseParams extends ListReviewsParams { app }`; `ReviewListPage` at `~/review/domain/ReviewListPage.js`), Task 5 (`WorkflowAppKind`), Task 11 (`IReviewRowBinding` without `useCases`). Existing (verified): `REVIEW_LIST_PAGE_SIZE`, `REVIEW_WIDGET_PAGE_SIZE` (`[AWR]/domain/constants.ts`), `createReviewListItem`, `renderWithContainer` (`[AWRT]`), `ReviewWidgetPresenterFeature`, `ReviewListPresenterFeature`.
- Produces (matches the contract): R352 rows for `ReviewListPresenter`, `ReviewWidgetPresenter`; R353: `ReviewListInitParams.app`, `ReviewWidgetInitParams.app`, the `app` props of the mounting components, `CmsContentReviews` / `WbContentReviews` passing `app`; R354: `CmsReviewFeature` / `WbReviewFeature` resolving `{ contentAdapter, rowProvider }`.

**Test runner note:** admin packages, `yarn test <path>` only, one command at a time; `.tsx` tests import `React`. Type check: `yarn build -p @webiny/<package> --no-cache`.

- [ ] **Step 1: Write the failing tests**

**1a. Presenter and view tests (pattern).** In `ReviewListPresenter.test.ts`, `ReviewWidgetPresenter.test.ts` and `ReviewListView.test.tsx` the local `listReviews` becomes the fake of the injected use case (`{ execute }`), registered in the container before the presenter resolves; `params` carry `app: "cms"`; the view renders with `app="cms"`.

```bash
for F in packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.test.ts packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx; do
  sed -i '' -E \
    -e 's/listReviews\.m/listReviews.execute.m/g' \
    -e 's/listReviews\)/listReviews.execute)/g' \
    "$F"
done
```

Then by hand, per file.

`ReviewListPresenter.test.ts`. Imports, before:

```ts
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
```

After:

```ts
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
```

Before:

```ts
const setup = (teamCount = 1, permissions: IPermission[] = []) => {
    const container = new Container();
    container.register(ReviewActivity).inSingletonScope();
    container.registerInstance(IdentityContext, createIdentityContext(teamCount, permissions));
    ReviewListPresenterFeature.register(container);
    const activity = container.resolve(ReviewActivityAbstraction);
    const presenter = container.resolve(ReviewListPresenter);
    const listReviews = vi.fn<IReviewListUseCases["listReviews"]>();
    const useCases: IReviewListUseCases = { listReviews };
    const params: ReviewListInitParams = {
        useCases,
        namespaces: ["cms.article", "cms.press"],
```

After:

```ts
// The injected list use case as a fake (R355); the list routes by app (R348).
const setup = (teamCount = 1, permissions: IPermission[] = []) => {
    const container = new Container();
    const listReviews = { execute: vi.fn<ListReviewsUseCase.Interface["execute"]>() };
    container.registerInstance(ListReviewsUseCase, listReviews);
    container.register(ReviewActivity).inSingletonScope();
    container.registerInstance(IdentityContext, createIdentityContext(teamCount, permissions));
    ReviewListPresenterFeature.register(container);
    const activity = container.resolve(ReviewActivityAbstraction);
    const presenter = container.resolve(ReviewListPresenter);
    const params: ReviewListInitParams = {
        app: "cms",
        namespaces: ["cms.article", "cms.press"],
```

Every exact request assertion gains the app as its first field. The lines (HEAD numbering) 113, 192, 202, 216, 237, 283, 895, 913, 942, 959: `expect(listReviews.execute).toHaveBeenCalledWith({` / `toHaveBeenLastCalledWith({` followed by `list: ...` becomes the same call with `app: "cms",` before `list:`. Worked example, before:

```ts
        expect(listReviews.execute).toHaveBeenCalledWith({
            list: "assignedToMe",
            where: {},
            sort: "lastChangedOn_ASC",
            limit: REVIEW_LIST_PAGE_SIZE,
            after: null
        });
```

After:

```ts
        expect(listReviews.execute).toHaveBeenCalledWith({
            app: "cms",
            list: "assignedToMe",
            where: {},
            sort: "lastChangedOn_ASC",
            limit: REVIEW_LIST_PAGE_SIZE,
            after: null
        });
```

Add one case after "loads the first page of the initial tab with its default sort" (R348, Review Focus 3):

```ts
    it("lists the reviews of the app it was opened for (R348)", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.execute.mockResolvedValue(page([]));

        await presenter.init({ ...params, app: "wb", namespaces: ["wb.page"] });
        await presenter.setTab("pool");

        const apps = listReviews.execute.mock.calls.map(call => call[0].app);
        expect(apps).toEqual(["wb", "wb"]);
    });
```

`ReviewWidgetPresenter.test.ts`. Imports, before:

```ts
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
```

After:

```ts
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
```

Before:

```ts
const setup = (kind: ReviewWidgetKind, teamCount = 1) => {
    const container = new Container();
    container.register(ReviewActivity).inSingletonScope();
    container.registerInstance(IdentityContext, createIdentityContext(teamCount));
    ReviewWidgetPresenterFeature.register(container);
    const activity = container.resolve(ReviewActivityAbstraction);
    const presenter = container.resolve(ReviewWidgetPresenter);
    const listReviews = vi.fn<IReviewListUseCases["listReviews"]>();
    const useCases: IReviewListUseCases = { listReviews };
    const params = { useCases, namespaces: ["cms.article"], kind, rowProvider };
    return { container, presenter, activity, listReviews, params };
};
```

After:

```ts
const setup = (kind: ReviewWidgetKind, teamCount = 1) => {
    const container = new Container();
    const listReviews = { execute: vi.fn<ListReviewsUseCase.Interface["execute"]>() };
    container.registerInstance(ListReviewsUseCase, listReviews);
    container.register(ReviewActivity).inSingletonScope();
    container.registerInstance(IdentityContext, createIdentityContext(teamCount));
    ReviewWidgetPresenterFeature.register(container);
    const activity = container.resolve(ReviewActivityAbstraction);
    const presenter = container.resolve(ReviewWidgetPresenter);
    const params: ReviewWidgetInitParams = {
        app: "cms",
        namespaces: ["cms.article"],
        kind,
        rowProvider
    };
    return { container, presenter, activity, listReviews, params };
};
```

(add `import type { ReviewWidgetInitParams } from "./abstractions.js";`). The exact assertion at line 81 gains `app: "cms",` before `list:` as above.

`ReviewListView.test.tsx`. Imports, before:

```ts
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
```

After:

```ts
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
```

In `renderView`, before (after the `sed`):

```tsx
    ReviewListPresenterFeature.register(container);
    const activity = container.resolve(ReviewActivityAbstraction);

    const listReviews = vi.fn<IReviewListUseCases["listReviews"]>();
    listReviews.execute.mockResolvedValue(page([]));
```

After:

```tsx
    const listReviews = { execute: vi.fn<ListReviewsUseCase.Interface["execute"]>() };
    container.registerInstance(ListReviewsUseCase, listReviews);
    ReviewListPresenterFeature.register(container);
    const activity = container.resolve(ReviewActivityAbstraction);

    listReviews.execute.mockResolvedValue(page([]));
```

Before:

```tsx
    const useCases: IReviewListUseCases = { listReviews };

    renderWithAdminUi(
        <DiContainerProvider container={container}>
            <ReviewListView
                useCases={useCases}
                rowProvider={rowProvider}
```

After:

```tsx
    renderWithAdminUi(
        <DiContainerProvider container={container}>
            <ReviewListView
                app={"cms"}
                rowProvider={rowProvider}
```

Add one case (Review Focus 3):

```tsx
    it("lists the reviews of the app the route passes (R348)", async () => {
        const { listReviews } = renderView({ results: [page([])] });

        await waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(1));

        expect(listReviews.execute.mock.calls[0][0].app).toBe("cms");
    });
```

**1b. `ReviewWidgets.test.tsx`** (whole file after; the behaviour assertions are the old ones, the fakes are new):

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import { ReviewActivity as ReviewActivityAbstraction } from "~/review/activity/abstractions.js";
import { ReviewActivity } from "~/review/activity/ReviewActivity.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
import { ReviewWidgetPresenterFeature } from "../feature.js";
import { ReviewForMeWidget } from "./ReviewForMeWidget.js";
import { ReviewMyRequestsWidget } from "./ReviewMyRequestsWidget.js";

const page = (items: ReturnType<typeof createReviewListItem>[]): ReviewListPage => {
    return { items, meta: { cursor: null, hasMoreItems: false } };
};

const rowProvider: IReviewRowProvider = {
    getBinding: () => {
        return {
            getContentUrl: ref => `/content/${ref.targetId}`,
            getContentTypeLabel: contentTypeId => `Type ${contentTypeId}`
        };
    }
};

type ListResult = ReviewListPage | Error;

// The injected list use case (R355): answers the given results in order, then empty pages.
const createListReviews = (...results: ListResult[]) => {
    const execute = vi.fn<ListReviewsUseCase.Interface["execute"]>();
    execute.mockResolvedValue(page([]));
    results.forEach(result => {
        if (result instanceof Error) {
            execute.mockRejectedValueOnce(result);
            return;
        }
        execute.mockResolvedValueOnce(result);
    });
    return { execute };
};

type ListReviewsFake = ReturnType<typeof createListReviews>;

const viewAllUrl = (tab: ReviewListTab): string => `/content-reviews?tab=${tab}`;

const mount = (ui: React.ReactElement, listReviews: ListReviewsFake, teamCount = 1) => {
    const container = new Container();
    container.registerInstance(ListReviewsUseCase, listReviews);
    container.register(ReviewActivity).inSingletonScope();
    const teams = Array.from({ length: teamCount }, (_, index) => {
        return { id: `team-${index}`, slug: `team-${index}`, name: `Team ${index}` };
    });
    const identity = { teams } as unknown as Identity;
    container.registerInstance(IdentityContext, {
        getIdentity: () => identity,
        setIdentity: vi.fn(),
        clear: vi.fn()
    });
    ReviewWidgetPresenterFeature.register(container);
    renderWithContainer(ui, container);
    return { activity: container.resolve(ReviewActivityAbstraction) };
};

const callsOf = (listReviews: ListReviewsFake, mine: boolean): number => {
    return listReviews.execute.mock.calls.filter(call => {
        return (call[0].list === "myRequests") !== mine;
    }).length;
};

describe("review dashboard widgets", () => {
    it("renders For me to review with its rows, link, step line and View all", async () => {
        const item = createReviewListItem({
            id: "r1",
            targetId: "e1",
            title: "Spring launch",
            stepTitle: "Legal check",
            modelId: "article"
        });
        const listReviews = createListReviews(page([item]));

        mount(
            <ReviewForMeWidget
                app={"cms"}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />,
            listReviews
        );

        expect(await screen.findByText("For me to review")).toBeTruthy();
        const link = await screen.findByRole("link", { name: "Spring launch" });
        expect(link.getAttribute("href")).toBe("/content/e1");
        expect(screen.getByText("Legal check · Type article")).toBeTruthy();
        expect(screen.getByRole("link", { name: "View all →" }).getAttribute("href")).toBe(
            "/content-reviews?tab=assignedToMe"
        );
        expect(listReviews.execute.mock.calls[0][0].app).toBe("cms");
    });

    it("switches the segment and points View all at the matching tab", async () => {
        const listReviews = createListReviews(page([]), page([]));
        mount(
            <ReviewForMeWidget
                app={"cms"}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />,
            listReviews
        );
        await screen.findByText("Nothing assigned to you");

        fireEvent.click(screen.getByRole("radio", { name: "Team pool" }));

        expect(await screen.findByText("Your team pools are empty")).toBeTruthy();
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({ app: "cms", list: "pool" })
        );
        expect(screen.getByRole("link", { name: "View all →" }).getAttribute("href")).toBe(
            "/content-reviews?tab=pool"
        );
    });

    it("tells a viewer in no team so on the Team pool segment (QBZ-73)", async () => {
        const listReviews = createListReviews(page([]), page([]));
        mount(
            <ReviewForMeWidget
                app={"cms"}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />,
            listReviews,
            0
        );
        await screen.findByText("Nothing assigned to you");

        fireEvent.click(screen.getByRole("radio", { name: "Team pool" }));

        expect(await screen.findByText("You’re not in a reviewing team")).toBeTruthy();
    });

    it("renders My requests with its empty state and View all to My requests", async () => {
        const listReviews = createListReviews(page([]));
        mount(
            <ReviewMyRequestsWidget
                app={"wb"}
                namespaces={["wb.page"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />,
            listReviews
        );

        expect(await screen.findByText("My requests")).toBeTruthy();
        expect(await screen.findByText("You haven’t requested any reviews")).toBeTruthy();
        expect(screen.queryByRole("radio")).toBeNull();
        expect(screen.getByRole("link", { name: "View all →" }).getAttribute("href")).toBe(
            "/content-reviews?tab=myRequests"
        );
        expect(listReviews.execute.mock.calls[0][0].app).toBe("wb");
    });

    it("shows the loading skeleton before the first response", async () => {
        const execute = vi.fn<ListReviewsUseCase.Interface["execute"]>();
        const pending = new Promise<ReviewListPage>(() => undefined);
        execute.mockReturnValue(pending);
        mount(
            <ReviewMyRequestsWidget
                app={"cms"}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />,
            { execute }
        );

        expect(await screen.findByTestId("review-widget-loading")).toBeTruthy();
        expect(screen.queryByText("You haven’t requested any reviews")).toBeNull();
    });

    it("shows the error state and retries", async () => {
        const item = createReviewListItem({ id: "r1", title: "Back again" });
        const listReviews = createListReviews(new Error("network"), page([item]));
        mount(
            <ReviewMyRequestsWidget
                app={"cms"}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />,
            listReviews
        );

        expect(await screen.findByText("Could not load reviews.")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(await screen.findByText("Back again")).toBeTruthy();
        expect(listReviews.execute).toHaveBeenCalledTimes(2);
    });

    it("keeps two widgets independent and refreshes only the one whose namespace signals", async () => {
        const mineItem = createReviewListItem({ id: "a", title: "Mine" });
        const requestedItem = createReviewListItem({ id: "b", title: "Requested" });
        // One injected use case answers both widgets, by the list each asks for.
        const execute = vi.fn<ListReviewsUseCase.Interface["execute"]>(async params => {
            if (params.list === "myRequests") {
                return page([requestedItem]);
            }
            return page([mineItem]);
        });
        const listReviews = { execute };
        const { activity } = mount(
            <>
                <ReviewForMeWidget
                    app={"cms"}
                    namespaces={["cms.article"]}
                    rowProvider={rowProvider}
                    viewAllUrl={viewAllUrl}
                />
                <ReviewMyRequestsWidget
                    app={"cms"}
                    namespaces={["wb.page"]}
                    rowProvider={rowProvider}
                    viewAllUrl={viewAllUrl}
                />
            </>,
            listReviews
        );
        await screen.findByText("Mine");
        await screen.findByText("Requested");

        act(() => {
            activity.notify({
                namespace: "cms.article",
                source: "remote",
                reviewId: null,
                targetRevisionId: null
            });
        });

        await vi.waitFor(() => expect(callsOf(listReviews, true)).toBe(2));
        expect(callsOf(listReviews, false)).toBe(1);

        fireEvent.click(screen.getByRole("radio", { name: "Team pool" }));
        await vi.waitFor(() => expect(callsOf(listReviews, true)).toBe(3));
        const requested = within(screen.getByTestId("review-widget-myRequests"));
        expect(requested.getByText("Requested")).toBeTruthy();
        expect(callsOf(listReviews, false)).toBe(1);
    });
});
```

**1c. Mounting components** (`ReviewMountingComponents.test.tsx`). The stubs record the `app` they receive:

Before:

```tsx
interface ListViewStubProps {
    namespaces: string[];
```

After:

```tsx
interface ListViewStubProps {
    app: string;
    namespaces: string[];
```

Before:

```tsx
interface WidgetStubProps {
    namespaces: string[];
```

After:

```tsx
interface WidgetStubProps {
    app: string;
    namespaces: string[];
```

In the `ReviewListView` stub, before:

```tsx
                "data-testid": "list-view",
                "data-namespaces": props.namespaces.join(","),
```

After:

```tsx
                "data-testid": "list-view",
                "data-app": props.app,
                "data-namespaces": props.namespaces.join(","),
```

In the `ReviewForMeWidget` stub, before:

```tsx
                "data-testid": "for-me",
                "data-namespaces": props.namespaces.join(","),
```

After:

```tsx
                "data-testid": "for-me",
                "data-app": props.app,
                "data-namespaces": props.namespaces.join(","),
```

In the `ReviewMyRequestsWidget` stub, before:

```tsx
                "data-testid": "my-requests",
                "data-url": props.viewAllUrl("myRequests")
```

After:

```tsx
                "data-testid": "my-requests",
                "data-app": props.app,
                "data-url": props.viewAllUrl("myRequests")
```

Delete `const useCases = {} as unknown as IReviewListUseCases;` and its import. Every `<ReviewContentReviewsRoute` element's `useCases={useCases}` becomes `app={"cms"}` (the WB case, `breadcrumbName="wb.content-reviews"`, gets `app={"wb"}`); every `<ReviewDashboardWidgets` element loses `useCases={useCases}`. Assertions added:

- "registers the route with the title, the breadcrumb and the shared list view": `expect(view.getAttribute("data-app")).toBe("cms");`
- "passes no content type column or filter through for an app without them": `expect(view.getAttribute("data-app")).toBe("wb");`
- "registers the two widgets named per prefix in the right column (R231)": `expect(screen.getByTestId("for-me").getAttribute("data-app")).toBe("cms");` and `expect(screen.getByTestId("my-requests").getAttribute("data-app")).toBe("cms");`
- "names the Website Builder widgets with the wb prefix ...": `expect(screen.getByTestId("for-me").getAttribute("data-app")).toBe("wb");`

**1d. Content Reviews mounts.** `CmsContentReviews.test.tsx`: in `RouteStubProps` `useCases: { name: string };` becomes `app: string;`; `WidgetsStubProps` loses `useCases`; the route stub writes `"data-app": props.app` in place of `"data-usecases": props.useCases.name`; the widgets stub drops its `"data-usecases"` line; `createContainer` drops `const useCases = ...` and `container.registerInstance(CmsReviewUseCases, useCases);` (and the two imports). Assertions: line 150 `expect(route.getAttribute("data-usecases")).toBe("cms");` becomes `expect(route.getAttribute("data-app")).toBe("cms");`; line 168 `expect(widgets.getAttribute("data-usecases")).toBe("cms");` is deleted: line 167 already asserts `expect(widgets.getAttribute("data-prefix")).toBe("cms");`, and the widgets take their app from the prefix (R353). The case title "mounts the shared route, menu and widgets with the CMS use cases and the model list, ready once the models are known" becomes "mounts the shared route, menu and widgets for the cms app with the model list, ready once the models are known".

`WbContentReviews.test.tsx`: the same changes with `"wb"` (line 116 becomes `expect(route.getAttribute("data-app")).toBe("wb");`; line 129 is deleted, line 128 already asserts `data-prefix` `"wb"`; drop `const useCases = ...` at 102 and the `WbReviewUseCases` registration at 104 with their two imports; the case title "mounts the shared route, menu and widgets with the WB use cases and no content type" becomes "mounts the shared route, menu and widgets for the wb app and no content type"). `WbContentReviews.smoke.test.tsx`: delete `container.registerInstance(WbReviewUseCases, { name: "wb" } as unknown as IReviewUseCases);` and its two imports.

**1e. Review features resolve no use case (R354).** `packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts`, before:

```ts
    it("registers the gateway, the use cases and the adapter under the CMS tokens", () => {
        const { useCases, contentAdapter } = CmsReviewFeature.resolve(container);

        expect(useCases).toBeDefined();
        expect(contentAdapter).toBeDefined();
        const gateway = container.resolve(CmsReviewGateway);

        expect(gateway).toBeDefined();
    });
```

After:

```ts
    it("resolves the content adapter and the row provider, and no use case (R349, R354)", () => {
        const resolved = CmsReviewFeature.resolve(container);

        expect(Object.keys(resolved)).toEqual(["contentAdapter", "rowProvider"]);
        expect(resolved.contentAdapter).toBe(container.resolve(CmsReviewContentAdapter));
        expect(container.resolve(CmsReviewGateway)).toBeDefined();
    });
```

`packages/app-website-builder-workflows/src/features/gateway/feature.test.ts`, before:

```ts
    it("registers the gateway, the use cases and the adapter under the WB tokens", () => {
        const { useCases, contentAdapter } = WbReviewFeature.resolve(container);

        expect(useCases).toBeDefined();
        expect(contentAdapter).toBeDefined();
        expect(container.resolve(WbReviewGateway)).toBeDefined();
    });
```

After:

```ts
    it("resolves the content adapter and the row provider, and no use case (R349, R354)", () => {
        const resolved = WbReviewFeature.resolve(container);

        expect(Object.keys(resolved)).toEqual(["contentAdapter", "rowProvider"]);
        expect(resolved.contentAdapter).toBe(container.resolve(WbReviewContentAdapter));
        expect(container.resolve(WbReviewGateway)).toBeDefined();
    });
```

(The old bundle's singleton, cache and `invalidateWorkflows` cases of both files stay until Task 14.)

- [ ] **Step 2: Run the tests to see them fail**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/mounting/components/ReviewMountingComponents.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviews.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -30
```

Expected: the presenter, view and widget tests fail because the presenters still call `params.useCases.listReviews` (`Cannot read properties of undefined (reading 'listReviews')`) and never call the injected fake; the mounting and Content Reviews tests fail on `data-app` (`null`); the feature tests fail on `Object.keys(resolved)` (`useCases` is still resolved). Record the RED output.

- [ ] **Step 3: Implement**

**3a. `ReviewListPresenter`.** `packages/app-workflows/src/review/presentation/reviewList/abstractions.ts`, before:

```ts
import type { TargetReviewTagVariant } from "~/review/presentation/targetReview/abstractions.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
```

After:

```ts
import type { TargetReviewTagVariant } from "~/review/presentation/targetReview/abstractions.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
```

Before:

```ts
export interface ReviewListInitParams {
    useCases: IReviewListUseCases;
    namespaces: string[];
```

After:

```ts
export interface ReviewListInitParams {
    // The app whose reviews the list shows; the list use case routes by it (R348).
    app: WorkflowAppKind;
    namespaces: string[];
```

`packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.ts`. First the twelve load sites, mechanically:

```bash
F=packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.ts
sed -i '' -E \
  -e 's/const useCases = this\.useCases;/const app = this.app;/' \
  -e 's/if \(!useCases/if (!app/' \
  -e 's/this\.createParams\(/this.createParams(app, /g' \
  -e 's/params\.useCases\.listReviews\(/this.listReviewsUseCase.execute(/' \
  -e 's/useCases\.listReviews\(/this.listReviewsUseCase.execute(/g' \
  "$F"
grep -n "useCases\|createParams(app" "$F"
```

(`sed` without `g` on the first two expressions still replaces every line, one match per line.) Then by hand:

Imports, before:

```ts
import { toReviewListRow } from "~/review/domain/toReviewListRow.js";
import type { ListReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ReviewListWhere } from "~/review/appGateway/IReviewAppGateway.js";
import { getRowStateTag } from "~/review/presentation/targetReview/getRowStateTag.js";
import type { TargetReviewActionVm } from "~/review/presentation/targetReview/abstractions.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
```

After:

```ts
import { toReviewListRow } from "~/review/domain/toReviewListRow.js";
import { getRowStateTag } from "~/review/presentation/targetReview/getRowStateTag.js";
import type { TargetReviewActionVm } from "~/review/presentation/targetReview/abstractions.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
```

Before:

```ts
    private useCases: IReviewListUseCases | null = null;
    private rowProvider: IReviewRowProvider | null = null;
```

After:

```ts
    // The app the list was opened for; the list use case routes by it (R348).
    private app: WorkflowAppKind | null = null;
    private rowProvider: IReviewRowProvider | null = null;
```

Before:

```ts
    constructor(
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            ReviewListPresenterImpl,
            | "activity"
            | "identityContext"
            | "useCases"
            | "rowProvider"
```

After:

```ts
    constructor(
        private listReviewsUseCase: ListReviewsUseCase.Interface,
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            ReviewListPresenterImpl,
            | "listReviewsUseCase"
            | "activity"
            | "identityContext"
            | "app"
            | "rowProvider"
```

Before:

```ts
        >(this, {
            activity: false,
            identityContext: false,
            useCases: false,
            rowProvider: false,
```

After:

```ts
        >(this, {
            listReviewsUseCase: false,
            activity: false,
            identityContext: false,
            app: false,
            rowProvider: false,
```

`init`, before (after the `sed`):

```ts
        this.dispose();
        this.useCases = params.useCases;
        this.rowProvider = params.rowProvider;
```

After:

```ts
        this.dispose();
        this.app = params.app;
        this.rowProvider = params.rowProvider;
```

and in `init`, before (after the `sed`):

```ts
        const token = this.beginLoad(false);
        const request = this.createParams(app, REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await this.listReviewsUseCase.execute(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async setTab(tab: ReviewListTab): Promise<void> {
```

After:

```ts
        const token = this.beginLoad(false);
        const request = this.createParams(params.app, REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await this.listReviewsUseCase.execute(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async setTab(tab: ReviewListTab): Promise<void> {
```

`dispose`, before:

```ts
        this.signalDuringLoad = false;
        this.useCases = null;
        this.rowProvider = null;
```

After:

```ts
        this.signalDuringLoad = false;
        this.app = null;
        this.rowProvider = null;
```

`createParams` (the `sed` did not touch its declaration), before:

```ts
    private createParams(limit: number, after: string | null): ListReviewsParams {
        const where: ReviewListWhere = {};
```

After:

```ts
    private createParams(
        app: WorkflowAppKind,
        limit: number,
        after: string | null
    ): ListReviewsUseCase.Params {
        const where: ListReviewsUseCase.Params["where"] = {};
```

and its return, before:

```ts
        return { list: this._tab, where, sort: this._sort, limit, after };
```

After:

```ts
        return { app, list: this._tab, where, sort: this._sort, limit, after };
```

Dependencies, before:

```ts
export const ReviewListPresenter = Abstraction.createImplementation({
    implementation: ReviewListPresenterImpl,
    dependencies: [ReviewActivity, IdentityContext]
});
```

After:

```ts
export const ReviewListPresenter = Abstraction.createImplementation({
    implementation: ReviewListPresenterImpl,
    dependencies: [ListReviewsUseCase, ReviewActivity, IdentityContext]
});
```

Check:

```bash
grep -n "useCases" packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.ts
```

Expected: no hit. The twelve sites now read `const app = this.app; if (!app ...) { return; }` and `this.listReviewsUseCase.execute(request)` with `this.createParams(app, ...)` (the `refresh` "Try again" path: `this.createParams(app, REVIEW_LIST_PAGE_SIZE, null)` assigned to `reloadRequest`).

**3b. `ReviewWidgetPresenter`.** `packages/app-workflows/src/review/presentation/reviewWidget/abstractions.ts`, before:

```ts
import type { TargetReviewTagVariant } from "~/review/presentation/targetReview/abstractions.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
```

After:

```ts
import type { TargetReviewTagVariant } from "~/review/presentation/targetReview/abstractions.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
```

Before:

```ts
export interface ReviewWidgetInitParams {
    useCases: IReviewListUseCases;
    namespaces: string[];
```

After:

```ts
export interface ReviewWidgetInitParams {
    // The app whose reviews the widget shows; the list use case routes by it (R348).
    app: WorkflowAppKind;
    namespaces: string[];
```

`packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.ts`:

```bash
F=packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.ts
sed -i '' -E \
  -e 's/const useCases = this\.useCases;/const app = this.app;/' \
  -e 's/if \(!useCases/if (!app/' \
  -e 's/params\.useCases\.listReviews\(\{/this.listReviewsUseCase.execute({ app: params.app,/' \
  -e 's/useCases\.listReviews\(\{/this.listReviewsUseCase.execute({ app,/' \
  "$F"
grep -n "useCases" "$F"
```

Then by hand. Imports, before:

```ts
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
```

After:

```ts
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
```

Before:

```ts
    private useCases: IReviewListUseCases | null = null;
```

After:

```ts
    // The app the widget was opened for; the list use case routes by it (R348).
    private app: WorkflowAppKind | null = null;
```

Before:

```ts
    constructor(
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            ReviewWidgetPresenterImpl,
            | "activity"
            | "identityContext"
            | "useCases"
```

After:

```ts
    constructor(
        private listReviewsUseCase: ListReviewsUseCase.Interface,
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            ReviewWidgetPresenterImpl,
            | "listReviewsUseCase"
            | "activity"
            | "identityContext"
            | "app"
```

Before:

```ts
        >(this, {
            activity: false,
            identityContext: false,
            useCases: false,
```

After:

```ts
        >(this, {
            listReviewsUseCase: false,
            activity: false,
            identityContext: false,
            app: false,
```

Before:

```ts
        this.dispose();
        this.useCases = params.useCases;
```

After:

```ts
        this.dispose();
        this.app = params.app;
```

Before (in `dispose`):

```ts
        this.useCases = null;
        this.rowProvider = null;
```

After:

```ts
        this.app = null;
        this.rowProvider = null;
```

Before:

```ts
    dependencies: [ReviewActivity, IdentityContext]
});
```

After:

```ts
    dependencies: [ListReviewsUseCase, ReviewActivity, IdentityContext]
});
```

`format:fix` lays the `execute({ app, list: ..., ... })` objects out on separate lines; the four requests now read, for example:

```ts
            const listed = await this.listReviewsUseCase.execute({
                app,
                list: this.getList(),
                where: {},
                sort: this.getSort(),
                limit: REVIEW_WIDGET_PAGE_SIZE,
                after: null
            });
```

**3c. Components.** `packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.tsx`, before:

```tsx
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewContentTypeFilter } from "../IReviewContentTypeFilter.js";
```

After:

```tsx
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { IReviewContentTypeFilter } from "../IReviewContentTypeFilter.js";
```

Before:

```tsx
export interface ReviewListViewProps {
    useCases: IReviewListUseCases;
    rowProvider: IReviewRowProvider;
```

After:

```tsx
export interface ReviewListViewProps {
    app: WorkflowAppKind;
    rowProvider: IReviewRowProvider;
```

Before:

```tsx
    const { useCases, rowProvider, namespaces, showContentType, contentTypeFilter } = props;
    const initialTab = props.initialTab ?? "assignedToMe";
    const { presenter } = useFeature(ReviewListPresenterFeature);
    const namespacesKey = namespaces.join("|");

    useEffect(() => {
        void presenter.init({ useCases, namespaces, rowProvider, initialTab });
        return () => {
            presenter.dispose();
        };
    }, [presenter, useCases, rowProvider, namespacesKey, initialTab]);
```

After:

```tsx
    const { app, rowProvider, namespaces, showContentType, contentTypeFilter } = props;
    const initialTab = props.initialTab ?? "assignedToMe";
    const { presenter } = useFeature(ReviewListPresenterFeature);
    const namespacesKey = namespaces.join("|");

    useEffect(() => {
        void presenter.init({ app, namespaces, rowProvider, initialTab });
        return () => {
            presenter.dispose();
        };
    }, [presenter, app, rowProvider, namespacesKey, initialTab]);
```

`packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgetCard.tsx`, before:

```tsx
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
```

After:

```tsx
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
```

Before:

```tsx
    title: string;
    useCases: IReviewListUseCases;
    namespaces: string[];
```

After:

```tsx
    title: string;
    app: WorkflowAppKind;
    namespaces: string[];
```

Before:

```tsx
    const { kind, title, useCases, namespaces, rowProvider, viewAllUrl } = props;
    const { presenter } = useFeature(ReviewWidgetPresenterFeature);
    const namespacesKey = namespaces.join("|");

    useEffect(() => {
        void presenter.init({ useCases, namespaces, kind, rowProvider });
        return () => {
            presenter.dispose();
        };
    }, [presenter, useCases, rowProvider, namespacesKey, kind]);
```

After:

```tsx
    const { kind, title, app, namespaces, rowProvider, viewAllUrl } = props;
    const { presenter } = useFeature(ReviewWidgetPresenterFeature);
    const namespacesKey = namespaces.join("|");

    useEffect(() => {
        void presenter.init({ app, namespaces, kind, rowProvider });
        return () => {
            presenter.dispose();
        };
    }, [presenter, app, rowProvider, namespacesKey, kind]);
```

`packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewForMeWidget.tsx` (whole file after):

```tsx
import React from "react";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewWidgetCard } from "./ReviewWidgetCard.js";

export interface ReviewForMeWidgetProps {
    app: WorkflowAppKind;
    namespaces: string[];
    rowProvider: IReviewRowProvider;
    viewAllUrl: (tab: ReviewListTab) => string;
}

export const ReviewForMeWidget = (props: ReviewForMeWidgetProps) => {
    return <ReviewWidgetCard {...props} kind="forMe" title="For me to review" />;
};
```

`ReviewMyRequestsWidget.tsx`: the same two changes (the `IReviewListUseCases` import becomes the `WorkflowAppKind` import, `useCases: IReviewListUseCases;` becomes `app: WorkflowAppKind;`); its body is unchanged.

`packages/app-workflows/src/review/mounting/components/ReviewContentReviewsRoute.tsx`, before:

```tsx
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewContentTypeFilter } from "~/review/presentation/reviewList/IReviewContentTypeFilter.js";
```

After:

```tsx
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { IReviewContentTypeFilter } from "~/review/presentation/reviewList/IReviewContentTypeFilter.js";
```

Before:

```tsx
    route: Route<any>;
    useCases: IReviewListUseCases;
    rowProvider: IReviewRowProvider;
```

After:

```tsx
    route: Route<any>;
    // The app whose reviews the page lists (R353).
    app: WorkflowAppKind;
    rowProvider: IReviewRowProvider;
```

Before:

```tsx
    const { route, useCases, rowProvider, namespaces, showContentType, contentTypeFilter } = props;
```

After:

```tsx
    const { route, app, rowProvider, namespaces, showContentType, contentTypeFilter } = props;
```

Before:

```tsx
            <ReviewListView
                useCases={useCases}
                rowProvider={rowProvider}
```

After:

```tsx
            <ReviewListView
                app={app}
                rowProvider={rowProvider}
```

`packages/app-workflows/src/review/mounting/components/ReviewDashboardWidgets.tsx`, before:

```tsx
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
```

After:

```tsx
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
```

Before:

```tsx
export interface ReviewDashboardWidgetsProps {
    prefix: "cms" | "wb";
    useCases: IReviewListUseCases;
    namespaces: string[];
```

After:

```tsx
export interface ReviewDashboardWidgetsProps {
    // The app of the widgets: their names, their group and the app their lists route by (R353).
    prefix: "cms" | "wb";
    namespaces: string[];
```

Before:

```tsx
    const { prefix, useCases, namespaces, rowProvider, viewAllRoute } = props;
```

After:

```tsx
    const { prefix, namespaces, rowProvider, viewAllRoute } = props;
```

Before:

```tsx
                    <ReviewForMeWidget
                        useCases={useCases}
                        namespaces={namespaces}
```

After:

```tsx
                    <ReviewForMeWidget
                        app={prefix}
                        namespaces={namespaces}
```

Before:

```tsx
                    <ReviewMyRequestsWidget
                        useCases={useCases}
                        namespaces={namespaces}
```

After:

```tsx
                    <ReviewMyRequestsWidget
                        app={prefix}
                        namespaces={namespaces}
```

(`"cms" | "wb"` is assignable to `WorkflowAppKind`.)

**3d. App mounts and features.** `packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviews.tsx`, before:

```tsx
/*
 * Mounts the shared Content Reviews route, menu item and dashboard widgets with the CMS use cases.
 * Only the content type list is CMS knowledge (D113, A80); the page and the widgets wait for it
 * (`ready`), so the list starts once with the real namespaces.
 */
export const CmsContentReviews = createReactiveComponent(() => {
    const { presenter } = useFeature(CmsContentReviewsPresenterFeature);
    const { useCases, rowProvider } = useFeature(CmsReviewFeature);
```

After:

```tsx
/*
 * Mounts the shared Content Reviews route, menu item and dashboard widgets for the `cms` app.
 * Only the content type list is CMS knowledge (D113, A80); the page and the widgets wait for it
 * (`ready`), so the list starts once with the real namespaces.
 */
export const CmsContentReviews = createReactiveComponent(() => {
    const { presenter } = useFeature(CmsContentReviewsPresenterFeature);
    const { rowProvider } = useFeature(CmsReviewFeature);
```

Before:

```tsx
                route={Routes.ContentEntries.ContentReviews}
                useCases={useCases}
                rowProvider={rowProvider}
```

After:

```tsx
                route={Routes.ContentEntries.ContentReviews}
                app="cms"
                rowProvider={rowProvider}
```

Before:

```tsx
                prefix="cms"
                useCases={useCases}
                namespaces={vm.namespaces}
```

After:

```tsx
                prefix="cms"
                namespaces={vm.namespaces}
```

`packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.tsx`, before:

```tsx
/*
 * Mounts the shared Content Reviews route, menu item and dashboard widgets with the Website
 * Builder use cases. Pages have no content type: no Content type column and no filter (D113).
 */
export const WbContentReviews = () => {
    const { useCases, rowProvider } = useFeature(WbReviewFeature);
```

After:

```tsx
/*
 * Mounts the shared Content Reviews route, menu item and dashboard widgets for the `wb` app.
 * Pages have no content type: no Content type column and no filter (D113).
 */
export const WbContentReviews = () => {
    const { rowProvider } = useFeature(WbReviewFeature);
```

Before:

```tsx
                route={Routes.Pages.WorkflowStateList}
                useCases={useCases}
                rowProvider={rowProvider}
```

After:

```tsx
                route={Routes.Pages.WorkflowStateList}
                app="wb"
                rowProvider={rowProvider}
```

Before:

```tsx
                prefix="wb"
                useCases={useCases}
                namespaces={NAMESPACES}
```

After:

```tsx
                prefix="wb"
                namespaces={NAMESPACES}
```

`packages/app-headless-cms-workflows/src/features/gateway/feature.ts` (as Task 7 left it), before:

```ts
import { CmsReviewContentAdapter as AdapterAbstraction } from "./CmsReviewContentAdapter/abstractions.js";
import { CmsReviewUseCases as UseCasesAbstraction } from "./CmsReviewUseCases/abstractions.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter/CmsReviewContentAdapter.js";
```

After:

```ts
import { CmsReviewContentAdapter as AdapterAbstraction } from "./CmsReviewContentAdapter/abstractions.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter/CmsReviewContentAdapter.js";
```

Before:

```ts
    resolve(container) {
        return {
            useCases: container.resolve(UseCasesAbstraction),
            contentAdapter: container.resolve(AdapterAbstraction),
            rowProvider: container.resolve(RowProviderAbstraction)
        };
    }
```

After:

```ts
    // Resolved in the plugin pass, so it resolves no use case (R349, R354).
    resolve(container) {
        return {
            contentAdapter: container.resolve(AdapterAbstraction),
            rowProvider: container.resolve(RowProviderAbstraction)
        };
    }
```

`packages/app-website-builder-workflows/src/features/gateway/feature.ts`: the same two hunks (delete `import { WbReviewUseCases as UseCasesAbstraction } from "./WbReviewUseCases/abstractions.js";` and the `useCases:` line of `resolve`, add the same comment).

- [ ] **Step 4: Run the tests to see them pass**

Run the nine commands of Step 2 again, one at a time, then:

```bash
yarn test packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviews.smoke.test.tsx 2>&1 | tail -30
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListToolbar.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.lists.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/Components/ContentReviews/CmsContentReviewsSidebarItem.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Components/ContentReviews/WbContentReviewsSidebarItem.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors.

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
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "refactor(app-workflows): route the Content Reviews list and widgets by app through ListReviewsUseCase" -m "The list and widget presenters inject ListReviewsUseCase and take the app instead of a use-case bundle; the Content Reviews route, the list view, the dashboard widgets and the CMS and Website Builder mounts pass the app, and the CMS and Website Builder review features stop resolving use cases (app-headless-cms-workflows, app-website-builder-workflows)." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Widget app source.** R353 says `ReviewDashboardWidgets` "drops `useCases` and passes `app={prefix}`"; it therefore gets no `app` prop of its own, and the CMS and WB mounts pass only `prefix` to it. The Content Reviews tests assert the widgets' `data-prefix` for that reason.
- **Two-widget independence (Review Focus 4).** The old test gave each widget its own bundle; with one injected `ListReviewsUseCase` the test answers by `params.list` and counts the calls per widget, keeping the old assertions (a signal of `cms.article` refetches only the "For me" widget; a tab switch adds one "For me" call; "My requests" stays at one).
- **Presenter field.** Both presenters keep `app` where they kept the bundle (set by `init`, cleared by `dispose`, excluded from the observable map as the bundle was), so every guard (`if (!app)`) keeps the old "nothing before `init`, nothing after `dispose`" behaviour.

## Review fixes (sub-phase review)

1. `CmsContentReviews.test.tsx` line 168 and `WbContentReviews.test.tsx` line 129: the `data-usecases` assertion is deleted instead of becoming a second copy of the `data-prefix` assertion on the line above.
2. `WbContentReviews.test.tsx`: spelled out the line 116 replacement, the `const useCases` deletion and the case-title rewording (the old text said only "the same changes").
