import { describe, expect, it } from "vitest";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { requestPageReview, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import { REQUESTER, REVIEWER, WB_READER, WB_WRITER } from "~tests/__helpers/identities.js";
import { asGraphQLUser, LIST_REVIEWS } from "~tests/__helpers/graphql.js";

interface ListedRow {
    review: { id: string };
}

const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const otherPage = await createPage(admin, { title: "Page B" });
    const review = await requestPageReview(admin, page);
    // The order tests compare `lastChangedOn`; keep the two requests in different milliseconds.
    await new Promise(resolve => setTimeout(resolve, 5));
    const otherReview = await requestPageReview(admin, otherPage);
    const cmsReview = await createCmsReview(admin);
    return { review, otherReview, cmsReview };
};

const ids = (rows: ListedRow[]): string[] => {
    return rows.map(row => row.review.id);
};

describe("WB review lists through GraphQL", () => {
    it("lists only page reviews, with flags and meta (R46, D133)", async () => {
        const { review, otherReview, cmsReview } = await createScenario();
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const body = await reviewer.run(LIST_REVIEWS, { list: "pool" });
        const result = body.data.websiteBuilder.listWebsiteBuilderPageReviews;

        expect(result.error).toBeNull();
        expect(ids(result.data)).toEqual([review.id, otherReview.id]);
        expect(ids(result.data)).not.toContain(cmsReview.id);
        expect(result.data[0].flags.canStart).toBe(true);
        expect(result.meta.hasMoreItems).toBe(false);
    });

    it("pages with limit and after", async () => {
        const { review, otherReview } = await createScenario();
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const first = await reviewer.run(LIST_REVIEWS, { list: "pool", limit: 1 });
        const firstResult = first.data.websiteBuilder.listWebsiteBuilderPageReviews;
        const second = await reviewer.run(LIST_REVIEWS, {
            list: "pool",
            limit: 1,
            after: firstResult.meta.cursor
        });
        const secondResult = second.data.websiteBuilder.listWebsiteBuilderPageReviews;

        expect(ids(firstResult.data)).toEqual([review.id]);
        expect(firstResult.meta.hasMoreItems).toBe(true);
        expect(ids(secondResult.data)).toEqual([otherReview.id]);
        expect(secondResult.meta.hasMoreItems).toBe(false);
    });

    it("filters my requests by state and title, sorted as asked", async () => {
        const { review, otherReview } = await createScenario();
        const requester = asGraphQLUser({ identity: REQUESTER, permissions: WB_WRITER });

        const newestFirst = await requester.run(LIST_REVIEWS, {
            list: "myRequests",
            where: { reviewState: "inProgress" }
        });
        const oldestFirst = await requester.run(LIST_REVIEWS, {
            list: "myRequests",
            sort: "lastChangedOn_ASC"
        });
        const byTitle = await requester.run(LIST_REVIEWS, {
            list: "myRequests",
            where: { titleContains: "Page B" }
        });

        expect(ids(newestFirst.data.websiteBuilder.listWebsiteBuilderPageReviews.data)).toEqual([
            otherReview.id,
            review.id
        ]);
        expect(ids(oldestFirst.data.websiteBuilder.listWebsiteBuilderPageReviews.data)).toEqual([
            review.id,
            otherReview.id
        ]);
        expect(ids(byTitle.data.websiteBuilder.listWebsiteBuilderPageReviews.data)).toEqual([
            otherReview.id
        ]);
    });

    it("returns the list errors with code, data and a null meta", async () => {
        await createScenario();
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const failed = await reviewer.run(LIST_REVIEWS, { list: "failedSteps" });
        const stateFilter = await reviewer.run(LIST_REVIEWS, {
            list: "pool",
            where: { stepState: "awaiting" }
        });

        expect(failed.data.websiteBuilder.listWebsiteBuilderPageReviews).toEqual({
            data: null,
            meta: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: expect.any(String),
                data: { action: "list failed steps" }
            }
        });
        const stateResult = stateFilter.data.websiteBuilder.listWebsiteBuilderPageReviews;
        expect(stateResult.meta).toBeNull();
        expect(stateResult.error.code).toBe("Workflows/Review/Validation");
    });
});
