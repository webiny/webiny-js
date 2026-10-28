import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import { ReviewActivity as ReviewActivityAbstraction } from "~/review/activity/abstractions.js";
import { ReviewActivity } from "~/review/activity/ReviewActivity.js";
import { StepState } from "~/review/domain/StepState.js";
import { REVIEW_WIDGET_PAGE_SIZE } from "~/review/domain/constants.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { ReviewWidgetPresenter } from "./abstractions.js";
import type { ReviewWidgetKind } from "./abstractions.js";
import type { ReviewWidgetInitParams } from "./abstractions.js";
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
            getContentUrl: ref =>
                `/cms/content-entries/${ref.contentTypeId}?id=${ref.targetRevisionId}`,
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

describe("ReviewWidgetPresenter", () => {
    it("loads the assigned-to-me segment of 'For me to review', oldest first, five rows", async () => {
        const { presenter, listReviews, params } = setup("forMe");
        listReviews.execute.mockResolvedValue(
            page([createReviewListItem({ id: "r1", title: "Mine" })])
        );

        await presenter.init(params);

        expect(listReviews.execute).toHaveBeenCalledWith({
            app: "cms",
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
        listReviews.execute.mockResolvedValue(page([]));
        await presenter.init(params);

        await presenter.setTab("pool");

        expect(presenter.vm.tab).toBe("pool");
        expect(listReviews.execute).toHaveBeenLastCalledWith(
            expect.objectContaining({ list: "pool", sort: "lastChangedOn_ASC" })
        );
    });

    it("loads My requests newest first and has no segment", async () => {
        const { presenter, listReviews, params } = setup("myRequests");
        listReviews.execute.mockResolvedValue(page([]));

        await presenter.init(params);

        expect(presenter.vm.tab).toBeNull();
        expect(listReviews.execute).toHaveBeenCalledWith(
            expect.objectContaining({ list: "myRequests", sort: "lastChangedOn_DESC" })
        );

        await presenter.setTab("pool");
        expect(listReviews.execute).toHaveBeenCalledTimes(1);
    });

    it("builds render-ready rows with a step line, link and state", async () => {
        const { presenter, listReviews, params } = setup("forMe");
        listReviews.execute.mockResolvedValue(
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
        expect(bound.stepTitle).toBe("Legal check");
        expect(bound.contentType).toBe("Type article");
        expect(bound.app).toBe("Headless CMS");
        expect(bound.stepColor).toBe("#FA5723");
        expect(bound.stateLabel).toBe("In review");
        expect(bound.stateVariant).toBe("accent-light");
        expect(bound.contentUrl).toBe("/cms/content-entries/article?id=e1#0001");
        expect(unbound.stepTitle).toBe("Review");
        expect(unbound.contentType).toBeNull();
        expect(unbound.contentUrl).toBeNull();
    });

    it("gives a row without a current step no title and no colour", async () => {
        const { presenter, listReviews, params } = setup("forMe");
        const item = createReviewListItem({ id: "r1" });
        item.review.currentStepId = "gone";
        listReviews.execute.mockResolvedValue(page([item]));

        await presenter.init(params);

        expect(presenter.vm.rows[0].stepTitle).toBeNull();
        expect(presenter.vm.rows[0].stepColor).toBeNull();
    });

    it("marks an empty result as empty and reports whether the viewer is in a team", async () => {
        const inTeam = setup("myRequests", 1);
        inTeam.listReviews.execute.mockResolvedValue(page([]));
        await inTeam.presenter.init(inTeam.params);

        expect(inTeam.presenter.vm.empty).toBe(true);
        expect(inTeam.presenter.vm.status).toBe("ready");
        expect(inTeam.presenter.vm.hasTeams).toBe(true);

        const noTeam = setup("forMe", 0);
        noTeam.listReviews.execute.mockResolvedValue(page([]));
        await noTeam.presenter.init(noTeam.params);

        expect(noTeam.presenter.vm.hasTeams).toBe(false);
    });

    it("fails, then retries with a skeleton through refresh", async () => {
        const { presenter, listReviews, params } = setup("forMe");
        listReviews.execute.mockRejectedValueOnce(new Error("network"));
        listReviews.execute.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));

        await presenter.init(params);
        expect(presenter.vm.status).toBe("failed");
        expect(presenter.vm.empty).toBe(false);

        await presenter.refresh();
        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.rows).toHaveLength(1);
    });

    it("refreshes on own and remote signals of its namespaces and ignores others", async () => {
        const { presenter, activity, listReviews, params } = setup("forMe");
        listReviews.execute.mockResolvedValue(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);

        activity.notify({
            namespace: "wb.page",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        await Promise.resolve();
        expect(listReviews.execute).toHaveBeenCalledTimes(1);

        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        await vi.waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(2));

        activity.notify({
            namespace: "cms.article",
            source: "own",
            reviewId: null,
            targetRevisionId: null
        });
        await vi.waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(3));
    });

    it("queues a signal that arrives while loading and refreshes once after the load (R210)", async () => {
        const { presenter, activity, listReviews, params } = setup("forMe");
        const first = createDeferred<ReviewListPage>();
        listReviews.execute.mockReturnValueOnce(first.promise);
        listReviews.execute.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));

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
        expect(listReviews.execute).toHaveBeenCalledTimes(1);

        first.resolve(page([]));
        await loading;

        await vi.waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(2));
        await Promise.resolve();
        expect(listReviews.execute).toHaveBeenCalledTimes(2);
        await vi.waitFor(() => expect(presenter.vm.rows).toHaveLength(1));
    });

    it("does not refresh after a load when no signal arrived during it", async () => {
        const { presenter, listReviews, params } = setup("forMe");
        listReviews.execute.mockResolvedValue(page([createReviewListItem({ id: "r1" })]));

        await presenter.init(params);
        await Promise.resolve();

        expect(listReviews.execute).toHaveBeenCalledTimes(1);
    });

    it("keeps the rows during a refresh and applies the result", async () => {
        const { presenter, activity, listReviews, params } = setup("forMe");
        listReviews.execute.mockResolvedValueOnce(
            page([createReviewListItem({ id: "r1", title: "Old" })])
        );
        await presenter.init(params);

        const pending = createDeferred<ReviewListPage>();
        listReviews.execute.mockReturnValueOnce(pending.promise);
        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.rows.map(row => row.title)).toEqual(["Old"]);

        pending.resolve(page([createReviewListItem({ id: "r2", title: "New" })]));
        await vi.waitFor(() => expect(presenter.vm.rows.map(row => row.title)).toEqual(["New"]));
    });

    it("collapses signals during a refresh into one follow-up", async () => {
        const { presenter, activity, listReviews, params } = setup("forMe");
        listReviews.execute.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);

        const pending = createDeferred<ReviewListPage>();
        listReviews.execute.mockReturnValueOnce(pending.promise);
        listReviews.execute.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));
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
        expect(listReviews.execute).toHaveBeenCalledTimes(2);

        pending.resolve(page([createReviewListItem({ id: "r1" })]));
        await vi.waitFor(() => expect(listReviews.execute).toHaveBeenCalledTimes(3));
        await Promise.resolve();
        expect(listReviews.execute).toHaveBeenCalledTimes(3);
    });

    it("keeps refreshing after a tab switch superseded an in-flight refresh", async () => {
        const { presenter, activity, listReviews, params } = setup("forMe");
        listReviews.execute.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);

        const stale = createDeferred<ReviewListPage>();
        listReviews.execute.mockReturnValueOnce(stale.promise);
        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });

        listReviews.execute.mockResolvedValueOnce(page([createReviewListItem({ id: "r2" })]));
        await presenter.setTab("pool");
        stale.resolve(page([createReviewListItem({ id: "stale" })]));
        await Promise.resolve();

        listReviews.execute.mockResolvedValueOnce(page([createReviewListItem({ id: "r3" })]));
        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        await vi.waitFor(() => expect(presenter.vm.rows.map(row => row.reviewId)).toEqual(["r3"]));
    });

    it("keeps two presenters of one container independent (transient)", async () => {
        const { container, listReviews, params } = setup("forMe");
        listReviews.execute.mockResolvedValue(page([createReviewListItem({ id: "a" })]));
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
        listReviews.execute.mockReturnValueOnce(pending.promise);

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
        expect(listReviews.execute).toHaveBeenCalledTimes(1);
    });
});
