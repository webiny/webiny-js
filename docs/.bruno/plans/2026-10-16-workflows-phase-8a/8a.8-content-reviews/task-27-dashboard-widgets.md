### Task 27: Dashboard widgets

Spec 13.5; R206, R210, R212, R231, R234; Decisions D71, D133; design README 8 (home widgets), QBZ-72, QBZ-73, QBZ-79, design frames 09-12 (empty, loading, error). Two widgets per app, "For me to review" (segment "Assigned to me" / "Team pool", 5 rows) and "My requests" (5 rows). Each widget instance owns its own transient `ReviewWidgetPresenter` (R212), so the two widgets, and the widgets of two apps, never share state (Review Focus 5). Like the list, the widget knows no app: use cases, namespaces and the row provider arrive as props.

- **Data:** `useCases.listReviews({ list, where: {}, sort, limit: REVIEW_WIDGET_PAGE_SIZE, after: null })` with `list` = the segment (`assignedToMe` or `pool`) for "forMe" and `myRequests` for "myRequests"; sort oldest first for the two work queues and newest first for My requests (QBZ-69). One page, no paging.
- **Live (R210, QBZ-71):** the widget refreshes on every `ReviewActivity` signal of its namespaces ("The home widgets simply refresh"). Refresh keeps the rows on screen (no skeleton) and coalesces signals that arrive during a request into one follow-up; a failed first load shows the error state and "Try again" reloads with the skeleton. The in-flight flag is a generation token (as in Task 25), so a tab switch or dispose supersedes a refresh cleanly.
- **Rows (render-ready, QBZ-79):** title (a link to the content when the row has a binding), `stepLine` "{step} · {content type}" (the content type only when the binding gives a label), a state tag from Task 13's `getStepStateTag`, last change. An unbound namespace shows the row with no link. The binding is resolved with Task 25's pure `resolveRowBinding`.
- **Copy:** titles "For me to review" and "My requests"; "View all →" opens the matching tab (the segment's tab, or My requests); empty titles per QBZ-72 and QBZ-73 (the list's copy, including "You’re not in a reviewing team" on the Team pool segment for a viewer with no teams, read through `IdentityContext`); error "Could not load reviews." with "Try again" (design frame 12).
- **No wrapper around the use case:** `useCases.listReviews` is called inline, with its own `try`/`catch`, in each method that needs it (`init`, `setTab`, `refresh` twice); only state helpers are shared (user rule: never wrap a use case call in a helper or private method).

**Files:**
- Create: `packages/app-workflows/src/review/presentation/reviewWidget/{abstractions,ReviewWidgetPresenter,feature}.ts` (class `ReviewWidgetPresenterImpl`)
- Create: `packages/app-workflows/src/review/presentation/reviewWidget/components/{ReviewWidgetCard,ReviewForMeWidget,ReviewMyRequestsWidget}.tsx`
- Create tests: `packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.test.ts`, `packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx` (Task 10's composition test, extended by Task 13's "WorkflowsAdminApp review view" `describe`; one expectation per test added)
- Modify: `packages/app-workflows/src/app.tsx` (register `ReviewWidgetPresenterFeature` inside the gate). The barrel `src/index.tsx` is not touched (R-k).

**Interfaces:**
- Consumes: Task 25 (`IReviewRowProvider`, `ReviewListTab` from `~/review/presentation/reviewList/abstractions.js`, `getReviewListEmpty`, `resolveRowBinding`, `formatLastChange`, `getListReviewStateLabel`, the builder `createReviewListItem` from `~/review/testing/createReviewListItem.js`); Task 13 (`getStepStateTag` `~/review/presentation/targetReview/getStepStateTag.js`, `TargetReviewTagVariant` `.../abstractions.js`, the fixture `createActor` `~/review/testing/createActor.js`); Task 14 (`renderWithAdminUi` `~/review/testing/renderWithAdminUi.js`, the vitest config with the DOM setup and svg alias); Task 15 (`renderWithContainer` `~/review/testing/renderWithContainer.js`); Task 10 (`ReviewActivity` token `~/review/activity/abstractions.js`, the implementation `~/review/activity/ReviewActivity.js`); Task 8 (`IReviewListUseCases`, `ReviewListPage`, `REVIEW_WIDGET_PAGE_SIZE`, `toReviewListRow`, `ReviewListRow`, `ReviewListSort`). Existing: `IdentityContext` (`@webiny/app-admin/features/security/IdentityContext/abstractions.js`), `createReactiveComponent` (`@webiny/app-admin`), `useFeature` (`@webiny/app`), admin-ui `Button`, `Link`, `SegmentedControl`, `Skeleton`, `Tag`, `Text`.
- Produces (consumed by Task 28): `ReviewWidgetKind = "forMe" | "myRequests"`; `ReviewWidgetInitParams { useCases: IReviewListUseCases; namespaces: string[]; kind: ReviewWidgetKind; rowProvider: IReviewRowProvider }`; `ReviewWidgetRowVm { reviewId; title; stepLine; stateLabel; stateVariant: TargetReviewTagVariant; lastChange; contentUrl: string | null }` (`stateVariant` is additive); `IReviewWidgetViewModel { tab: "assignedToMe" | "pool" | null; rows; status: "loading" | "ready" | "failed"; empty: boolean; hasTeams: boolean }` (`hasTeams` is additive, QBZ-73); `IReviewWidgetPresenter { vm; init; setTab; refresh; dispose }`; token `ReviewWidgetPresenter` (`"Workflows/ReviewWidgetPresenter"`, transient); `ReviewWidgetPresenterFeature` (`resolve` -> `{ presenter }`); `ReviewForMeWidget`, `ReviewMyRequestsWidget` with props `{ useCases: IReviewListUseCases; namespaces: string[]; rowProvider: IReviewRowProvider; viewAllUrl: (tab: ReviewListTab) => string }`.

verify before writing code (record each result in the commit body):
- The Task 25 verifications (`toReviewListRow` shape, `ReviewActivity` token and implementation) still hold, and Task 13 `getStepStateTag(state: StepStateValue)` returns `{ label, variant }`.
- admin-ui `SegmentedControl` props (`items: { label; value }[]`, `value`, `onChange(value: string)`), as used in `packages/app-workflows/src/presentation/workflowStateList/components/List/WorkflowStateListFilters.tsx`.
- `SegmentedControl` renders buttons or radios the test can click by name; adapt the three `getByRole("radio", ...)` queries if it renders `button`.

- [ ] **Step 1: Write the failing tests**

`packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewActivity as ReviewActivityImplementation } from "~/review/activity/ReviewActivity.js";
import { StepState } from "~/review/domain/StepState.js";
import { REVIEW_WIDGET_PAGE_SIZE } from "~/review/domain/constants.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { ReviewListPage } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { ReviewWidgetPresenter } from "./abstractions.js";
import type { ReviewWidgetKind } from "./abstractions.js";
import { ReviewWidgetPresenterFeature } from "./feature.js";

interface Deferred<T> {
    promise: Promise<T>;
    resolve(value: T): void;
}

const createDeferred = <T>(): Deferred<T> => {
    let resolve: (value: T) => void = () => undefined;
    const promise = new Promise<T>(res => {
        resolve = res;
    });
    return { promise, resolve };
};

const page = (items: ReviewWithFlags[]): ReviewListPage => {
    return { items, meta: { cursor: null, hasMoreItems: false } };
};

const rowProvider: IReviewRowProvider = {
    getBinding: namespace => {
        if (!namespace.startsWith("cms.")) {
            return null;
        }
        return {
            useCases: {} as unknown as IReviewUseCases,
            getContentUrl: ref => `/cms/content-entries/${ref.contentTypeId}?id=${ref.targetRevisionId}`,
            getContentTypeLabel: contentTypeId => `Type ${contentTypeId}`
        };
    }
};

const createIdentityContext = (teamCount: number): IdentityContext.Interface => {
    const teams = Array.from({ length: teamCount }, (_, index) => {
        return { id: `team-${index}`, slug: `team-${index}`, name: `Team ${index}` };
    });
    const identity = { teams } as unknown as Identity;
    return { getIdentity: () => identity, setIdentity: vi.fn(), clear: vi.fn() };
};

const setup = (kind: ReviewWidgetKind, teamCount = 1) => {
    const container = new Container();
    container.register(ReviewActivityImplementation).inSingletonScope();
    container.registerInstance(IdentityContext, createIdentityContext(teamCount));
    ReviewWidgetPresenterFeature.register(container);
    const activity = container.resolve(ReviewActivity);
    const presenter = container.resolve(ReviewWidgetPresenter);
    const listReviews = vi.fn<IReviewListUseCases["listReviews"]>();
    const useCases: IReviewListUseCases = { listReviews };
    const params = { useCases, namespaces: ["cms.article"], kind, rowProvider };
    return { container, presenter, activity, listReviews, params };
};

describe("ReviewWidgetPresenter", () => {
    it("loads the assigned-to-me segment of 'For me to review', oldest first, five rows", async () => {
        const { presenter, listReviews, params } = setup("forMe");
        listReviews.mockResolvedValue(page([createReviewListItem({ id: "r1", title: "Mine" })]));

        await presenter.init(params);

        expect(listReviews).toHaveBeenCalledWith({
            list: "assignedToMe",
            where: {},
            sort: "lastChangedOn_ASC",
            limit: REVIEW_WIDGET_PAGE_SIZE,
            after: null
        });
        expect(presenter.vm.tab).toBe("assignedToMe");
        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.empty).toBe(false);
        expect(presenter.vm.rows.map(row => row.title)).toEqual(["Mine"]);
    });

    it("switches to the team pool segment", async () => {
        const { presenter, listReviews, params } = setup("forMe");
        listReviews.mockResolvedValue(page([]));
        await presenter.init(params);

        await presenter.setTab("pool");

        expect(presenter.vm.tab).toBe("pool");
        expect(listReviews).toHaveBeenLastCalledWith(
            expect.objectContaining({ list: "pool", sort: "lastChangedOn_ASC" })
        );
    });

    it("loads My requests newest first and has no segment", async () => {
        const { presenter, listReviews, params } = setup("myRequests");
        listReviews.mockResolvedValue(page([]));

        await presenter.init(params);

        expect(presenter.vm.tab).toBeNull();
        expect(listReviews).toHaveBeenCalledWith(
            expect.objectContaining({ list: "myRequests", sort: "lastChangedOn_DESC" })
        );

        await presenter.setTab("pool");
        expect(listReviews).toHaveBeenCalledTimes(1);
    });

    it("builds render-ready rows with a step line, link and state", async () => {
        const { presenter, listReviews, params } = setup("forMe");
        listReviews.mockResolvedValue(
            page([
                createReviewListItem({
                    id: "r1",
                    title: "Spring launch",
                    stepTitle: "Legal check",
                    stepState: StepState.InReview,
                    modelId: "article",
                    targetRevisionId: "e1#0001"
                }),
                createReviewListItem({
                    id: "r2",
                    title: "Unbound",
                    namespace: "other.app",
                    stepTitle: "Review"
                })
            ])
        );

        await presenter.init(params);

        const [bound, unbound] = presenter.vm.rows;
        expect(bound.stepLine).toBe("Legal check · Type article");
        expect(bound.stateLabel).toBe("In review");
        expect(bound.stateVariant).toBe("accent-light");
        expect(bound.contentUrl).toBe("/cms/content-entries/article?id=e1#0001");
        expect(unbound.stepLine).toBe("Review");
        expect(unbound.contentUrl).toBeNull();
    });

    it("marks an empty result as empty and reports whether the viewer is in a team", async () => {
        const inTeam = setup("myRequests", 1);
        inTeam.listReviews.mockResolvedValue(page([]));
        await inTeam.presenter.init(inTeam.params);

        expect(inTeam.presenter.vm.empty).toBe(true);
        expect(inTeam.presenter.vm.status).toBe("ready");
        expect(inTeam.presenter.vm.hasTeams).toBe(true);

        const noTeam = setup("forMe", 0);
        noTeam.listReviews.mockResolvedValue(page([]));
        await noTeam.presenter.init(noTeam.params);

        expect(noTeam.presenter.vm.hasTeams).toBe(false);
    });

    it("fails, then retries with a skeleton through refresh", async () => {
        const { presenter, listReviews, params } = setup("forMe");
        listReviews.mockRejectedValueOnce(new Error("network"));
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));

        await presenter.init(params);
        expect(presenter.vm.status).toBe("failed");
        expect(presenter.vm.empty).toBe(false);

        await presenter.refresh();
        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.rows).toHaveLength(1);
    });

    it("refreshes on own and remote signals of its namespaces and ignores others", async () => {
        const { presenter, activity, listReviews, params } = setup("forMe");
        listReviews.mockResolvedValue(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);

        activity.notify({ namespace: "wb.page", source: "remote" });
        await Promise.resolve();
        expect(listReviews).toHaveBeenCalledTimes(1);

        activity.notify({ namespace: "cms.article", source: "remote" });
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));

        activity.notify({ namespace: "cms.article", source: "own" });
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(3));
    });

    it("keeps the rows during a refresh and applies the result", async () => {
        const { presenter, activity, listReviews, params } = setup("forMe");
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1", title: "Old" })]));
        await presenter.init(params);

        const pending = createDeferred<ReviewListPage>();
        listReviews.mockReturnValueOnce(pending.promise);
        activity.notify({ namespace: "cms.article", source: "remote" });

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.rows.map(row => row.title)).toEqual(["Old"]);

        pending.resolve(page([createReviewListItem({ id: "r2", title: "New" })]));
        await vi.waitFor(() => expect(presenter.vm.rows.map(row => row.title)).toEqual(["New"]));
    });

    it("collapses signals during a refresh into one follow-up", async () => {
        const { presenter, activity, listReviews, params } = setup("forMe");
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);

        const pending = createDeferred<ReviewListPage>();
        listReviews.mockReturnValueOnce(pending.promise);
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));
        activity.notify({ namespace: "cms.article", source: "remote" });
        activity.notify({ namespace: "cms.article", source: "remote" });
        activity.notify({ namespace: "cms.article", source: "own" });
        expect(listReviews).toHaveBeenCalledTimes(2);

        pending.resolve(page([createReviewListItem({ id: "r1" })]));
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(3));
        await Promise.resolve();
        expect(listReviews).toHaveBeenCalledTimes(3);
    });

    it("keeps refreshing after a tab switch superseded an in-flight refresh", async () => {
        const { presenter, activity, listReviews, params } = setup("forMe");
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);

        const stale = createDeferred<ReviewListPage>();
        listReviews.mockReturnValueOnce(stale.promise);
        activity.notify({ namespace: "cms.article", source: "remote" });

        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r2" })]));
        await presenter.setTab("pool");
        stale.resolve(page([createReviewListItem({ id: "stale" })]));
        await Promise.resolve();

        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r3" })]));
        activity.notify({ namespace: "cms.article", source: "remote" });
        await vi.waitFor(() => expect(presenter.vm.rows.map(row => row.reviewId)).toEqual(["r3"]));
    });

    it("keeps two presenters of one container independent (transient)", async () => {
        const { container, listReviews, params } = setup("forMe");
        listReviews.mockResolvedValue(page([createReviewListItem({ id: "a" })]));
        const first = container.resolve(ReviewWidgetPresenter);
        const second = container.resolve(ReviewWidgetPresenter);
        expect(first).not.toBe(second);

        await first.init(params);
        await second.init(params);
        await second.setTab("pool");

        expect(first.vm.tab).toBe("assignedToMe");
        expect(second.vm.tab).toBe("pool");
    });

    it("unsubscribes on dispose and ignores a late response", async () => {
        const { presenter, activity, listReviews, params } = setup("forMe");
        const pending = createDeferred<ReviewListPage>();
        listReviews.mockReturnValueOnce(pending.promise);

        const initializing = presenter.init(params);
        presenter.dispose();
        pending.resolve(page([createReviewListItem({ id: "late" })]));
        await initializing;

        expect(presenter.vm.rows).toEqual([]);
        activity.notify({ namespace: "cms.article", source: "remote" });
        await Promise.resolve();
        expect(listReviews).toHaveBeenCalledTimes(1);
    });
});
```

`packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx`:

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
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewActivity as ReviewActivityImplementation } from "~/review/activity/ReviewActivity.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { ReviewListPage } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { ReviewWidgetPresenterFeature } from "../feature.js";
import { ReviewForMeWidget } from "./ReviewForMeWidget.js";
import { ReviewMyRequestsWidget } from "./ReviewMyRequestsWidget.js";

const page = (items: ReturnType<typeof createReviewListItem>[]): ReviewListPage => {
    return { items, meta: { cursor: null, hasMoreItems: false } };
};

const rowProvider: IReviewRowProvider = {
    getBinding: () => {
        return {
            useCases: {} as unknown as IReviewUseCases,
            getContentUrl: ref => `/content/${ref.targetId}`,
            getContentTypeLabel: contentTypeId => `Type ${contentTypeId}`
        };
    }
};

type ListResult = ReviewListPage | Error;

const createUseCases = (...results: ListResult[]) => {
    const listReviews = vi.fn<IReviewListUseCases["listReviews"]>();
    listReviews.mockResolvedValue(page([]));
    results.forEach(result => {
        if (result instanceof Error) {
            listReviews.mockRejectedValueOnce(result);
            return;
        }
        listReviews.mockResolvedValueOnce(result);
    });
    const useCases: IReviewListUseCases = { listReviews };
    return { useCases, listReviews };
};

const viewAllUrl = (tab: ReviewListTab): string => `/content-reviews?tab=${tab}`;

const mount = (ui: React.ReactElement, teamCount = 1) => {
    const container = new Container();
    container.register(ReviewActivityImplementation).inSingletonScope();
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
    return { activity: container.resolve(ReviewActivity) };
};

describe("review dashboard widgets", () => {
    it("renders For me to review with its rows, link, step line and View all", async () => {
        const { useCases } = createUseCases(
            page([
                createReviewListItem({
                    id: "r1",
                    targetId: "e1",
                    title: "Spring launch",
                    stepTitle: "Legal check",
                    modelId: "article"
                })
            ])
        );

        mount(
            <ReviewForMeWidget
                useCases={useCases}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />
        );

        expect(await screen.findByText("For me to review")).toBeTruthy();
        const link = await screen.findByRole("link", { name: "Spring launch" });
        expect(link.getAttribute("href")).toBe("/content/e1");
        expect(screen.getByText("Legal check · Type article")).toBeTruthy();
        expect(screen.getByRole("link", { name: "View all →" }).getAttribute("href")).toBe(
            "/content-reviews?tab=assignedToMe"
        );
    });

    it("switches the segment and points View all at the matching tab", async () => {
        const { useCases, listReviews } = createUseCases(page([]), page([]));
        mount(
            <ReviewForMeWidget
                useCases={useCases}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />
        );
        await screen.findByText("Nothing assigned to you");

        fireEvent.click(screen.getByRole("radio", { name: "Team pool" }));

        expect(await screen.findByText("Your team pools are empty")).toBeTruthy();
        expect(listReviews).toHaveBeenLastCalledWith(expect.objectContaining({ list: "pool" }));
        expect(screen.getByRole("link", { name: "View all →" }).getAttribute("href")).toBe(
            "/content-reviews?tab=pool"
        );
    });

    it("tells a viewer in no team so on the Team pool segment (QBZ-73)", async () => {
        const { useCases } = createUseCases(page([]), page([]));
        mount(
            <ReviewForMeWidget
                useCases={useCases}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />,
            0
        );
        await screen.findByText("Nothing assigned to you");

        fireEvent.click(screen.getByRole("radio", { name: "Team pool" }));

        expect(await screen.findByText("You’re not in a reviewing team")).toBeTruthy();
    });

    it("renders My requests with its empty state and View all to My requests", async () => {
        const { useCases } = createUseCases(page([]));
        mount(
            <ReviewMyRequestsWidget
                useCases={useCases}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />
        );

        expect(await screen.findByText("My requests")).toBeTruthy();
        expect(await screen.findByText("You haven’t requested any reviews")).toBeTruthy();
        expect(screen.queryByRole("radio")).toBeNull();
        expect(screen.getByRole("link", { name: "View all →" }).getAttribute("href")).toBe(
            "/content-reviews?tab=myRequests"
        );
    });

    it("shows the loading skeleton before the first response", async () => {
        const listReviews = vi.fn<IReviewListUseCases["listReviews"]>();
        listReviews.mockReturnValue(new Promise<ReviewListPage>(() => undefined));
        mount(
            <ReviewMyRequestsWidget
                useCases={{ listReviews }}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />
        );

        expect(await screen.findByTestId("review-widget-loading")).toBeTruthy();
        expect(screen.queryByText("You haven’t requested any reviews")).toBeNull();
    });

    it("shows the error state and retries", async () => {
        const { useCases, listReviews } = createUseCases(
            new Error("network"),
            page([createReviewListItem({ id: "r1", title: "Back again" })])
        );
        mount(
            <ReviewMyRequestsWidget
                useCases={useCases}
                namespaces={["cms.article"]}
                rowProvider={rowProvider}
                viewAllUrl={viewAllUrl}
            />
        );

        expect(await screen.findByText("Could not load reviews.")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(await screen.findByText("Back again")).toBeTruthy();
        expect(listReviews).toHaveBeenCalledTimes(2);
    });

    it("keeps two widgets independent and refreshes only the one whose namespace signals", async () => {
        const forMe = createUseCases(page([createReviewListItem({ id: "a", title: "Mine" })]));
        const requests = createUseCases(
            page([createReviewListItem({ id: "b", title: "Requested" })])
        );
        const { activity } = mount(
            <>
                <ReviewForMeWidget
                    useCases={forMe.useCases}
                    namespaces={["cms.article"]}
                    rowProvider={rowProvider}
                    viewAllUrl={viewAllUrl}
                />
                <ReviewMyRequestsWidget
                    useCases={requests.useCases}
                    namespaces={["wb.page"]}
                    rowProvider={rowProvider}
                    viewAllUrl={viewAllUrl}
                />
            </>
        );
        await screen.findByText("Mine");
        await screen.findByText("Requested");

        act(() => {
            activity.notify({ namespace: "cms.article", source: "remote" });
        });

        await vi.waitFor(() => expect(forMe.listReviews).toHaveBeenCalledTimes(2));
        expect(requests.listReviews).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("radio", { name: "Team pool" }));
        await vi.waitFor(() => expect(forMe.listReviews).toHaveBeenCalledTimes(3));
        const requested = within(screen.getByTestId("review-widget-myRequests"));
        expect(requested.getByText("Requested")).toBeTruthy();
        expect(requests.listReviews).toHaveBeenCalledTimes(1);
    });
});
```

Composition root (Review Focus 8): extend Task 10's `src/app.test.tsx` (Task 13's container-style `describe("WorkflowsAdminApp review view")`) with one line in each of its three tests:

```tsx
import { ReviewWidgetPresenter } from "~/review/presentation/reviewWidget/abstractions.js";

// in "registers the review view presenters when the flag is on":
expect(container.resolve(ReviewWidgetPresenter)).toBeDefined();

// in "registers the presenters transient: every resolve is a new instance (R212)":
expect(container.resolve(ReviewWidgetPresenter)).not.toBe(container.resolve(ReviewWidgetPresenter));

// in "registers no review view presenter when the flag is off (R211)":
expect(() => container.resolve(ReviewWidgetPresenter)).toThrow();
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -50
```

Expected: FAIL with `Failed to resolve import "./abstractions.js"` / `"./ReviewForMeWidget.js"` / `"~/review/presentation/reviewWidget/abstractions.js"` (not created yet).

- [ ] **Step 3: Implement**

`packages/app-workflows/src/review/presentation/reviewWidget/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { TargetReviewTagVariant } from "~/review/presentation/targetReview/abstractions.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";

export type ReviewWidgetKind = "forMe" | "myRequests";

export type ReviewWidgetTab = "assignedToMe" | "pool";

export type ReviewWidgetStatus = "loading" | "ready" | "failed";

export interface ReviewWidgetInitParams {
    useCases: IReviewListUseCases;
    namespaces: string[];
    kind: ReviewWidgetKind;
    rowProvider: IReviewRowProvider;
}

export interface ReviewWidgetRowVm {
    reviewId: string;
    title: string;
    stepLine: string;
    stateLabel: string;
    stateVariant: TargetReviewTagVariant;
    lastChange: string;
    contentUrl: string | null;
}

export interface IReviewWidgetViewModel {
    tab: ReviewWidgetTab | null;
    rows: ReviewWidgetRowVm[];
    status: ReviewWidgetStatus;
    empty: boolean;
    hasTeams: boolean;
}

export interface IReviewWidgetPresenter {
    readonly vm: IReviewWidgetViewModel;
    init(params: ReviewWidgetInitParams): Promise<void>;
    setTab(tab: ReviewWidgetTab): Promise<void>;
    refresh(): Promise<void>;
    dispose(): void;
}

export const ReviewWidgetPresenter = createAbstraction<IReviewWidgetPresenter>(
    "Workflows/ReviewWidgetPresenter"
);

export namespace ReviewWidgetPresenter {
    export type Interface = IReviewWidgetPresenter;
    export type ViewModel = IReviewWidgetViewModel;
}
```

`packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import { REVIEW_WIDGET_PAGE_SIZE } from "~/review/domain/constants.js";
import type { ReviewListRow } from "~/review/domain/types.js";
import { toReviewListRow } from "~/review/domain/toReviewListRow.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import { formatLastChange } from "~/review/presentation/reviewList/formatLastChange.js";
import { getListReviewStateLabel } from "~/review/presentation/reviewList/getListReviewStateLabel.js";
import { resolveRowBinding } from "~/review/presentation/reviewList/resolveRowBinding.js";
import type { TargetReviewTagVariant } from "~/review/presentation/targetReview/abstractions.js";
import { getStepStateTag } from "~/review/presentation/targetReview/getStepStateTag.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { ReviewListPage } from "~/review/useCases/IReviewListUseCases.js";
import { ReviewWidgetPresenter as Abstraction } from "./abstractions.js";
import type { ReviewWidgetInitParams } from "./abstractions.js";
import type { ReviewWidgetKind } from "./abstractions.js";
import type { ReviewWidgetRowVm } from "./abstractions.js";
import type { ReviewWidgetStatus } from "./abstractions.js";
import type { ReviewWidgetTab } from "./abstractions.js";

const NEUTRAL_VARIANT: TargetReviewTagVariant = "neutral-base-outline";

class ReviewWidgetPresenterImpl implements Abstraction.Interface {
    private _kind: ReviewWidgetKind = "forMe";
    private _tab: ReviewWidgetTab = "assignedToMe";
    private _status: ReviewWidgetStatus = "loading";
    private _rows: ReviewListRow[] = [];
    private useCases: IReviewListUseCases | null = null;
    private rowProvider: IReviewRowProvider | null = null;
    private unsubscribe: (() => void) | null = null;
    // A generation: every load, tab switch and dispose starts a new one, and a response of an
    // older generation is ignored. An in-flight refresh only counts for the generation it started in.
    private loadToken = 0;
    private refreshingToken: number | null = null;
    private refreshQueued = false;

    constructor(
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            ReviewWidgetPresenterImpl,
            | "activity"
            | "identityContext"
            | "useCases"
            | "rowProvider"
            | "unsubscribe"
            | "loadToken"
            | "refreshingToken"
            | "refreshQueued"
        >(this, {
            activity: false,
            identityContext: false,
            useCases: false,
            rowProvider: false,
            unsubscribe: false,
            loadToken: false,
            refreshingToken: false,
            refreshQueued: false
        });
    }

    get vm(): Abstraction.ViewModel {
        const now = new Date();
        const rows = this._rows.map(row => this.toRowVm(row, now));

        let tab: ReviewWidgetTab | null = null;
        if (this._kind === "forMe") {
            tab = this._tab;
        }

        return {
            tab,
            rows,
            status: this._status,
            empty: this._status === "ready" && rows.length === 0,
            hasTeams: this.identityContext.getIdentity().teams.length > 0
        };
    }

    async init(params: ReviewWidgetInitParams): Promise<void> {
        this.dispose();
        this.useCases = params.useCases;
        this.rowProvider = params.rowProvider;
        this._kind = params.kind;
        this._tab = "assignedToMe";
        this.unsubscribe = this.activity.subscribe(params.namespaces, () => {
            void this.refresh();
        });

        const token = this.beginLoad();
        try {
            const listed = await params.useCases.listReviews({
                list: this.getList(),
                where: {},
                sort: this.getSort(),
                limit: REVIEW_WIDGET_PAGE_SIZE,
                after: null
            });
            if (token === this.loadToken) {
                this.applyPage(listed);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyFailure();
            }
        }
    }

    async setTab(tab: ReviewWidgetTab): Promise<void> {
        const useCases = this.useCases;
        if (!useCases || this._kind !== "forMe" || tab === this._tab) {
            return;
        }

        this._tab = tab;

        const token = this.beginLoad();
        try {
            const listed = await useCases.listReviews({
                list: this.getList(),
                where: {},
                sort: this.getSort(),
                limit: REVIEW_WIDGET_PAGE_SIZE,
                after: null
            });
            if (token === this.loadToken) {
                this.applyPage(listed);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyFailure();
            }
        }
    }

    async refresh(): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        // "Try again" on a failed widget: a reload with the skeleton.
        if (this._status === "failed") {
            const reloadToken = this.beginLoad();
            try {
                const listed = await useCases.listReviews({
                    list: this.getList(),
                    where: {},
                    sort: this.getSort(),
                    limit: REVIEW_WIDGET_PAGE_SIZE,
                    after: null
                });
                if (reloadToken === this.loadToken) {
                    this.applyPage(listed);
                }
            } catch {
                if (reloadToken === this.loadToken) {
                    this.applyFailure();
                }
            }
            return;
        }

        if (this._status !== "ready") {
            return;
        }
        if (this.refreshingToken === this.loadToken) {
            this.refreshQueued = true;
            return;
        }

        const token = this.loadToken;
        this.refreshingToken = token;

        try {
            const listed = await useCases.listReviews({
                list: this.getList(),
                where: {},
                sort: this.getSort(),
                limit: REVIEW_WIDGET_PAGE_SIZE,
                after: null
            });
            if (token === this.loadToken) {
                this.applyPage(listed);
            }
        } catch {
            // A failed background refresh keeps the rows on screen; the next signal tries again.
        }

        // A newer generation (tab switch, reload, dispose) owns the flags now.
        if (token !== this.loadToken) {
            return;
        }
        this.refreshingToken = null;
        if (this.refreshQueued) {
            this.refreshQueued = false;
            await this.refresh();
        }
    }

    dispose(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.loadToken += 1;
        this.refreshingToken = null;
        this.refreshQueued = false;
        this.useCases = null;
        this.rowProvider = null;
        this._kind = "forMe";
        this._tab = "assignedToMe";
        this._status = "loading";
        this._rows = [];
    }

    // Starts a new generation and shows the skeleton.
    private beginLoad(): number {
        this.loadToken += 1;
        this.refreshQueued = false;
        this._status = "loading";
        this._rows = [];
        return this.loadToken;
    }

    private applyPage(listed: ReviewListPage): void {
        this._rows = listed.items.map(item => toReviewListRow(item));
        this._status = "ready";
    }

    private applyFailure(): void {
        this._rows = [];
        this._status = "failed";
    }

    private getList(): "assignedToMe" | "pool" | "myRequests" {
        if (this._kind === "myRequests") {
            return "myRequests";
        }
        return this._tab;
    }

    private getSort(): ReviewListSort {
        if (this._kind === "myRequests") {
            return "lastChangedOn_DESC";
        }
        return "lastChangedOn_ASC";
    }

    private toRowVm(row: ReviewListRow, now: Date): ReviewWidgetRowVm {
        const resolved = resolveRowBinding(this.rowProvider, row);

        const parts: string[] = [];
        if (row.stepTitle) {
            parts.push(row.stepTitle);
        }
        if (resolved.contentTypeLabel) {
            parts.push(resolved.contentTypeLabel);
        }

        let stateLabel = getListReviewStateLabel(row.reviewState);
        let stateVariant: TargetReviewTagVariant = NEUTRAL_VARIANT;
        if (row.stepState) {
            const tag = getStepStateTag(row.stepState);
            stateLabel = tag.label;
            stateVariant = tag.variant;
        }

        return {
            reviewId: row.reviewId,
            title: row.title,
            stepLine: parts.join(" · "),
            stateLabel,
            stateVariant,
            lastChange: formatLastChange(row.lastChangedOn, now),
            contentUrl: resolved.contentUrl
        };
    }
}

export const ReviewWidgetPresenter = Abstraction.createImplementation({
    implementation: ReviewWidgetPresenterImpl,
    dependencies: [ReviewActivity, IdentityContext]
});
```

The `listReviews` request is built as an object literal inline in every call (it is four fixed fields plus `list` and `sort`), so no private builder wraps the call. `getList` and `getSort` are state readers, not wrappers.

`packages/app-workflows/src/review/presentation/reviewWidget/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ReviewWidgetPresenter as Abstraction } from "./abstractions.js";
import { ReviewWidgetPresenter } from "./ReviewWidgetPresenter.js";

/** Transient (R212, D71): each widget instance resolves its own presenter. */
export const ReviewWidgetPresenterFeature = createFeature({
    name: "Workflows/ReviewWidgetPresenter",
    register(container) {
        container.register(ReviewWidgetPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
```

`packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgetCard.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { Button } from "@webiny/admin-ui";
import { Link } from "@webiny/admin-ui";
import { SegmentedControl } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { getReviewListEmpty } from "~/review/presentation/reviewList/getReviewListEmpty.js";
import type { ReviewWidgetKind } from "../abstractions.js";
import type { ReviewWidgetRowVm } from "../abstractions.js";
import type { ReviewWidgetTab } from "../abstractions.js";
import { ReviewWidgetPresenterFeature } from "../feature.js";

export interface ReviewWidgetCardProps {
    kind: ReviewWidgetKind;
    title: string;
    useCases: IReviewListUseCases;
    namespaces: string[];
    rowProvider: IReviewRowProvider;
    viewAllUrl: (tab: ReviewListTab) => string;
}

const SEGMENTS = [
    { label: "Assigned to me", value: "assignedToMe" },
    { label: "Team pool", value: "pool" }
];

const SKELETON_ROWS = [0, 1, 2];

interface ReviewWidgetRowProps {
    row: ReviewWidgetRowVm;
}

const ReviewWidgetRow = ({ row }: ReviewWidgetRowProps) => {
    let title: React.ReactNode = <Text className="font-medium">{row.title}</Text>;
    if (row.contentUrl) {
        title = (
            <Link to={row.contentUrl} variant="secondary">
                {row.title}
            </Link>
        );
    }

    return (
        <li className="flex items-center gap-md px-md py-sm border-b-sm border-solid border-neutral-dimmed">
            <div className="flex-1 min-w-0 flex flex-col gap-xxs">
                {title}
                <Text size="sm" className="text-neutral-strong">
                    {row.stepLine}
                </Text>
            </div>
            <Tag variant={row.stateVariant} content={row.stateLabel} />
            <Text size="sm" className="text-neutral-muted">
                {row.lastChange}
            </Text>
        </li>
    );
};

/** The shared card of both widgets: title, optional segment, rows or a state, "View all →". */
export const ReviewWidgetCard = createReactiveComponent((props: ReviewWidgetCardProps) => {
    const { kind, title, useCases, namespaces, rowProvider, viewAllUrl } = props;
    const { presenter } = useFeature(ReviewWidgetPresenterFeature);
    const namespacesKey = namespaces.join("|");

    useEffect(() => {
        void presenter.init({ useCases, namespaces, kind, rowProvider });
        return () => {
            presenter.dispose();
        };
    }, [presenter, useCases, rowProvider, namespacesKey, kind]);

    const vm = presenter.vm;

    let segment: React.ReactNode = null;
    if (vm.tab) {
        const onChange = (value: string) => {
            if (value === "assignedToMe" || value === "pool") {
                const tab: ReviewWidgetTab = value;
                void presenter.setTab(tab);
            }
        };
        segment = <SegmentedControl items={SEGMENTS} value={vm.tab} onChange={onChange} />;
    }

    let body: React.ReactNode = null;
    if (vm.status === "loading") {
        body = (
            <div data-testid="review-widget-loading" className="flex flex-col gap-md p-md">
                {SKELETON_ROWS.map(index => (
                    <Skeleton key={index} type="text" />
                ))}
            </div>
        );
    } else if (vm.status === "failed") {
        body = (
            <div className="flex flex-col items-center justify-center gap-sm p-xl text-center">
                <Text>Could not load reviews.</Text>
                <Button
                    size="sm"
                    variant="tertiary"
                    text="Try again"
                    onClick={() => presenter.refresh()}
                />
            </div>
        );
    } else if (vm.empty) {
        const empty = getReviewListEmpty(vm.tab ?? "myRequests", false, vm.hasTeams);
        body = (
            <div className="flex flex-col items-center justify-center gap-xs p-xl text-center">
                <Text className="font-semibold">{empty.title}</Text>
                <Text size="sm" className="text-neutral-strong">
                    {empty.description}
                </Text>
            </div>
        );
    } else {
        body = (
            <ul className="list-none m-0 p-0">
                {vm.rows.map(row => (
                    <ReviewWidgetRow key={row.reviewId} row={row} />
                ))}
            </ul>
        );
    }

    const viewAllTab: ReviewListTab = vm.tab ?? "myRequests";

    return (
        <div
            data-testid={`review-widget-${kind}`}
            className="flex flex-col min-h-[300px] rounded-lg bg-neutral-base"
        >
            <div className="flex items-center gap-md px-md py-sm">
                <Text className="flex-1 font-semibold">{title}</Text>
                {segment}
            </div>
            <div className="flex-1 flex flex-col border-t-sm border-solid border-neutral-dimmed">
                {body}
            </div>
            <div className="px-md py-sm text-right">
                <Link to={viewAllUrl(viewAllTab)}>View all →</Link>
            </div>
        </div>
    );
});
```

`packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewForMeWidget.tsx`:

```tsx
import React from "react";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewWidgetCard } from "./ReviewWidgetCard.js";

export interface ReviewForMeWidgetProps {
    useCases: IReviewListUseCases;
    namespaces: string[];
    rowProvider: IReviewRowProvider;
    viewAllUrl: (tab: ReviewListTab) => string;
}

export const ReviewForMeWidget = (props: ReviewForMeWidgetProps) => {
    return <ReviewWidgetCard {...props} kind="forMe" title="For me to review" />;
};
```

`packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewMyRequestsWidget.tsx`:

```tsx
import React from "react";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewWidgetCard } from "./ReviewWidgetCard.js";

export interface ReviewMyRequestsWidgetProps {
    useCases: IReviewListUseCases;
    namespaces: string[];
    rowProvider: IReviewRowProvider;
    viewAllUrl: (tab: ReviewListTab) => string;
}

export const ReviewMyRequestsWidget = (props: ReviewMyRequestsWidgetProps) => {
    return <ReviewWidgetCard {...props} kind="myRequests" title="My requests" />;
};
```

`packages/app-workflows/src/app.tsx`: re-read the file as Task 25 left it, then add

```diff
+import { ReviewWidgetPresenterFeature } from "~/review/presentation/reviewWidget/feature.js";
```

next to the other review feature imports and

```diff
+            <RegisterFeature feature={ReviewWidgetPresenterFeature} />
```

next to `<RegisterFeature feature={ReviewListPresenterFeature} />`, inside the gate.

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewWidget/ReviewWidgetPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -50
```

Expected: PASS. Admin packages run `yarn test <path>` only (no storage). If `SegmentedControl` renders `button` instead of `radio`, change the `getByRole("radio", ...)` queries and say so in the commit body.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts 2>&1 | tail -50
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: PASS and the build (the type check of the co-located tests, R-e) prints no errors.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full and restore `.gitleaks.toml`:

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
git commit -m "feat(app-workflows): add the review dashboard widgets" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.

**Contract notes:**
- Additive: `ReviewWidgetRowVm.stateVariant`, `ReviewWidgetPresenter.ViewModel.hasTeams` (QBZ-73), `ReviewWidgetStatus`, and the shared `ReviewWidgetCard.tsx` behind the two named components (the contract names only the two). The presenter now depends on `IdentityContext` (`[ReviewActivity, IdentityContext]`). Both components pass the same four props.
- Contract deviations recorded: the design's step colour dot and the "(app)" suffix of the step line are dropped. `stepLine` is "{step} · {content type}": the row binding returns a content type label only, `ReviewListRow` has no step colour, and `app-workflows` knows no app name (R206). The CMS shows the model name, WB shows the step alone.
- The state tag comes from Task 13's `getStepStateTag` (variant type `TargetReviewTagVariant`); a row without a current step state falls back to the review state label with a neutral tag.
- The loading and error copy of the widgets ("Could not load reviews." with "Try again") is design frame 12; the loading state is a three-row skeleton (frame 10). A failed first load retries with the skeleton, a failed background refresh keeps the rows.
- "Team pool" empty text for `forMe` uses `getReviewListEmpty` of Task 25, so list and widget copy cannot drift (QBZ-72, QBZ-73); the QBZ-73 gap of Task 25 (a member of only non-reviewing teams) applies here too.
- `setTab` on a "myRequests" widget is a no-op (it has no segment).
- `useCases.listReviews` is called inline in four methods (user rule: no wrapper around a use case call); only state helpers are shared.
- The composition-root expectations go into Task 10's `app.test.tsx` (the contract names a `wiring.test.tsx` that no earlier task creates); the widget tests use Task 14's `renderWithAdminUi` through Task 15's `renderWithContainer`, so this task adds no vitest config, svg stub or render helper.
