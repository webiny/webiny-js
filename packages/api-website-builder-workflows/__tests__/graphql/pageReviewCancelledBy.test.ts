import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { requestPageReview } from "~tests/__helpers/engine.js";
import { storeWbWorkflow } from "~tests/__helpers/engine.js";
import { ADMIN } from "~tests/__helpers/identities.js";
import { REASSIGNER } from "~tests/__helpers/identities.js";
import { REQUESTER } from "~tests/__helpers/identities.js";
import { REVIEWER } from "~tests/__helpers/identities.js";
import { WB_READER } from "~tests/__helpers/identities.js";
import { WB_WRITER } from "~tests/__helpers/identities.js";
import { WORKFLOWS_REASSIGN } from "~tests/__helpers/identities.js";
import { asGraphQLUser } from "~tests/__helpers/graphql.js";

const ERROR = "error { code message data }";
const REVIEW = "id state isActive cancelledBy { id displayName }";

const GET_REVIEW = /* GraphQL */ `
    query GetReview($id: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageReview(id: $id) {
                data { review { ${REVIEW} } }
                ${ERROR}
            }
        }
    }
`;

const CANCEL_REVIEW = /* GraphQL */ `
    mutation CancelReview($reviewId: ID!) {
        websiteBuilder {
            cancelWebsiteBuilderPageReview(reviewId: $reviewId) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const CANCEL_REVIEWS_FOR_DELETE = /* GraphQL */ `
    mutation CancelReviewsForDelete($pageId: ID!, $action: WorkflowsReviewsForDeleteAction!) {
        websiteBuilder {
            cancelWebsiteBuilderPageReviewsForDelete(pageId: $pageId, action: $action) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...WB_READER];

/** Admin stores the pages workflow; REQUESTER has a review of "Page A". */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const review = await requestPageReview(admin, page);
    return { page, review };
};

describe("WB review cancelledBy (R252, Q23)", () => {
    it("reads null while the review is in progress", async () => {
        const { review } = await createScenario();
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const body = await reviewer.run(GET_REVIEW, { id: review.id });

        expect(body.errors).toBeUndefined();
        const result = body.data.websiteBuilder.getWebsiteBuilderPageReview;
        expect(result.error).toBeNull();
        expect(result.data.review).toMatchObject({ state: "inProgress", cancelledBy: null });
    });

    it("returns the requester as cancelledBy of their own cancel, and on a later read by someone else", async () => {
        const { review } = await createScenario();
        const requester = asGraphQLUser({ identity: REQUESTER, permissions: WB_WRITER });
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });
        const expected = { id: REQUESTER.id, displayName: REQUESTER.displayName };

        const cancelled = await requester.run(CANCEL_REVIEW, { reviewId: review.id });
        const read = await reviewer.run(GET_REVIEW, { id: review.id });

        expect(cancelled.errors).toBeUndefined();
        const cancelResult = cancelled.data.websiteBuilder.cancelWebsiteBuilderPageReview;
        expect(cancelResult.error).toBeNull();
        expect(cancelResult.data).toMatchObject({
            state: "cancelled",
            isActive: false,
            cancelledBy: expected
        });
        expect(read.errors).toBeUndefined();
        const readResult = read.data.websiteBuilder.getWebsiteBuilderPageReview;
        expect(readResult.data.review.cancelledBy).toEqual(expected);
    });

    it("returns the user with reassign who cancels a review requested by someone else", async () => {
        const { review } = await createScenario();
        const reassigner = asGraphQLUser({
            identity: REASSIGNER,
            permissions: REASSIGNER_PERMISSIONS
        });

        const cancelled = await reassigner.run(CANCEL_REVIEW, { reviewId: review.id });

        expect(cancelled.errors).toBeUndefined();
        const result = cancelled.data.websiteBuilder.cancelWebsiteBuilderPageReview;
        expect(result.error).toBeNull();
        expect(result.data.cancelledBy).toEqual({
            id: REASSIGNER.id,
            displayName: REASSIGNER.displayName
        });
    });

    it("returns the caller of the delete-time cancel", async () => {
        const { page, review } = await createScenario();
        const admin = asGraphQLUser();

        const cancelled = await admin.run(CANCEL_REVIEWS_FOR_DELETE, {
            pageId: page.entryId,
            action: "trash"
        });

        expect(cancelled.errors).toBeUndefined();
        const result = cancelled.data.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete;
        expect(result.error).toBeNull();
        expect(result.data).toEqual([
            {
                id: review.id,
                state: "cancelled",
                isActive: false,
                cancelledBy: { id: ADMIN.id, displayName: ADMIN.displayName }
            }
        ]);
    });
});
