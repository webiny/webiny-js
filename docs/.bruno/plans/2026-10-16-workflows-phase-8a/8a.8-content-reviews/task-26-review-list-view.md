### Task 26: List view, toolbar, table, row actions, notice

Spec 13.5; R206, R210, R212, R229, R234; Decisions D112, D113, D114, D119; design README 8, QBZ-69..73, QBZ-71, QBZ-86; Review Focus 11 (rendering of the notice, Show and fade), 12 (actions come from server flags), 13 (an unbound namespace degrades). The shared `ReviewListView` renders what `ReviewListPresenter` (Task 25) exposes and knows no app: it takes the list use cases, a row provider, the namespaces and two mount options (`showContentType`, `contentTypeFilter`), so the CMS (Content type column and filter, D113) and Website Builder (neither) mount the same view.

- **Layout (README 8):** title "Content Reviews" with the sub line "Reviews you can act on or follow. Open the content to approve or reject.", four tabs, a toolbar (search "Search by title", a content-type select only with `showContentType` and a filter, and on My requests the selects "Any review state" and "Any step state"), the table, the footer.
- **Table:** columns Title (a link to `contentUrl`, plain text when there is none), Content type (only with `showContentType`), Current step, Step state (tag), Owner, Requester, Last change (the header toggles the sort, titles "Newest change first" / "Oldest change first"), and the actions column. Rows of a `leaving` review fade to 35 % and are dropped on transition end (QBZ-71). New reviews appear only behind the notice "New reviews are available." with **Show** (QBZ-71, QBZ-86).
- **Row actions:** `Start` and `Take over` are buttons in the row; `Reassign`, `Cancel review` and `Review details` sit in the "More actions" menu; "Open in new window" links to `contentUrl`. Every action comes from `row.actions` (server flags, Review Focus 12) and opens the Task 15 and 16 `ReviewActionDialogs` with the use cases of the row's binding, `reviewsUrl: null` (the list shows no "Open Content Reviews" link, R214); "Review details" opens the Task 18 drawer. A row whose namespace has no binding shows no menu and no buttons.
- **Footer:** "Load more" while `hasMore` (disabled with "Loading…" while loading more), "That's everything." otherwise (R229).
- **States:** loading skeleton rows; failed: "Could not load reviews" / "The server did not respond. Try again in a moment." with **Try again**; empty states from the presenter with **Clear filters** only for the filtered state.
- **Search:** the input keeps its own draft and applies it after 300 ms without typing (the presenter ignores an unchanged value).

**Files:**
- Create: `packages/app-workflows/src/review/presentation/reviewList/IReviewContentTypeFilter.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewList/components/{ReviewListView,ReviewListTabs,ReviewListToolbar,ReviewListTable,ReviewListRowActions,ReviewListEmpty,ReviewListNotice,ReviewListDialogs}.tsx`
- Create: `packages/app-workflows/src/review/presentation/reviewList/prefersReducedMotion.ts` (pure)
- Create tests: `packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx`, `packages/app-workflows/src/review/presentation/reviewList/components/ReviewListToolbar.test.tsx`
- The barrel `src/index.tsx` is not touched (R-k). No vitest config, svg stub or render helper is added here: Task 14 owns them (`vitest.config.ts` with the DOM setup and the svg alias, `renderWithAdminUi`).

**Interfaces:**
- Consumes: Task 25 (`ReviewListPresenter`, `ReviewListPresenterFeature`, `IReviewRowProvider`, `ReviewListTab`, `ReviewListRowVm`, `REVIEW_LIST_TABS`, `parseReviewListTab`, the builder `createReviewListItem` from `~/review/testing/createReviewListItem.js`); Task 15 and 16 (`ReviewActionDialogs` from `~/review/presentation/actionDialog/components/ReviewActionDialogs.js`, `ReviewActionRequest` from `~/review/presentation/actionDialog/ReviewActionRequest.js`, the `reassign` kind); Task 18 (`ReviewDetailsDrawer` from `~/review/presentation/reviewDetails/components/ReviewDetailsDrawer.js`, **and its `ReviewDetailsPresenter` notifying `ReviewActivity` with `source: "own"` after an action taken in the drawer**, see Contract notes); Task 14 (`renderWithAdminUi` from `~/review/testing/renderWithAdminUi.js`, the vitest config with the DOM setup file and the svg alias); Task 8 (`IReviewListUseCases`, `ReviewState`, `StepState`, `REVIEW_LIST_PAGE_SIZE`); Task 10 (`ReviewActivity` token and the real implementation `~/review/activity/ReviewActivity.js`). Existing: `IdentityContext` (`@webiny/app-admin/features/security/IdentityContext/abstractions.js`), `createReactiveComponent` (`@webiny/app-admin`), `useFeature` (`@webiny/app`), `@webiny/admin-ui` `Alert`, `Button`, `DropdownMenu`, `EmptyState`, `Heading`, `Icon`, `IconButton`, `Input`, `Link`, `Select`, `Skeleton`, `Table`, `Tabs`, `Tag`, `Text`; `@webiny/icons/more_vert.svg`, `@webiny/icons/open_in_new.svg`.
- Produces (consumed by Task 28): `ReviewListView` with props `{ useCases: IReviewListUseCases; rowProvider: IReviewRowProvider; namespaces: string[]; showContentType: boolean; contentTypeFilter: IReviewContentTypeFilter | null; initialTab?: ReviewListTab }` (R206); `IReviewContentTypeFilter { options: ReviewContentTypeOption[] }` with `ReviewContentTypeOption { label: string; value: string }`.

verify before writing code (record each result in the commit body):
- Read the props of every admin-ui component named above in `packages/admin-ui/src/<Component>/` (`Tabs` takes `tabs: <Tabs.Tab value trigger content />[]` plus Radix `value` and `onValueChange`; `Select` takes `options`, `value`, `onChange(value: string)`, `placeholder`; `Input` takes `onChange(value: string)`; `Table` exposes `Table.Header`, `Table.Body`, `Table.Row`, `Table.Head`, `Table.Cell`; `Link` takes `to`). The plan uses `Table` instead of `DataTable` because `DataTable` has no row-level class and the fading row needs one.
- Task 15, 16 and 18 export `ReviewActionDialogs`, `ReviewActionRequest` and `ReviewDetailsDrawer` with the props of the Interfaces entries (`{ useCases; request; reviewsUrl; onDone; onClose }` and `{ useCases; reviewId; reviewsUrl; onClose }`).
- Task 18's `ReviewDetailsPresenter` calls `ReviewActivity.notify({ namespace, source: "own" })` after a successful action. This task depends on it: the drawer's actions end in the activity bus, and the list refetches through its own subscription. If Task 18 does not do it, stop and have Task 18 fixed (Contract notes).
- Task 14's `__tests__/setup/setupDom.ts` stubs `ResizeObserver` and cleans up after each test. `renderWithAdminUi` mounts the real `AdminUiProvider`, whose toast stack reads `window.matchMedia`; if the setup file does not define it, Task 14 must add the stub (Contract notes), this task does not.

- [ ] **Step 1: Write the failing tests**

`packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { within } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewActivity as ReviewActivityImplementation } from "~/review/activity/ReviewActivity.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { ReviewListPage } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { IReviewRowProvider } from "../abstractions.js";
import type { ReviewListTab } from "../abstractions.js";
import { ReviewListPresenterFeature } from "../feature.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import type { IReviewContentTypeFilter } from "../IReviewContentTypeFilter.js";
import { ReviewListView } from "./ReviewListView.js";

interface DialogStubProps {
    useCases: { name: string };
    request: { kind: string; reviewId: string; stepId: string | null } | null;
    listRefreshed?: boolean;
    onDone(): void;
    onClose(): void;
}

interface DrawerStubProps {
    useCases: { name: string };
    reviewId: string;
    onClose(): void;
}

vi.mock("~/review/presentation/actionDialog/components/ReviewActionDialogs.js", async () => {
    const React = await import("react");
    return {
        ReviewActionDialogs: (props: DialogStubProps) => {
            if (!props.request) {
                return null;
            }
            return React.createElement(
                "div",
                {
                    "data-testid": "action-dialogs",
                    "data-kind": props.request.kind,
                    "data-review": props.request.reviewId,
                    "data-step": props.request.stepId,
                    "data-list-refreshed": String(props.listRefreshed === true),
                    "data-usecases": props.useCases.name
                },
                React.createElement("button", { onClick: props.onDone }, "stub done"),
                React.createElement("button", { onClick: props.onClose }, "stub close")
            );
        }
    };
});

vi.mock("~/review/presentation/reviewDetails/components/ReviewDetailsDrawer.js", async () => {
    const React = await import("react");
    return {
        ReviewDetailsDrawer: (props: DrawerStubProps) => {
            return React.createElement(
                "div",
                {
                    "data-testid": "details-drawer",
                    "data-review": props.reviewId,
                    "data-usecases": props.useCases.name
                },
                React.createElement("button", { onClick: props.onClose }, "stub close drawer")
            );
        }
    };
});

type ListResult = ReviewListPage | Error;

const page = (
    items: ReturnType<typeof createReviewListItem>[],
    cursor: string | null = null,
    hasMoreItems = false
): ReviewListPage => {
    return { items, meta: { cursor, hasMoreItems } };
};

const cmsUseCases = { name: "cms" } as unknown as IReviewUseCases;

const rowProvider: IReviewRowProvider = {
    getBinding: namespace => {
        if (!namespace.startsWith("cms.")) {
            return null;
        }
        return {
            useCases: cmsUseCases,
            getContentUrl: ref => {
                return `/cms/content-entries/${ref.contentTypeId}?id=${encodeURIComponent(ref.targetRevisionId)}`;
            },
            getContentTypeLabel: contentTypeId => {
                return `Type ${contentTypeId}`;
            }
        };
    }
};

interface RenderOptions {
    results?: ListResult[];
    showContentType?: boolean;
    contentTypeFilter?: IReviewContentTypeFilter | null;
    initialTab?: ReviewListTab;
}

const renderView = (options: RenderOptions = {}) => {
    const container = new Container();
    container.register(ReviewActivityImplementation).inSingletonScope();
    const identity = { teams: [{ id: "team-1", slug: "team-1", name: "Team 1" }] } as unknown as Identity;
    container.registerInstance(IdentityContext, {
        getIdentity: () => identity,
        setIdentity: vi.fn(),
        clear: vi.fn()
    });
    ReviewListPresenterFeature.register(container);
    const activity = container.resolve(ReviewActivity);

    const listReviews = vi.fn<IReviewListUseCases["listReviews"]>();
    listReviews.mockResolvedValue(page([]));
    (options.results ?? [page([])]).forEach(result => {
        if (result instanceof Error) {
            listReviews.mockRejectedValueOnce(result);
            return;
        }
        listReviews.mockResolvedValueOnce(result);
    });
    const useCases: IReviewListUseCases = { listReviews };

    renderWithAdminUi(
        <DiContainerProvider container={container}>
            <ReviewListView
                useCases={useCases}
                rowProvider={rowProvider}
                namespaces={["cms.article", "other.app"]}
                showContentType={options.showContentType ?? true}
                contentTypeFilter={options.contentTypeFilter ?? null}
                initialTab={options.initialTab}
            />
        </DiContainerProvider>
    );

    return { activity, listReviews };
};

const rowOf = (title: string): HTMLElement => {
    return screen.getByText(title).closest("tr") as HTMLElement;
};

describe("ReviewListView", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("renders rows of two namespaces and degrades the unbound one (R206)", async () => {
        renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "bound",
                        title: "Bound review",
                        namespace: "cms.article",
                        modelId: "article",
                        targetRevisionId: "e1#0001",
                        flags: { canStart: true }
                    }),
                    createReviewListItem({
                        id: "unbound",
                        title: "Unbound review",
                        namespace: "other.app",
                        flags: { canStart: true, canCancel: true }
                    })
                ])
            ]
        });

        const link = await screen.findByRole("link", { name: "Bound review" });
        expect(link.getAttribute("href")).toBe("/cms/content-entries/article?id=e1%230001");
        expect(screen.getByText("Type article")).toBeTruthy();
        expect(within(rowOf("Bound review")).getByRole("button", { name: "Start" })).toBeTruthy();

        expect(screen.queryByRole("link", { name: "Unbound review" })).toBeNull();
        const unbound = within(rowOf("Unbound review"));
        expect(unbound.queryByRole("button", { name: "Start" })).toBeNull();
        expect(unbound.queryByRole("button", { name: "More actions" })).toBeNull();
        expect(unbound.queryByRole("link", { name: "Open in new window" })).toBeNull();
    });

    it("shows the actions the flags allow and nothing else (D5, D54)", async () => {
        renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "can-start",
                        title: "Can start",
                        flags: { canStart: true }
                    }),
                    createReviewListItem({
                        id: "can-take",
                        title: "Can take",
                        flags: { canTakeOver: true }
                    }),
                    createReviewListItem({ id: "none", title: "No actions" })
                ])
            ]
        });

        await screen.findByText("Can start");

        const start = within(rowOf("Can start"));
        expect(start.getByRole("button", { name: "Start" })).toBeTruthy();
        expect(start.queryByRole("button", { name: "Take over" })).toBeNull();

        const take = within(rowOf("Can take"));
        expect(take.getByRole("button", { name: "Take over" })).toBeTruthy();
        expect(take.queryByRole("button", { name: "Start" })).toBeNull();

        const none = within(rowOf("No actions"));
        expect(none.queryByRole("button", { name: "Start" })).toBeNull();
        expect(none.queryByRole("button", { name: "Take over" })).toBeNull();
        expect(none.getByRole("button", { name: "More actions" })).toBeTruthy();
    });

    it("opens the dialog of an inline action on the row's use cases and refetches once when it is done", async () => {
        const { listReviews } = renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "r1",
                        title: "Review one",
                        stepId: "step-7",
                        flags: { canStart: true }
                    })
                ]),
                page([])
            ]
        });
        await screen.findByText("Review one");

        fireEvent.click(within(rowOf("Review one")).getByRole("button", { name: "Start" }));

        const dialogs = await screen.findByTestId("action-dialogs");
        expect(dialogs.getAttribute("data-kind")).toBe("start");
        expect(dialogs.getAttribute("data-review")).toBe("r1");
        expect(dialogs.getAttribute("data-step")).toBe("step-7");
        expect(dialogs.getAttribute("data-usecases")).toBe("cms");

        fireEvent.click(screen.getByText("stub done"));

        await waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));
        expect(screen.queryByTestId("action-dialogs")).toBeNull();
    });

    it("opens the action dialog with listRefreshed so a Start conflict ends with 'The list has been refreshed.' (R220, R242, QBZ-31)", async () => {
        renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "r1",
                        title: "Review one",
                        stepId: "step-7",
                        flags: { canStart: true }
                    })
                ]),
                page([])
            ]
        });
        await screen.findByText("Review one");

        fireEvent.click(within(rowOf("Review one")).getByRole("button", { name: "Start" }));

        // The stub stands in for `ReviewActionDialogs`; with `listRefreshed` true, Task 15's
        // `getConflictMessage` ends the StepNotCurrent message with "The list has been refreshed."
        // (pinned in Task 15's `getConflictMessage.test.ts`), so the prop is what this list owes.
        const dialogs = await screen.findByTestId("action-dialogs");
        expect(dialogs.getAttribute("data-kind")).toBe("start");
        expect(dialogs.getAttribute("data-list-refreshed")).toBe("true");
    });

    it("opens the menu actions and Review details", async () => {
        renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "r1",
                        title: "Review one",
                        stepId: "step-3",
                        flags: { canReassign: true, canCancel: true }
                    })
                ])
            ]
        });
        await screen.findByText("Review one");

        const more = within(rowOf("Review one")).getByRole("button", { name: "More actions" });
        fireEvent.keyDown(more, { key: "Enter" });
        expect(await screen.findByRole("menuitem", { name: "Reassign" })).toBeTruthy();
        expect(screen.getByRole("menuitem", { name: "Cancel review" })).toBeTruthy();
        fireEvent.click(screen.getByRole("menuitem", { name: "Reassign" }));

        const dialogs = await screen.findByTestId("action-dialogs");
        expect(dialogs.getAttribute("data-kind")).toBe("reassign");
        fireEvent.click(screen.getByText("stub close"));
        expect(screen.queryByTestId("action-dialogs")).toBeNull();

        fireEvent.keyDown(more, { key: "Enter" });
        fireEvent.click(await screen.findByRole("menuitem", { name: "Review details" }));

        const drawer = await screen.findByTestId("details-drawer");
        expect(drawer.getAttribute("data-review")).toBe("r1");
        expect(drawer.getAttribute("data-usecases")).toBe("cms");
    });

    it("shows the notice for new reviews and Show reloads the first page", async () => {
        const { activity, listReviews } = renderView({
            results: [
                page([createReviewListItem({ id: "old", title: "Old review" })]),
                page([
                    createReviewListItem({ id: "old", title: "Old review" }),
                    createReviewListItem({ id: "fresh", title: "Fresh review" })
                ]),
                page([
                    createReviewListItem({ id: "fresh", title: "Fresh review" }),
                    createReviewListItem({ id: "old", title: "Old review" })
                ])
            ]
        });
        await screen.findByText("Old review");

        act(() => {
            activity.notify({ namespace: "cms.article", source: "remote" });
        });

        expect(await screen.findByText("New reviews are available.")).toBeTruthy();
        expect(screen.queryByText("Fresh review")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Show" }));

        expect(await screen.findByText("Fresh review")).toBeTruthy();
        expect(screen.queryByText("New reviews are available.")).toBeNull();
        expect(listReviews).toHaveBeenCalledTimes(3);
    });

    it("fades a review that left the tab and drops it on transition end", async () => {
        const { activity } = renderView({
            results: [
                page([
                    createReviewListItem({ id: "stays", title: "Stays here" }),
                    createReviewListItem({ id: "gone", title: "Gone review" })
                ]),
                page([createReviewListItem({ id: "stays", title: "Stays here" })])
            ]
        });
        await screen.findByText("Gone review");

        act(() => {
            activity.notify({ namespace: "cms.article", source: "remote" });
        });

        await waitFor(() => {
            expect(rowOf("Gone review").className).toContain("opacity-35");
        });
        expect(rowOf("Stays here").className).not.toContain("opacity-35");

        fireEvent.transitionEnd(rowOf("Gone review"));

        await waitFor(() => expect(screen.queryByText("Gone review")).toBeNull());
        expect(screen.getByText("Stays here")).toBeTruthy();
    });

    it("highlights a row whose review changed and not the unchanged ones (QBZ-86)", async () => {
        const { activity } = renderView({
            results: [
                page([
                    createReviewListItem({ id: "changes", title: "Will change" }),
                    createReviewListItem({ id: "same", title: "Stays the same" })
                ]),
                page([
                    createReviewListItem({
                        id: "changes",
                        title: "Will change",
                        stepState: StepState.InReview
                    }),
                    createReviewListItem({ id: "same", title: "Stays the same" })
                ])
            ]
        });
        await screen.findByText("Will change");
        expect(rowOf("Will change").className).not.toContain("bg-primary-subtle");

        act(() => {
            activity.notify({ namespace: "cms.article", source: "remote" });
        });

        await waitFor(() => {
            expect(rowOf("Will change").className).toContain("bg-primary-subtle");
        });
        expect(rowOf("Stays the same").className).not.toContain("bg-primary-subtle");
    });

    it("drops a leaving row at once when the viewer prefers reduced motion", async () => {
        vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
        const { activity } = renderView({
            results: [
                page([
                    createReviewListItem({ id: "stays", title: "Stays here" }),
                    createReviewListItem({ id: "gone", title: "Gone review" })
                ]),
                page([createReviewListItem({ id: "stays", title: "Stays here" })])
            ]
        });
        await screen.findByText("Gone review");

        act(() => {
            activity.notify({ namespace: "cms.article", source: "remote" });
        });

        await waitFor(() => expect(screen.queryByText("Gone review")).toBeNull());
        expect(screen.getByText("Stays here")).toBeTruthy();
    });

    it("loads more by cursor and ends with 'That's everything.'", async () => {
        const { listReviews } = renderView({
            results: [
                page([createReviewListItem({ id: "r1", title: "First page" })], "c1", true),
                page([createReviewListItem({ id: "r2", title: "Second page" })], null, false)
            ]
        });
        await screen.findByText("First page");
        expect(screen.queryByText("That's everything.")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Load more" }));

        expect(await screen.findByText("Second page")).toBeTruthy();
        expect(await screen.findByText("That's everything.")).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
        expect(listReviews).toHaveBeenLastCalledWith(expect.objectContaining({ after: "c1" }));
    });

    it("shows the failed state and retries", async () => {
        const { listReviews } = renderView({
            results: [new Error("network"), page([createReviewListItem({ id: "r1", title: "Back again" })])]
        });

        expect(await screen.findByText("Could not load reviews")).toBeTruthy();
        expect(screen.getByText("The server did not respond. Try again in a moment.")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(await screen.findByText("Back again")).toBeTruthy();
        expect(listReviews).toHaveBeenCalledTimes(2);
    });

    it("shows the empty state of the tab and switches tabs", async () => {
        const { listReviews } = renderView({ results: [page([]), page([])] });

        expect(await screen.findByText("Nothing assigned to you")).toBeTruthy();

        fireEvent.mouseDown(await screen.findByRole("tab", { name: "Team pool" }));

        expect(await screen.findByText("Your team pools are empty")).toBeTruthy();
        expect(listReviews).toHaveBeenLastCalledWith(
            expect.objectContaining({ list: "pool", sort: "lastChangedOn_ASC" })
        );
    });

    it("renders the four tabs in design order", async () => {
        renderView();

        const tabs = await screen.findAllByRole("tab");

        expect(tabs.map(tab => tab.textContent)).toEqual([
            "Assigned to me",
            "Team pool",
            "Team in review",
            "My requests"
        ]);
    });

    it("shows the Content type column and filter only when the app asks for them (D113)", async () => {
        const first = renderView({
            showContentType: true,
            contentTypeFilter: { options: [{ label: "Article", value: "article" }] },
            results: [page([createReviewListItem({ id: "r1", title: "With type" })])]
        });
        await screen.findByText("With type");
        expect(screen.getByText("Content type")).toBeTruthy();
        expect(screen.getAllByRole("combobox")).toHaveLength(1);
        expect(first.listReviews).toHaveBeenCalledTimes(1);
    });

    it("has neither Content type column nor filter without them (Website Builder)", async () => {
        renderView({
            showContentType: false,
            contentTypeFilter: null,
            results: [page([createReviewListItem({ id: "r1", title: "No type" })])]
        });
        await screen.findByText("No type");

        expect(screen.queryByText("Content type")).toBeNull();
        expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    });

    it("shows the review state and step state filters on My requests", async () => {
        renderView({ initialTab: "myRequests", showContentType: false });
        await screen.findByText("You haven’t requested any reviews");
        expect(screen.getAllByRole("combobox")).toHaveLength(2);
    });

    it("uses the initial tab and the tab's default sort on the first request", async () => {
        const { listReviews } = renderView({ initialTab: "myRequests" });
        await screen.findByText("You haven’t requested any reviews");

        expect(listReviews).toHaveBeenCalledWith(
            expect.objectContaining({ list: "myRequests", sort: "lastChangedOn_DESC" })
        );
    });

    it("toggles the sort from the Last change header", async () => {
        const { listReviews } = renderView({
            results: [
                page([createReviewListItem({ id: "r1", title: "Sortable" })]),
                page([createReviewListItem({ id: "r1", title: "Sortable" })])
            ]
        });
        await screen.findByText("Sortable");

        fireEvent.click(screen.getByTitle("Oldest change first"));

        await waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));
        expect(listReviews).toHaveBeenLastCalledWith(
            expect.objectContaining({ sort: "lastChangedOn_DESC" })
        );
        expect(await screen.findByTitle("Newest change first")).toBeTruthy();
    });

    it("renders review and step state labels", async () => {
        renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "r1",
                        title: "Rejected one",
                        state: ReviewState.Rejected
                    })
                ])
            ]
        });

        await screen.findByText("Rejected one");

        expect(within(rowOf("Rejected one")).getByText("Awaiting")).toBeTruthy();
    });
});
```

`packages/app-workflows/src/review/presentation/reviewList/components/ReviewListToolbar.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewListPresenter } from "../abstractions.js";
import { ReviewListToolbar } from "./ReviewListToolbar.js";

const createVm = (overrides: Partial<ReviewListPresenter.ViewModel> = {}): ReviewListPresenter.ViewModel => {
    return {
        tab: "assignedToMe",
        rows: [],
        status: "ready",
        loadingMore: false,
        hasMore: false,
        sort: "lastChangedOn_ASC",
        search: "",
        contentTypeId: null,
        reviewState: null,
        stepState: null,
        notice: null,
        error: null,
        empty: null,
        isFiltered: false,
        dialog: null,
        ...overrides
    };
};

const createPresenter = (vm: ReviewListPresenter.ViewModel): ReviewListPresenter.Interface => {
    return {
        vm,
        init: vi.fn(),
        setTab: vi.fn(),
        setSearch: vi.fn(),
        setContentType: vi.fn(),
        setReviewState: vi.fn(),
        setStepState: vi.fn(),
        toggleSort: vi.fn(),
        loadMore: vi.fn(),
        refresh: vi.fn(),
        showNewReviews: vi.fn(),
        clearFilters: vi.fn(),
        removeLeavingRow: vi.fn(),
        openRowAction: vi.fn(),
        openDetails: vi.fn(),
        closeDialog: vi.fn(),
        actionDone: vi.fn(),
        dispose: vi.fn()
    };
};

describe("ReviewListToolbar", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("applies the search after 300 ms without typing and restarts on every keystroke", () => {
        const presenter = createPresenter(createVm());
        render(
            <ReviewListToolbar
                presenter={presenter}
                showContentType={false}
                contentTypeFilter={null}
            />
        );
        const input = screen.getByPlaceholderText("Search by title");

        fireEvent.change(input, { target: { value: "bud" } });
        act(() => {
            vi.advanceTimersByTime(200);
        });
        fireEvent.change(input, { target: { value: "budget" } });
        act(() => {
            vi.advanceTimersByTime(299);
        });
        expect(presenter.setSearch).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1);
        });

        expect(presenter.setSearch).toHaveBeenCalledTimes(1);
        expect(presenter.setSearch).toHaveBeenCalledWith("budget");
    });

    it("shows the applied search and does not re-apply it", () => {
        const presenter = createPresenter(createVm({ search: "applied" }));
        render(
            <ReviewListToolbar
                presenter={presenter}
                showContentType={false}
                contentTypeFilter={null}
            />
        );

        const input = screen.getByPlaceholderText("Search by title") as HTMLInputElement;
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(input.value).toBe("applied");
        expect(presenter.setSearch).not.toHaveBeenCalled();
    });

    it("offers the content type filter only with the option and a filter", () => {
        const filter = { options: [{ label: "Article", value: "article" }] };

        const hidden = render(
            <ReviewListToolbar
                presenter={createPresenter(createVm())}
                showContentType={false}
                contentTypeFilter={filter}
            />
        );
        expect(screen.queryAllByRole("combobox")).toHaveLength(0);
        hidden.unmount();

        const noFilter = render(
            <ReviewListToolbar
                presenter={createPresenter(createVm())}
                showContentType={true}
                contentTypeFilter={null}
            />
        );
        expect(screen.queryAllByRole("combobox")).toHaveLength(0);
        noFilter.unmount();

        render(
            <ReviewListToolbar
                presenter={createPresenter(createVm())}
                showContentType={true}
                contentTypeFilter={filter}
            />
        );
        expect(screen.getAllByRole("combobox")).toHaveLength(1);
    });

    it("adds the review state and step state selects on My requests only", () => {
        const filter = { options: [{ label: "Article", value: "article" }] };

        const other = render(
            <ReviewListToolbar
                presenter={createPresenter(createVm({ tab: "pool" }))}
                showContentType={true}
                contentTypeFilter={filter}
            />
        );
        expect(screen.getAllByRole("combobox")).toHaveLength(1);
        other.unmount();

        render(
            <ReviewListToolbar
                presenter={createPresenter(
                    createVm({ tab: "myRequests", reviewState: ReviewState.Approved })
                )}
                showContentType={true}
                contentTypeFilter={filter}
            />
        );
        expect(screen.getAllByRole("combobox")).toHaveLength(3);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListToolbar.test.tsx 2>&1 | tail -50
```

Expected: FAIL with `Failed to resolve import "./ReviewListView.js"` and `"./ReviewListToolbar.js"` (the components do not exist yet).

- [ ] **Step 3: Implement**

`packages/app-workflows/src/review/presentation/reviewList/prefersReducedMotion.ts`:

```ts
/** Whether the viewer asked the system for reduced motion; `false` where `matchMedia` is missing. */
export const prefersReducedMotion = (): boolean => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};
```

`packages/app-workflows/src/review/presentation/reviewList/IReviewContentTypeFilter.ts`:

```ts
export interface ReviewContentTypeOption {
    label: string;
    value: string;
}

/**
 * The content types a list can be filtered by (D113). Values are what `where.modelId` carries; an
 * app without content types (Website Builder) passes `null` instead.
 */
export interface IReviewContentTypeFilter {
    options: ReviewContentTypeOption[];
}
```

`packages/app-workflows/src/review/presentation/reviewList/components/ReviewListNotice.tsx`:

```tsx
import React from "react";
import { Button } from "@webiny/admin-ui";

export interface ReviewListNoticeProps {
    message: string;
    onShow: () => void;
}

/** "New reviews are available." with Show (QBZ-71, QBZ-86). */
export const ReviewListNotice = ({ message, onShow }: ReviewListNoticeProps) => {
    return (
        <div
            role="status"
            className="flex items-center gap-sm px-md py-xs mb-sm rounded-md bg-primary-subtle text-md text-neutral-primary"
        >
            <span className="flex-1">{message}</span>
            <Button size="sm" variant="tertiary" text="Show" onClick={onShow} />
        </div>
    );
};
```

`packages/app-workflows/src/review/presentation/reviewList/components/ReviewListEmpty.tsx`:

```tsx
import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";

export interface ReviewListEmptyProps {
    title: string;
    description: string;
    actionLabel: string | null;
    onAction: () => void;
}

/** Empty and failed states share one layout: title, optional description, optional action. */
export const ReviewListEmpty = ({ title, description, actionLabel, onAction }: ReviewListEmptyProps) => {
    let actions: React.ReactNode = null;
    if (actionLabel) {
        actions = <Button variant="tertiary" text={actionLabel} onClick={onAction} />;
    }

    let descriptionText: string | undefined;
    if (description) {
        descriptionText = description;
    }

    return (
        <EmptyState
            illustration={false}
            title={title}
            description={descriptionText}
            actions={actions}
        />
    );
};
```

`packages/app-workflows/src/review/presentation/reviewList/components/ReviewListTabs.tsx`:

```tsx
import React from "react";
import { Tabs } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { ReviewListPresenter } from "../abstractions.js";
import { parseReviewListTab } from "../parseReviewListTab.js";
import { REVIEW_LIST_TABS } from "../reviewListTabs.js";

export interface ReviewListTabsProps {
    presenter: ReviewListPresenter.Interface;
}

export const ReviewListTabs = createReactiveComponent(({ presenter }: ReviewListTabsProps) => {
    const tabs = REVIEW_LIST_TABS.map(tab => {
        return <Tabs.Tab key={tab.value} value={tab.value} trigger={tab.label} content={null} />;
    });

    const onValueChange = (value: string) => {
        const tab = parseReviewListTab(value);
        if (!tab) {
            return;
        }
        void presenter.setTab(tab);
    };

    return <Tabs value={presenter.vm.tab} onValueChange={onValueChange} tabs={tabs} />;
});
```

`packages/app-workflows/src/review/presentation/reviewList/components/ReviewListToolbar.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Input } from "@webiny/admin-ui";
import { Select } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { IReviewContentTypeFilter } from "../IReviewContentTypeFilter.js";
import type { ReviewListPresenter } from "../abstractions.js";

const SEARCH_DEBOUNCE_MS = 300;
const ALL = "all";

interface ReviewStateFilterOption {
    label: string;
    value: string;
    state: ReviewStateValue | null;
}

interface StepStateFilterOption {
    label: string;
    value: string;
    state: StepStateValue | null;
}

const REVIEW_STATE_OPTIONS: ReviewStateFilterOption[] = [
    { label: "Any review state", value: ALL, state: null },
    { label: "In progress", value: ReviewState.InProgress, state: ReviewState.InProgress },
    { label: "Approved", value: ReviewState.Approved, state: ReviewState.Approved },
    { label: "Rejected", value: ReviewState.Rejected, state: ReviewState.Rejected }
];

const STEP_STATE_OPTIONS: StepStateFilterOption[] = [
    { label: "Any step state", value: ALL, state: null },
    { label: "Awaiting", value: StepState.Awaiting, state: StepState.Awaiting },
    { label: "In review", value: StepState.InReview, state: StepState.InReview },
    { label: "Failed", value: StepState.Failed, state: StepState.Failed }
];

export interface ReviewListToolbarProps {
    presenter: ReviewListPresenter.Interface;
    showContentType: boolean;
    contentTypeFilter: IReviewContentTypeFilter | null;
}

export const ReviewListToolbar = createReactiveComponent((props: ReviewListToolbarProps) => {
    const { presenter, showContentType, contentTypeFilter } = props;
    const vm = presenter.vm;
    const [draft, setDraft] = useState(vm.search);

    // A tab switch resets the applied search; show it.
    useEffect(() => {
        setDraft(vm.search);
    }, [vm.search]);

    // Apply the draft after 300 ms without typing (design: search by title).
    useEffect(() => {
        if (draft === vm.search) {
            return;
        }
        const timer = setTimeout(() => {
            void presenter.setSearch(draft);
        }, SEARCH_DEBOUNCE_MS);
        return () => {
            clearTimeout(timer);
        };
    }, [draft, vm.search, presenter]);

    let contentTypeSelect: React.ReactNode = null;
    if (showContentType && contentTypeFilter) {
        const options = [{ label: "All content types", value: ALL }, ...contentTypeFilter.options];
        const onContentTypeChange = (value: string) => {
            if (value === ALL) {
                void presenter.setContentType(null);
                return;
            }
            void presenter.setContentType(value);
        };
        contentTypeSelect = (
            <div className="w-[220px]">
                <Select
                    options={options}
                    value={vm.contentTypeId ?? ALL}
                    onChange={onContentTypeChange}
                    placeholder="All content types"
                />
            </div>
        );
    }

    let requestFilters: React.ReactNode = null;
    if (vm.tab === "myRequests") {
        const onReviewStateChange = (value: string) => {
            const option = REVIEW_STATE_OPTIONS.find(item => item.value === value);
            void presenter.setReviewState(option ? option.state : null);
        };
        const onStepStateChange = (value: string) => {
            const option = STEP_STATE_OPTIONS.find(item => item.value === value);
            void presenter.setStepState(option ? option.state : null);
        };
        requestFilters = (
            <>
                <div className="w-[180px]">
                    <Select
                        options={REVIEW_STATE_OPTIONS}
                        value={vm.reviewState ?? ALL}
                        onChange={onReviewStateChange}
                        placeholder="Any review state"
                    />
                </div>
                <div className="w-[180px]">
                    <Select
                        options={STEP_STATE_OPTIONS}
                        value={vm.stepState ?? ALL}
                        onChange={onStepStateChange}
                        placeholder="Any step state"
                    />
                </div>
            </>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-sm mb-md">
            <div className="grow min-w-[220px]">
                <Input value={draft} onChange={setDraft} placeholder="Search by title" />
            </div>
            {contentTypeSelect}
            {requestFilters}
        </div>
    );
});
```

`packages/app-workflows/src/review/presentation/reviewList/components/ReviewListRowActions.tsx`:

```tsx
import React from "react";
import { Button } from "@webiny/admin-ui";
import { DropdownMenu } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import type { ReviewListPresenter } from "../abstractions.js";
import type { ReviewListRowVm } from "../abstractions.js";

export interface ReviewListRowActionsProps {
    row: ReviewListRowVm;
    presenter: ReviewListPresenter.Interface;
}

/**
 * Start and Take over are buttons in the row, the other actions and Review details sit in the menu.
 * A row without a binding (no content URL) has neither (R206).
 */
export const ReviewListRowActions = ({ row, presenter }: ReviewListRowActionsProps) => {
    if (row.contentUrl === null) {
        return null;
    }

    const inline = row.actions.filter(action => {
        return action.kind === "start" || action.kind === "takeOver";
    });
    const menu = row.actions.filter(action => {
        return action.kind !== "start" && action.kind !== "takeOver";
    });

    return (
        <div className="flex items-center justify-end gap-xs">
            {inline.map(action => (
                <Button
                    key={action.kind}
                    size="sm"
                    variant="secondary"
                    text={action.label}
                    onClick={() => presenter.openRowAction(row.reviewId, action.kind, action.stepId)}
                />
            ))}
            <a
                href={row.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in new window"
                title="Open in new window"
            >
                <Icon icon={<OpenInNewIcon />} label="Open in new window" size="sm" />
            </a>
            <DropdownMenu
                align="end"
                side="bottom"
                trigger={
                    <IconButton
                        aria-label="More actions"
                        title="More actions"
                        icon={<MoreVerticalIcon />}
                    />
                }
            >
                {menu.map(action => (
                    <DropdownMenu.Item
                        key={action.kind}
                        text={action.label}
                        onClick={() =>
                            presenter.openRowAction(row.reviewId, action.kind, action.stepId)
                        }
                    />
                ))}
                <DropdownMenu.Item
                    text="Review details"
                    onClick={() => presenter.openDetails(row.reviewId)}
                />
            </DropdownMenu>
        </div>
    );
};
```

`packages/app-workflows/src/review/presentation/reviewList/components/ReviewListTable.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { Button } from "@webiny/admin-ui";
import { Link } from "@webiny/admin-ui";
import { Table } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { cn } from "@webiny/admin-ui";
import type { ReviewListPresenter } from "../abstractions.js";
import type { ReviewListRowVm } from "../abstractions.js";
import { prefersReducedMotion } from "../prefersReducedMotion.js";
import { ReviewListRowActions } from "./ReviewListRowActions.js";

export interface ReviewListTableProps {
    presenter: ReviewListPresenter.Interface;
    showContentType: boolean;
}

interface ReviewListTableRowProps {
    row: ReviewListRowVm;
    presenter: ReviewListPresenter.Interface;
    showContentType: boolean;
}

const ReviewListTableRow = ({ row, presenter, showContentType }: ReviewListTableRowProps) => {
    // A viewer who prefers reduced motion sees no fade, so no transition ends: drop the row at once.
    useEffect(() => {
        if (row.leaving && prefersReducedMotion()) {
            presenter.removeLeavingRow(row.reviewId);
        }
    }, [row.leaving, row.reviewId, presenter]);

    let title: React.ReactNode = row.title;
    if (row.contentUrl) {
        title = (
            <Link to={row.contentUrl} variant="secondary">
                {row.title}
            </Link>
        );
    }

    let stepState: React.ReactNode = null;
    if (row.stepStateLabel) {
        stepState = <Tag variant={row.stepStateVariant} content={row.stepStateLabel} />;
    }

    let contentType: React.ReactNode = null;
    if (showContentType) {
        contentType = <Table.Cell>{row.contentTypeLabel ?? ""}</Table.Cell>;
    }

    // A leaving row fades to 35 % and is dropped once its transition ends (QBZ-71); a row that
    // changed is highlighted (QBZ-86).
    const className = cn("transition-opacity duration-500 motion-reduce:transition-none", {
        "opacity-35": row.leaving,
        "bg-primary-subtle": row.highlighted
    });

    return (
        <Table.Row
            className={className}
            onTransitionEnd={() => presenter.removeLeavingRow(row.reviewId)}
        >
            <Table.Cell>{title}</Table.Cell>
            {contentType}
            <Table.Cell>{row.stepTitle ?? ""}</Table.Cell>
            <Table.Cell>{stepState}</Table.Cell>
            <Table.Cell>{row.ownerLabel ?? ""}</Table.Cell>
            <Table.Cell>{row.requesterName}</Table.Cell>
            <Table.Cell>{row.lastChange}</Table.Cell>
            <Table.Cell>
                <ReviewListRowActions row={row} presenter={presenter} />
            </Table.Cell>
        </Table.Row>
    );
};

export const ReviewListTable = createReactiveComponent((props: ReviewListTableProps) => {
    const { presenter, showContentType } = props;
    const vm = presenter.vm;

    let contentTypeHead: React.ReactNode = null;
    if (showContentType) {
        contentTypeHead = <Table.Head>Content type</Table.Head>;
    }

    let sortTitle = "Oldest change first";
    let sortArrow = "↑";
    if (vm.sort === "lastChangedOn_DESC") {
        sortTitle = "Newest change first";
        sortArrow = "↓";
    }

    let footer: React.ReactNode = <Text size="sm">That's everything.</Text>;
    if (vm.hasMore) {
        footer = (
            <Button
                variant="tertiary"
                text={vm.loadingMore ? "Loading…" : "Load more"}
                disabled={vm.loadingMore}
                onClick={() => presenter.loadMore()}
            />
        );
    }

    return (
        <>
            <Table bordered>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Title</Table.Head>
                        {contentTypeHead}
                        <Table.Head>Current step</Table.Head>
                        <Table.Head>Step state</Table.Head>
                        <Table.Head>Owner</Table.Head>
                        <Table.Head>Requester</Table.Head>
                        <Table.Head>
                            <button
                                type="button"
                                title={sortTitle}
                                onClick={() => presenter.toggleSort()}
                            >
                                {`Last change ${sortArrow}`}
                            </button>
                        </Table.Head>
                        <Table.Head />
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {vm.rows.map(row => (
                        <ReviewListTableRow
                            key={row.reviewId}
                            row={row}
                            presenter={presenter}
                            showContentType={showContentType}
                        />
                    ))}
                </Table.Body>
            </Table>
            <div className="flex justify-center py-md">{footer}</div>
        </>
    );
});
```

Note on the last JSX: `vm.loadingMore ? ... : ...` is a single-line ternary in an attribute, allowed (the rule forbids multiline ternaries).

`packages/app-workflows/src/review/presentation/reviewList/components/ReviewListDialogs.tsx`:

```tsx
import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import type { ReviewActionRequest } from "~/review/presentation/actionDialog/ReviewActionRequest.js";
import { ReviewActionDialogs } from "~/review/presentation/actionDialog/components/ReviewActionDialogs.js";
import { ReviewDetailsDrawer } from "~/review/presentation/reviewDetails/components/ReviewDetailsDrawer.js";
import type { IReviewRowProvider } from "../abstractions.js";
import type { ReviewListPresenter } from "../abstractions.js";

export interface ReviewListDialogsProps {
    presenter: ReviewListPresenter.Interface;
    rowProvider: IReviewRowProvider;
}

/**
 * Mounts the row action dialog or the details drawer the presenter asks for, on the use cases of
 * the row's namespace. The list passes no `reviewsUrl`: it is Content Reviews itself (R214).
 */
export const ReviewListDialogs = createReactiveComponent((props: ReviewListDialogsProps) => {
    const { presenter, rowProvider } = props;
    const dialog = presenter.vm.dialog;
    if (!dialog) {
        return null;
    }

    const binding = rowProvider.getBinding(dialog.namespace);
    if (!binding) {
        return null;
    }

    if (dialog.kind === "details") {
        return (
            <ReviewDetailsDrawer
                useCases={binding.useCases}
                reviewId={dialog.reviewId}
                reviewsUrl={null}
                onClose={() => presenter.closeDialog()}
            />
        );
    }

    const request: ReviewActionRequest = {
        kind: dialog.kind,
        reviewId: dialog.reviewId,
        stepId: dialog.stepId
    };

    return (
        <ReviewActionDialogs
            useCases={binding.useCases}
            request={request}
            reviewsUrl={null}
            listRefreshed={true}
            onDone={() => presenter.actionDone()}
            onClose={() => presenter.closeDialog()}
        />
    );
});
```

`packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { Alert } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewContentTypeFilter } from "../IReviewContentTypeFilter.js";
import type { IReviewRowProvider } from "../abstractions.js";
import type { ReviewListTab } from "../abstractions.js";
import { ReviewListPresenterFeature } from "../feature.js";
import { ReviewListDialogs } from "./ReviewListDialogs.js";
import { ReviewListEmpty } from "./ReviewListEmpty.js";
import { ReviewListNotice } from "./ReviewListNotice.js";
import { ReviewListTable } from "./ReviewListTable.js";
import { ReviewListTabs } from "./ReviewListTabs.js";
import { ReviewListToolbar } from "./ReviewListToolbar.js";

export interface ReviewListViewProps {
    useCases: IReviewListUseCases;
    rowProvider: IReviewRowProvider;
    namespaces: string[];
    showContentType: boolean;
    contentTypeFilter: IReviewContentTypeFilter | null;
    initialTab?: ReviewListTab;
}

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

const ReviewListSkeleton = () => {
    return (
        <div className="flex flex-col gap-md p-md bg-neutral-base">
            {SKELETON_ROWS.map(index => (
                <Skeleton key={index} type="text" />
            ))}
        </div>
    );
};

export const ReviewListView = createReactiveComponent((props: ReviewListViewProps) => {
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

    const vm = presenter.vm;

    let notice: React.ReactNode = null;
    if (vm.notice) {
        notice = <ReviewListNotice message={vm.notice} onShow={() => presenter.showNewReviews()} />;
    }

    let loadError: React.ReactNode = null;
    if (vm.status === "ready" && vm.error) {
        loadError = (
            <Alert type="danger" variant="subtle">
                {vm.error}
            </Alert>
        );
    }

    let body: React.ReactNode;
    if (vm.status === "loading") {
        body = <ReviewListSkeleton />;
    } else if (vm.status === "failed") {
        body = (
            <ReviewListEmpty
                title="Could not load reviews"
                description={vm.error ?? ""}
                actionLabel="Try again"
                onAction={() => presenter.refresh()}
            />
        );
    } else if (vm.empty) {
        let actionLabel: string | null = null;
        if (vm.isFiltered) {
            actionLabel = "Clear filters";
        }
        body = (
            <ReviewListEmpty
                title={vm.empty.title}
                description={vm.empty.description}
                actionLabel={actionLabel}
                onAction={() => presenter.clearFilters()}
            />
        );
    } else if (vm.rows.length > 0) {
        body = <ReviewListTable presenter={presenter} showContentType={showContentType} />;
    } else {
        body = null;
    }

    return (
        <div className="px-lg py-md">
            <div className="mb-md">
                <Heading level={3}>Content Reviews</Heading>
                <Text size="md" className="text-neutral-strong">
                    Reviews you can act on or follow. Open the content to approve or reject.
                </Text>
            </div>
            <ReviewListTabs presenter={presenter} />
            <div className="pt-md">
                <ReviewListToolbar
                    presenter={presenter}
                    showContentType={showContentType}
                    contentTypeFilter={contentTypeFilter}
                />
                {notice}
                {loadError}
                {body}
            </div>
            <ReviewListDialogs presenter={presenter} rowProvider={rowProvider} />
        </div>
    );
});
```

Check `Skeleton` props: `type="text"` verified in `packages/admin-ui/src/Skeleton/Skeleton.tsx` (variants `size`, `type`, `shade`); if `type="text"` is not a variant value, use the default variant (no props) and say so in the commit.

Notes on the files above:
- `ReviewListTable.tsx` imports `cn` from `@webiny/admin-ui` in a second import line (one named import per line).
- No component in this task holds a presenter or a callback in a view model: every handler is created in the component from the presenter and ids (R234).

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListToolbar.test.tsx 2>&1 | tail -50
```

Expected: PASS. Admin packages run `yarn test <path>` only (no storage). If the Radix menu does not open under jsdom with `keyDown` Enter, open it with `fireEvent.pointerDown(more, { button: 0, ctrlKey: false })` in the two menu tests and record the change in the commit body.

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
git commit -m "feat(app-workflows): add the review list view" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.

**Contract notes:**
- `onTransitionEnd` on a leaving row drops it without checking `propertyName`; a hover colour transition on a row that is already fading would drop it a little early, which is harmless.
- The design shows a step colour dot and the app name under the content type; neither is in the row model (`ReviewListRow` has no step colour, the binding returns a label only), so the table shows the step title and the content type label.
- The "Last change" header uses the characters "↑" and "↓" with the design titles instead of icons, which keeps the header free of an icon import.
- The row menu appears for every bound row (it always contains "Review details"); the "row actions from flags" apply to the other items.
- The view tests mount `AdminUiProvider` through Task 14's `renderWithAdminUi`; if sonner's toast stack needs `window.matchMedia` and Task 14's `setupDom.ts` does not define it, Task 14 adds it. This task adds no stub, no vitest config and no render helper.
- Highlighted rows (QBZ-86) use `bg-primary-subtle`; the fade of leaving rows has a reduced-motion fallback (`prefersReducedMotion` drops the row at once, because no transition ends).
- Size: eight components and two test files with full code; one test cycle.
