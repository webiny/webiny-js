import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry } from "~tests/__helpers/entries.js";
import { expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createGraphQLClient } from "~tests/__helpers/graphql.js";
import { ADMIN } from "~tests/__helpers/identities.js";
import { REASSIGNER } from "~tests/__helpers/identities.js";
import { REQUESTER } from "~tests/__helpers/identities.js";
import { REVIEWER } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import { CMS_WRITER } from "~tests/__helpers/permissions.js";
import { WORKFLOWS_REASSIGN } from "~tests/__helpers/permissions.js";

const ERROR = "error { code message data }";
const REVIEW = "id state isActive cancelledBy { id displayName }";

const GET_REVIEW = /* GraphQL */ `
    query GetReview($id: ID!) {
        cms {
            getCmsEntryReview(id: $id) {
                data { review { ${REVIEW} } }
                ${ERROR}
            }
        }
    }
`;

const CANCEL_REVIEW = /* GraphQL */ `
    mutation CancelReview($reviewId: ID!) {
        cms {
            cancelCmsEntryReview(reviewId: $reviewId) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const CANCEL_REVIEWS_FOR_DELETE = /* GraphQL */ `
    mutation CancelReviewsForDelete(
        $modelId: ID!
        $entryId: ID!
        $action: WorkflowsReviewsForDeleteAction!
    ) {
        cms {
            cancelCmsEntryReviewsForDelete(modelId: $modelId, entryId: $entryId, action: $action) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...CMS_READER];

/** Admin stores the workflow; REQUESTER has a review of "Ann". */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const review = await requestEntryReview(admin, entry);
    return { entry, review };
};

describe("CMS review cancelledBy (R252, Q23)", () => {
    it("reads null while the review is in progress", async () => {
        const { review } = await createScenario();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });

        const body = await reviewer(GET_REVIEW, { id: review.id });

        expect(body.errors).toBeUndefined();
        const result = body.data.cms.getCmsEntryReview;
        expect(result.error).toBeNull();
        expect(result.data.review).toMatchObject({ state: "inProgress", cancelledBy: null });
    });

    it("returns the requester as cancelledBy of their own cancel, and on a later read by someone else", async () => {
        const { review } = await createScenario();
        const requester = createGraphQLClient({ identity: REQUESTER, permissions: CMS_WRITER });
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });
        const expected = { id: REQUESTER.id, displayName: REQUESTER.displayName };

        const cancelled = await requester(CANCEL_REVIEW, { reviewId: review.id });
        const read = await reviewer(GET_REVIEW, { id: review.id });

        expect(cancelled.errors).toBeUndefined();
        const cancelResult = cancelled.data.cms.cancelCmsEntryReview;
        expect(cancelResult.error).toBeNull();
        expect(cancelResult.data).toMatchObject({
            state: "cancelled",
            isActive: false,
            cancelledBy: expected
        });
        expect(read.errors).toBeUndefined();
        expect(read.data.cms.getCmsEntryReview.data.review.cancelledBy).toEqual(expected);
    });

    it("returns the user with reassign who cancels a review requested by someone else", async () => {
        const { review } = await createScenario();
        const reassigner = createGraphQLClient({
            identity: REASSIGNER,
            permissions: REASSIGNER_PERMISSIONS
        });

        const cancelled = await reassigner(CANCEL_REVIEW, { reviewId: review.id });

        expect(cancelled.errors).toBeUndefined();
        const result = cancelled.data.cms.cancelCmsEntryReview;
        expect(result.error).toBeNull();
        expect(result.data.cancelledBy).toEqual({
            id: REASSIGNER.id,
            displayName: REASSIGNER.displayName
        });
    });

    it("returns the caller of the delete-time cancel", async () => {
        const { entry, review } = await createScenario();
        const admin = createGraphQLClient();

        const cancelled = await admin(CANCEL_REVIEWS_FOR_DELETE, {
            modelId: "author",
            entryId: entry.entryId,
            action: "trash"
        });

        expect(cancelled.errors).toBeUndefined();
        const result = cancelled.data.cms.cancelCmsEntryReviewsForDelete;
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
