import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { IPermission } from "@webiny/app-admin/domain/Identity.js";
import type { ITeam } from "@webiny/app-admin/domain/Identity.js";
import { ReviewActivity as ReviewActivityAbstraction } from "~/review/activity/abstractions.js";
import { ReviewActivity } from "~/review/activity/ReviewActivity.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { REVIEW_LIST_PAGE_SIZE } from "~/review/domain/constants.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { ReviewListPage } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";
import { ReviewListPresenter } from "./abstractions.js";
import type { IReviewRowBinding } from "./abstractions.js";
import type { IReviewRowProvider } from "./abstractions.js";
import type { ReviewListInitParams } from "./abstractions.js";
import { ReviewListPresenterFeature } from "./feature.js";

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

const page = (
    items: ReviewWithFlags[],
    cursor: string | null = null,
    hasMoreItems = false
): ReviewListPage => {
    return { items, meta: { cursor, hasMoreItems } };
};

const cmsUseCases = { name: "cms" } as unknown as IReviewUseCases;

const cmsBinding: IReviewRowBinding = {
    useCases: cmsUseCases,
    getContentUrl: ref => `/cms/content-entries/${ref.contentTypeId}?id=${ref.targetRevisionId}`,
    getContentTypeLabel: contentTypeId => `Type ${contentTypeId}`
};

const rowProvider: IReviewRowProvider = {
    getBinding: namespace => {
        if (namespace.startsWith("cms.")) {
            return cmsBinding;
        }
        return null;
    }
};

const REASSIGN: IPermission[] = [{ name: "workflows", reassign: true }];

const createIdentityContext = (
    teamCount: number,
    permissions: IPermission[]
): IdentityContext.Interface => {
    const teams: ITeam[] = Array.from({ length: teamCount }, (_, index) => {
        return { id: `team-${index}`, slug: `team-${index}`, name: `Team ${index}` };
    });
    return createWorkflowsIdentityContext({ teams, permissions });
};

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
        rowProvider,
        initialTab: "assignedToMe"
    };
    return { presenter, activity, listReviews, params };
};

const ascendingPage = (count: number): ReviewWithFlags[] => {
    return Array.from({ length: count }, (_, index) => {
        return createReviewListItem({
            id: `a${index}`,
            lastChangedOn: new Date(Date.UTC(2026, 9, 16, 8, index)).toISOString()
        });
    });
};

describe("ReviewListPresenter", () => {
    it("loads the first page of the initial tab with its default sort", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([createReviewListItem({ id: "r1", title: "First" })]));

        await presenter.init(params);

        expect(listReviews).toHaveBeenCalledTimes(1);
        expect(listReviews).toHaveBeenCalledWith({
            list: "assignedToMe",
            where: {},
            sort: "lastChangedOn_ASC",
            limit: REVIEW_LIST_PAGE_SIZE,
            after: null
        });
        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.tab).toBe("assignedToMe");
        expect(presenter.vm.rows.map(row => row.title)).toEqual(["First"]);
    });

    it("renders row labels, owner, requester and the content type from the binding", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(
            page([
                createReviewListItem({
                    id: "r1",
                    stepTitle: "Legal check",
                    stepState: StepState.InReview,
                    owner: createActor({ id: "u-owner", displayName: "Marko Babić" }),
                    requester: createActor({ id: "u-req", displayName: "Maja Kos" }),
                    modelId: "article",
                    targetRevisionId: "e1#0002"
                })
            ])
        );

        await presenter.init(params);

        const row = presenter.vm.rows[0];
        expect(row.reviewStateLabel).toBe("In progress");
        expect(row.stepTitle).toBe("Legal check");
        expect(row.stepStateLabel).toBe("In review");
        expect(row.stepStateVariant).toBe("accent-light");
        expect(row.ownerLabel).toBe("Marko Babić");
        expect(row.requesterName).toBe("Maja Kos");
        expect(row.contentTypeLabel).toBe("Type article");
        expect(row.contentUrl).toBe("/cms/content-entries/article?id=e1#0002");
        expect(row.leaving).toBe(false);
        expect(row.highlighted).toBe(false);
    });

    it("gives an unbound namespace no link, no content type and no actions (R206)", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(
            page([
                createReviewListItem({
                    id: "bound",
                    namespace: "cms.article",
                    flags: { canStart: true }
                }),
                createReviewListItem({
                    id: "unbound",
                    namespace: "other.app",
                    flags: { canStart: true, canCancel: true }
                })
            ])
        );

        await presenter.init(params);

        const [bound, unbound] = presenter.vm.rows;
        expect(bound.contentUrl).not.toBeNull();
        expect(bound.actions.map(action => action.kind)).toEqual(["start"]);
        expect(unbound.contentUrl).toBeNull();
        expect(unbound.contentTypeLabel).toBeNull();
        expect(unbound.actions).toEqual([]);
    });

    it("resets sort, search and filters on a tab switch and sends the My requests filters only there", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([]));
        await presenter.init(params);

        await presenter.setSearch("  budget  ");
        await presenter.setContentType("article");
        await presenter.setReviewState(ReviewState.Approved);
        await presenter.setStepState(StepState.Failed);
        expect(listReviews).toHaveBeenLastCalledWith({
            list: "assignedToMe",
            where: { titleContains: "budget", modelId: "article" },
            sort: "lastChangedOn_ASC",
            limit: REVIEW_LIST_PAGE_SIZE,
            after: null
        });
        expect(presenter.vm.isFiltered).toBe(true);

        await presenter.setTab("myRequests");
        expect(listReviews).toHaveBeenLastCalledWith({
            list: "myRequests",
            where: {},
            sort: "lastChangedOn_DESC",
            limit: REVIEW_LIST_PAGE_SIZE,
            after: null
        });
        expect(presenter.vm.search).toBe("");
        expect(presenter.vm.contentTypeId).toBeNull();
        expect(presenter.vm.reviewState).toBeNull();
        expect(presenter.vm.stepState).toBeNull();

        await presenter.setReviewState(ReviewState.Approved);
        await presenter.setStepState(StepState.Awaiting);
        expect(listReviews).toHaveBeenLastCalledWith({
            list: "myRequests",
            where: { reviewState: ReviewState.Approved, stepState: StepState.Awaiting },
            sort: "lastChangedOn_DESC",
            limit: REVIEW_LIST_PAGE_SIZE,
            after: null
        });
    });

    it("does not refetch for an unchanged search and clears every filter", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([]));
        await presenter.init(params);

        await presenter.setSearch("");
        expect(listReviews).toHaveBeenCalledTimes(1);

        await presenter.setSearch("a");
        await presenter.setContentType("press");
        await presenter.clearFilters();

        expect(listReviews).toHaveBeenLastCalledWith({
            list: "assignedToMe",
            where: {},
            sort: "lastChangedOn_ASC",
            limit: REVIEW_LIST_PAGE_SIZE,
            after: null
        });
        expect(presenter.vm.isFiltered).toBe(false);
    });

    it("toggles the sort direction and reloads in that order", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([]));
        await presenter.init(params);

        await presenter.toggleSort();
        expect(presenter.vm.sort).toBe("lastChangedOn_DESC");
        expect(listReviews).toHaveBeenLastCalledWith(
            expect.objectContaining({ sort: "lastChangedOn_DESC", after: null })
        );

        await presenter.toggleSort();
        expect(presenter.vm.sort).toBe("lastChangedOn_ASC");
    });

    it("loads more by cursor, skips known rows and stops when the server has no more", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(
            page(
                [createReviewListItem({ id: "r1" }), createReviewListItem({ id: "r2" })],
                "c1",
                true
            )
        );
        listReviews.mockResolvedValueOnce(
            page(
                [createReviewListItem({ id: "r2" }), createReviewListItem({ id: "r3" })],
                null,
                false
            )
        );
        await presenter.init(params);
        expect(presenter.vm.hasMore).toBe(true);

        await presenter.loadMore();

        expect(listReviews).toHaveBeenLastCalledWith({
            list: "assignedToMe",
            where: {},
            sort: "lastChangedOn_ASC",
            limit: REVIEW_LIST_PAGE_SIZE,
            after: "c1"
        });
        expect(presenter.vm.rows.map(row => row.reviewId)).toEqual(["r1", "r2", "r3"]);
        expect(presenter.vm.hasMore).toBe(false);
        expect(presenter.vm.loadingMore).toBe(false);

        await presenter.loadMore();
        expect(listReviews).toHaveBeenCalledTimes(2);
    });

    it("keeps hasMore for a short or empty page the server says is not the end (R229)", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })], "c1", true));
        listReviews.mockResolvedValueOnce(page([], "c2", true));
        await presenter.init(params);
        expect(presenter.vm.hasMore).toBe(true);

        await presenter.loadMore();

        expect(presenter.vm.rows).toHaveLength(1);
        expect(presenter.vm.hasMore).toBe(true);
        expect(presenter.vm.empty).toBeNull();
    });

    it("keeps the rows and shows the message when loading more fails", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })], "c1", true));
        listReviews.mockRejectedValueOnce(new Error("network"));
        await presenter.init(params);

        await presenter.loadMore();

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.rows).toHaveLength(1);
        expect(presenter.vm.loadingMore).toBe(false);
        expect(presenter.vm.error).toBe("The server did not respond. Try again in a moment.");
    });

    it("fails with a message and retries through refresh", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockRejectedValueOnce(new Error("network"));
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));

        await presenter.init(params);
        expect(presenter.vm.status).toBe("failed");
        expect(presenter.vm.error).toBe("The server did not respond. Try again in a moment.");

        await presenter.refresh();
        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.error).toBeNull();
        expect(presenter.vm.rows).toHaveLength(1);
    });

    it("shows the tab empty state, the filtered empty state and none when rows exist", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([]));
        await presenter.init(params);
        expect(presenter.vm.empty).toEqual({
            title: "Nothing assigned to you",
            description: "Steps you own and are reviewing appear here."
        });

        await presenter.setSearch("nothing like this");
        expect(presenter.vm.empty).toEqual({
            title: "No reviews match these filters",
            description: ""
        });

        listReviews.mockResolvedValue(page([createReviewListItem({ id: "r1" })]));
        await presenter.clearFilters();
        expect(presenter.vm.empty).toBeNull();
    });

    it("tells a viewer in no team so on Team pool and Team in review only (QBZ-73)", async () => {
        const { presenter, listReviews, params } = setup(0);
        listReviews.mockResolvedValue(page([]));
        await presenter.init(params);
        expect(presenter.vm.empty?.title).toBe("Nothing assigned to you");

        await presenter.setTab("pool");
        expect(presenter.vm.empty).toEqual({
            title: "You’re not in a reviewing team",
            description: "Steps appear here once you’re added to a team that reviews content."
        });

        await presenter.setTab("teamInReview");
        expect(presenter.vm.empty?.title).toBe("You’re not in a reviewing team");

        await presenter.setTab("myRequests");
        expect(presenter.vm.empty?.title).toBe("You haven’t requested any reviews");

        await presenter.setTab("pool");
        await presenter.setSearch("x");
        expect(presenter.vm.empty?.title).toBe("No reviews match these filters");
    });

    it("keeps the normal empty state for a member of a team", async () => {
        const { presenter, listReviews, params } = setup(2);
        listReviews.mockResolvedValue(page([]));
        await presenter.init(params);

        await presenter.setTab("pool");

        expect(presenter.vm.empty?.title).toBe("Your team pools are empty");
    });

    it("ignores a signal for another namespace and refetches once per signal (R210)", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);

        activity.notify({
            namespace: "wb.page",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        await Promise.resolve();
        expect(listReviews).toHaveBeenCalledTimes(1);

        activity.notify({
            namespace: "cms.press",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));

        activity.notify({
            namespace: "cms.article",
            source: "own",
            reviewId: null,
            targetRevisionId: null
        });
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(3));
    });

    it("collapses signals that arrive during a refetch into one follow-up and never runs two at once", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);

        const first = createDeferred<ReviewListPage>();
        listReviews.mockReturnValueOnce(first.promise);
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));

        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        activity.notify({
            namespace: "cms.article",
            source: "own",
            reviewId: null,
            targetRevisionId: null
        });
        expect(listReviews).toHaveBeenCalledTimes(2);

        first.resolve(page([createReviewListItem({ id: "r1" })]));
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(3));
        await Promise.resolve();
        expect(listReviews).toHaveBeenCalledTimes(3);
    });

    it("queues a signal that arrives while loading and refetches once after the load (R210)", async () => {
        const { presenter, activity, listReviews, params } = setup();
        const first = createDeferred<ReviewListPage>();
        listReviews.mockReturnValueOnce(first.promise);
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));

        const loading = presenter.init(params);
        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        expect(listReviews).toHaveBeenCalledTimes(1);

        first.resolve(page([createReviewListItem({ id: "r1" })]));
        await loading;

        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));
        await Promise.resolve();
        expect(listReviews).toHaveBeenCalledTimes(2);
        expect(presenter.vm.status).toBe("ready");
    });

    it("does not refetch after a load when no signal arrived during it", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([createReviewListItem({ id: "r1" })]));

        await presenter.init(params);
        await Promise.resolve();

        expect(listReviews).toHaveBeenCalledTimes(1);
    });

    it("keeps the rows and the ready status when showing new reviews fails", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "old" })]));
        await presenter.init(params);
        listReviews.mockResolvedValueOnce(
            page([createReviewListItem({ id: "old" }), createReviewListItem({ id: "fresh" })])
        );
        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        await vi.waitFor(() => expect(presenter.vm.notice).not.toBeNull());
        listReviews.mockRejectedValueOnce(new Error("network"));

        await presenter.showNewReviews();

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.rows.map(row => row.reviewId)).toEqual(["old"]);
        expect(presenter.vm.error).not.toBeNull();
    });

    it("never polls", async () => {
        vi.useFakeTimers();
        try {
            const { presenter, listReviews, params } = setup();
            listReviews.mockResolvedValue(page([createReviewListItem({ id: "r1" })]));
            await presenter.init(params);

            await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

            expect(listReviews).toHaveBeenCalledTimes(1);
        } finally {
            vi.useRealTimers();
        }
    });

    it("refetches the whole loaded window, at least one page and at most the server maximum", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValue(page(ascendingPage(25), "c1", true));
        await presenter.init(params);

        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));

        expect(listReviews).toHaveBeenLastCalledWith(
            expect.objectContaining({ limit: 25, after: null })
        );
    });

    it("updates rows in place, highlights them, marks vanished rows as leaving and holds new rows back", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(
            page([
                createReviewListItem({ id: "keep", stepState: StepState.Awaiting }),
                createReviewListItem({ id: "same" }),
                createReviewListItem({ id: "gone", stepState: StepState.Awaiting })
            ])
        );
        await presenter.init(params);

        listReviews.mockResolvedValueOnce(
            page([
                createReviewListItem({
                    id: "keep",
                    stepState: StepState.InReview,
                    owner: createActor({ id: "u-owner", displayName: "Marko Babić" })
                }),
                createReviewListItem({ id: "same" }),
                createReviewListItem({ id: "fresh", title: "Brand new" })
            ])
        );
        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        await vi.waitFor(() => expect(presenter.vm.notice).not.toBeNull());

        const rows = presenter.vm.rows;
        expect(rows.map(row => row.reviewId)).toEqual(["keep", "same", "gone"]);
        expect(rows[0].stepStateLabel).toBe("In review");
        expect(rows[0].ownerLabel).toBe("Marko Babić");
        expect(rows[0].leaving).toBe(false);
        expect(rows[0].highlighted).toBe(true);
        expect(rows[1].highlighted).toBe(false);
        expect(rows[2].leaving).toBe(true);
        expect(presenter.vm.notice).toBe("New reviews are available.");

        presenter.removeLeavingRow("gone");
        expect(presenter.vm.rows.map(row => row.reviewId)).toEqual(["keep", "same"]);
    });

    it("keeps a row the refetch window pushed out when the server has more (new row on a full page)", async () => {
        const { presenter, activity, listReviews, params } = setup();
        const loaded = ascendingPage(20);
        listReviews.mockResolvedValueOnce(page(loaded, "c1", true));
        await presenter.init(params);

        const brandNew = createReviewListItem({
            id: "newest",
            lastChangedOn: new Date(Date.UTC(2026, 9, 16, 7, 0)).toISOString()
        });
        listReviews.mockResolvedValueOnce(page([brandNew, ...loaded.slice(0, 19)], "c1", true));
        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        await vi.waitFor(() => expect(presenter.vm.notice).not.toBeNull());

        const rows = presenter.vm.rows;
        expect(rows).toHaveLength(20);
        expect(rows.every(row => !row.leaving)).toBe(true);
        expect(rows[19].reviewId).toBe("a19");
    });

    it("still marks a row that vanished inside the refetch window as leaving when the server has more", async () => {
        const { presenter, activity, listReviews, params } = setup();
        const loaded = ascendingPage(20);
        listReviews.mockResolvedValueOnce(page(loaded, "c1", true));
        await presenter.init(params);

        const withoutFifth = loaded.filter(item => item.review.id !== "a5");
        listReviews.mockResolvedValueOnce(page(withoutFifth, "c1", true));
        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        await vi.waitFor(() => {
            expect(presenter.vm.rows.find(row => row.reviewId === "a5")?.leaving).toBe(true);
        });

        expect(presenter.vm.rows.filter(row => row.leaving)).toHaveLength(1);
    });

    it("marks a vanished last row as leaving when the server has no more", async () => {
        const { presenter, activity, listReviews, params } = setup();
        const loaded = ascendingPage(3);
        listReviews.mockResolvedValueOnce(page(loaded, null, false));
        await presenter.init(params);

        listReviews.mockResolvedValueOnce(page(loaded.slice(0, 2), null, false));
        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });

        await vi.waitFor(() => {
            expect(presenter.vm.rows.find(row => row.reviewId === "a2")?.leaving).toBe(true);
        });
    });

    it("shows new reviews by reloading the first page, highlighted, and clears the notice", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "old" })]));
        await presenter.init(params);
        listReviews.mockResolvedValueOnce(
            page([createReviewListItem({ id: "old" }), createReviewListItem({ id: "fresh" })])
        );
        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        await vi.waitFor(() => expect(presenter.vm.notice).not.toBeNull());

        listReviews.mockResolvedValueOnce(
            page([createReviewListItem({ id: "fresh" }), createReviewListItem({ id: "old" })])
        );
        await presenter.showNewReviews();

        expect(listReviews).toHaveBeenLastCalledWith(
            expect.objectContaining({ limit: REVIEW_LIST_PAGE_SIZE, after: null })
        );
        expect(presenter.vm.notice).toBeNull();
        expect(presenter.vm.rows.map(row => row.reviewId)).toEqual(["fresh", "old"]);
        expect(presenter.vm.rows.map(row => row.highlighted)).toEqual([true, false]);
    });

    it("keeps the visible rows when a background refetch fails", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);
        listReviews.mockRejectedValueOnce(new Error("network"));

        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));
        await Promise.resolve();

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.rows).toHaveLength(1);
        expect(presenter.vm.error).toBeNull();
    });

    it("opens a row dialog, closes it and turns a finished action into one own signal and one refetch", async () => {
        const { presenter, activity, listReviews, params } = setup();
        const notify = vi.spyOn(activity, "notify");
        listReviews.mockResolvedValue(
            page([createReviewListItem({ id: "r1", stepId: "step-7", flags: { canStart: true } })])
        );
        await presenter.init(params);

        presenter.openRowAction("r1", "start", "step-7");
        expect(presenter.vm.dialog).toEqual({
            kind: "start",
            namespace: "cms.article",
            reviewId: "r1",
            stepId: "step-7"
        });

        presenter.closeDialog();
        expect(presenter.vm.dialog).toBeNull();

        presenter.openDetails("r1");
        expect(presenter.vm.dialog).toEqual({
            kind: "details",
            namespace: "cms.article",
            reviewId: "r1",
            stepId: null
        });

        presenter.openRowAction("r1", "takeOver", "step-7");
        presenter.actionDone();

        expect(presenter.vm.dialog).toBeNull();
        expect(notify).toHaveBeenCalledTimes(1);
        expect(notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "own",
            reviewId: "r1",
            targetRevisionId: null
        });
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));
    });

    it("ignores an unknown row and the request kind when opening a dialog", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);

        presenter.openRowAction("missing", "start", null);
        presenter.openRowAction("r1", "request", null);
        presenter.openDetails("missing");

        expect(presenter.vm.dialog).toBeNull();
    });

    it("unsubscribes on dispose and ignores a response that arrives afterwards", async () => {
        const { presenter, activity, listReviews, params } = setup();
        const pending = createDeferred<ReviewListPage>();
        listReviews.mockReturnValueOnce(pending.promise);

        const initializing = presenter.init(params);
        presenter.dispose();
        pending.resolve(page([createReviewListItem({ id: "late" })]));
        await initializing;

        expect(presenter.vm.rows).toEqual([]);

        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        await Promise.resolve();
        expect(listReviews).toHaveBeenCalledTimes(1);
    });

    it("keeps refreshing after a reload that superseded an in-flight refetch", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);

        const stale = createDeferred<ReviewListPage>();
        listReviews.mockReturnValueOnce(stale.promise);
        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        expect(listReviews).toHaveBeenCalledTimes(2);

        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r2" })]));
        await presenter.setTab("pool");
        stale.resolve(page([createReviewListItem({ id: "stale" })]));
        await Promise.resolve();

        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r3" })]));
        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        await vi.waitFor(() => expect(presenter.vm.notice).not.toBeNull());

        // The stale response never applied; the fresh refetch held r3 back and faded r2.
        expect(presenter.vm.rows.map(row => row.reviewId)).toEqual(["r2"]);
        expect(presenter.vm.rows[0].leaving).toBe(true);
    });

    it("keeps two presenters independent", async () => {
        const first = setup();
        const second = setup();
        first.listReviews.mockResolvedValue(page([createReviewListItem({ id: "a" })]));
        second.listReviews.mockResolvedValue(page([createReviewListItem({ id: "b" })]));

        await first.presenter.init(first.params);
        await second.presenter.init(second.params);
        await second.presenter.setTab("pool");

        expect(first.presenter.vm.tab).toBe("assignedToMe");
        expect(second.presenter.vm.tab).toBe("pool");
        expect(first.presenter.vm.rows.map(row => row.reviewId)).toEqual(["a"]);
        expect(second.presenter.vm.rows.map(row => row.reviewId)).toEqual(["b"]);
    });

    describe("Failed steps tab (QBZ-29, QBZ-69, R259)", () => {
        const TAB_LABELS = ["Assigned to me", "Team pool", "Team in review", "My requests"];

        interface PermissionCase {
            permissions: IPermission[];
            failedSteps: boolean;
        }

        const createFailedItem = (id: string) => {
            return createReviewListItem({
                id,
                stepId: "step-5",
                stepTitle: "AI tone check",
                stepState: StepState.Failed,
                owner: createActor({ id: "ai-1", displayName: "gpt-model", type: "ai" }),
                flags: { canRestart: true, canCancel: true }
            });
        };

        it("lists four tabs without reassign and five with it, over several roles, workflows.* and *", async () => {
            const cases: PermissionCase[] = [
                { permissions: [], failedSteps: false },
                { permissions: [{ name: "workflows", editor: true }], failedSteps: false },
                { permissions: [{ name: "workflows", reassign: true }], failedSteps: true },
                { permissions: [{ name: "workflows.*" }], failedSteps: true },
                { permissions: [{ name: "*" }], failedSteps: true },
                {
                    permissions: [
                        { name: "workflows", editor: true },
                        { name: "workflows", reassign: true }
                    ],
                    failedSteps: true
                }
            ];

            for (const current of cases) {
                const { presenter, listReviews, params } = setup(1, current.permissions);
                listReviews.mockResolvedValue(page([]));
                await presenter.init(params);

                const labels = presenter.vm.tabs.map(tab => tab.label);
                if (current.failedSteps) {
                    expect(labels).toEqual([...TAB_LABELS, "Failed steps"]);
                } else {
                    expect(labels).toEqual(TAB_LABELS);
                }
            }
        });

        it("starts on the default tab when the route asks for Failed steps without permission", async () => {
            const { presenter, listReviews, params } = setup();
            listReviews.mockResolvedValue(page([]));

            await presenter.init({ ...params, initialTab: "failedSteps" });

            expect(presenter.vm.tab).toBe("assignedToMe");
            expect(listReviews).toHaveBeenCalledTimes(1);
            expect(listReviews).toHaveBeenCalledWith({
                list: "assignedToMe",
                where: {},
                sort: "lastChangedOn_ASC",
                limit: REVIEW_LIST_PAGE_SIZE,
                after: null
            });
        });

        it("starts on Failed steps for a viewer with reassign, oldest first", async () => {
            const { presenter, listReviews, params } = setup(1, REASSIGN);
            listReviews.mockResolvedValue(page([]));

            await presenter.init({ ...params, initialTab: "failedSteps" });

            expect(presenter.vm.tab).toBe("failedSteps");
            expect(presenter.vm.sort).toBe("lastChangedOn_ASC");
            expect(listReviews).toHaveBeenCalledTimes(1);
            expect(listReviews).toHaveBeenCalledWith({
                list: "failedSteps",
                where: {},
                sort: "lastChangedOn_ASC",
                limit: REVIEW_LIST_PAGE_SIZE,
                after: null
            });
        });

        it("refuses to switch to Failed steps without permission and sends no request", async () => {
            const { presenter, listReviews, params } = setup(1, [
                { name: "workflows", editor: true }
            ]);
            listReviews.mockResolvedValue(page([]));
            await presenter.init(params);

            await presenter.setTab("failedSteps");

            expect(presenter.vm.tab).toBe("assignedToMe");
            expect(listReviews).toHaveBeenCalledTimes(1);
        });

        it("switches to Failed steps with permission and sends the search and the content type but never a state filter", async () => {
            const { presenter, listReviews, params } = setup(1, REASSIGN);
            listReviews.mockResolvedValue(page([]));
            await presenter.init(params);

            await presenter.setTab("failedSteps");

            expect(listReviews).toHaveBeenLastCalledWith({
                list: "failedSteps",
                where: {},
                sort: "lastChangedOn_ASC",
                limit: REVIEW_LIST_PAGE_SIZE,
                after: null
            });
            expect(presenter.vm.empty).toEqual({
                title: "No failed steps",
                description: "AI and automation steps that hit a technical error appear here."
            });

            await presenter.setSearch("  tone  ");
            await presenter.setContentType("article");
            await presenter.setReviewState(ReviewState.Approved);
            await presenter.setStepState(StepState.Awaiting);

            expect(listReviews).toHaveBeenLastCalledWith({
                list: "failedSteps",
                where: { titleContains: "tone", modelId: "article" },
                sort: "lastChangedOn_ASC",
                limit: REVIEW_LIST_PAGE_SIZE,
                after: null
            });
            expect(presenter.vm.empty?.title).toBe("No reviews match these filters");
        });

        it("resets the sort when leaving Failed steps for My requests", async () => {
            const { presenter, listReviews, params } = setup(1, REASSIGN);
            listReviews.mockResolvedValue(page([]));
            await presenter.init({ ...params, initialTab: "failedSteps" });
            await presenter.toggleSort();
            expect(presenter.vm.sort).toBe("lastChangedOn_DESC");

            await presenter.setTab("failedSteps");
            expect(presenter.vm.sort).toBe("lastChangedOn_ASC");

            await presenter.setTab("myRequests");
            expect(presenter.vm.sort).toBe("lastChangedOn_DESC");
        });

        it("renders a failed row with the Failed tag, the step title as owner and Restart and Cancel review", async () => {
            const { presenter, listReviews, params } = setup(1, REASSIGN);
            listReviews.mockResolvedValue(page([createFailedItem("f1")]));

            await presenter.init({ ...params, initialTab: "failedSteps" });

            const row = presenter.vm.rows[0];
            expect(row.stepStateLabel).toBe("Failed");
            expect(row.stepStateVariant).toBe("destructive");
            expect(row.stepTitle).toBe("AI tone check");
            expect(row.ownerLabel).toBe("AI tone check");
            expect(row.actions.map(action => action.kind).sort()).toEqual(["cancel", "restart"]);
            const restart = row.actions.find(action => action.kind === "restart");
            expect(restart?.label).toBe("Restart");
            expect(restart?.stepId).toBe("step-5");
        });

        it("opens the restart dialog of a row and, once it is done, refetches once and lets the row leave", async () => {
            const { presenter, listReviews, params } = setup(1, REASSIGN);
            listReviews.mockResolvedValueOnce(page([createFailedItem("f1")]));
            await presenter.init({ ...params, initialTab: "failedSteps" });

            presenter.openRowAction("f1", "restart", "step-5");

            expect(presenter.vm.dialog).toEqual({
                kind: "restart",
                namespace: "cms.article",
                reviewId: "f1",
                stepId: "step-5"
            });

            listReviews.mockResolvedValueOnce(page([]));
            presenter.actionDone();

            expect(presenter.vm.dialog).toBeNull();
            await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));
            expect(listReviews).toHaveBeenLastCalledWith(
                expect.objectContaining({ list: "failedSteps" })
            );
            await vi.waitFor(() => expect(presenter.vm.rows[0].leaving).toBe(true));
        });
    });

    describe("search draft", () => {
        afterEach(() => {
            vi.useRealTimers();
        });

        it("updates the draft at once and applies the search after 300 ms without typing", async () => {
            const { presenter, listReviews, params } = setup();
            listReviews.mockResolvedValue(page([]));
            await presenter.init(params);
            vi.useFakeTimers();

            presenter.setSearchDraft("bud");
            await vi.advanceTimersByTimeAsync(200);
            presenter.setSearchDraft("budget");
            expect(presenter.vm.searchDraft).toBe("budget");
            await vi.advanceTimersByTimeAsync(299);
            expect(presenter.vm.search).toBe("");
            expect(listReviews).toHaveBeenCalledTimes(1);

            await vi.advanceTimersByTimeAsync(1);

            expect(presenter.vm.search).toBe("budget");
            expect(listReviews).toHaveBeenCalledTimes(2);
            expect(listReviews).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ titleContains: "budget" })
                })
            );
        });

        it("does not apply a draft equal to the applied search", async () => {
            const { presenter, listReviews, params } = setup();
            listReviews.mockResolvedValue(page([]));
            await presenter.init(params);
            vi.useFakeTimers();

            presenter.setSearchDraft("");
            await vi.advanceTimersByTimeAsync(1000);

            expect(listReviews).toHaveBeenCalledTimes(1);
        });

        it("resets the draft on a tab switch and clears the timer on dispose", async () => {
            const { presenter, listReviews, params } = setup();
            listReviews.mockResolvedValue(page([]));
            await presenter.init(params);
            vi.useFakeTimers();

            presenter.setSearchDraft("pending");
            await presenter.setTab("pool");
            expect(presenter.vm.searchDraft).toBe("");
            await vi.advanceTimersByTimeAsync(1000);
            expect(presenter.vm.search).toBe("");

            presenter.setSearchDraft("again");
            presenter.dispose();
            await vi.advanceTimersByTimeAsync(1000);

            expect(listReviews).toHaveBeenCalledTimes(2);
        });
    });

    it("drops a vanished row at once when the viewer prefers reduced motion", async () => {
        vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
        const { presenter, listReviews, activity, params } = setup();
        listReviews.mockResolvedValueOnce(page(ascendingPage(2)));
        listReviews.mockResolvedValueOnce(page(ascendingPage(1)));
        await presenter.init(params);

        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });

        await vi.waitFor(() => expect(presenter.vm.rows).toHaveLength(1));
        expect(presenter.vm.rows[0].leaving).toBe(false);
        vi.unstubAllGlobals();
    });
});
