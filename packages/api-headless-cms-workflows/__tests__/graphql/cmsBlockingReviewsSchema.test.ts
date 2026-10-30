import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { READER } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { createGraphQLClient, type GraphQLClient } from "~tests/__helpers/graphql.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";
import { BLOCKING_REVIEWS_MAX_IDS } from "~/features/wrappers/ListCmsEntryBlockingReviews/index.js";

const LIST_BLOCKING_REVIEWS = /* GraphQL */ `
    query ListBlockingReviews($modelId: ID!, $entryIds: [ID!]!) {
        cms {
            listCmsEntryBlockingReviews(modelId: $modelId, entryIds: $entryIds) {
                data {
                    reviewId
                    model
                    targetId
                    targetRevisionId
                    title
                    stepPosition
                    stepCount
                    stepName
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

/** A `/graphql` client as the identity, with the extra models and the engine call counter. */
const clientFor = (identity: IdentityData | null, permissions: SecurityPermission[]) => {
    return createGraphQLClient({
        identity,
        permissions,
        legacyPlugins: [...createExtraModelPlugins(), countEngineCalls]
    });
};

/** Runs an operation and returns `data.cms`; a GraphQL-level error fails the test. */
const run = async (client: GraphQLClient, query: string, variables?: Record<string, unknown>) => {
    const body = await client(query, variables);
    expect(body.errors).toBeUndefined();
    return body.data.cms;
};

describe("CMS blocking reviews GraphQL (R265)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("returns every field of the reviews in progress of the entries", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const entry = await createAuthorEntry(admin, { name: "Ann" });
        const review = await requestEntryReview(admin, entry);
        const viewer = clientFor(READER, CMS_READER);

        const result = await run(viewer, LIST_BLOCKING_REVIEWS, {
            modelId: "author",
            entryIds: [entry.entryId]
        });

        expect(result.listCmsEntryBlockingReviews.error).toBeNull();
        expect(result.listCmsEntryBlockingReviews.data).toEqual([
            {
                reviewId: review.id,
                model: "cms.author",
                targetId: entry.entryId,
                targetRevisionId: entry.id,
                title: "Ann",
                stepPosition: 1,
                stepCount: 1,
                stepName: "Step 1"
            }
        ]);
    });

    it("returns an empty list, not null, for a model with no bound workflow", async () => {
        const viewer = clientFor(READER, CMS_READER);

        const result = await run(viewer, LIST_BLOCKING_REVIEWS, {
            modelId: "book",
            entryIds: ["book-entry-1"]
        });

        expect(result.listCmsEntryBlockingReviews).toEqual({ data: [], error: null });
    });

    it("returns the validation error with its code for more than 200 ids", async () => {
        const viewer = clientFor(READER, CMS_READER);
        const entryIds = Array.from({ length: BLOCKING_REVIEWS_MAX_IDS + 1 }, (_, index) => {
            return `entry-${index}`;
        });

        const result = await run(viewer, LIST_BLOCKING_REVIEWS, { modelId: "author", entryIds });

        expect(result.listCmsEntryBlockingReviews.data).toBeNull();
        expect(result.listCmsEntryBlockingReviews.error).toMatchObject({
            code: "Workflows/Review/Validation",
            message: "At most 200 entries can be checked at once."
        });
        expect(engineCalls).toEqual([]);
    });

    it("refuses an anonymous identity", async () => {
        const anonymous = clientFor(null, []);

        const result = await run(anonymous, LIST_BLOCKING_REVIEWS, {
            modelId: "author",
            entryIds: ["entry-1"]
        });

        expect(result.listCmsEntryBlockingReviews.data).toBeNull();
        expect(result.listCmsEntryBlockingReviews.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });
});
