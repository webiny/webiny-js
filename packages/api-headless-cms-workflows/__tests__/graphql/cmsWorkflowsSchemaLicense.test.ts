import { describe, expect, it } from "vitest";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import { createGraphQLClient } from "~tests/__helpers/graphql.js";

const ROOT_FIELDS = /* GraphQL */ `
    {
        query: __type(name: "CmsQuery") {
            fields {
                name
            }
        }
        mutation: __type(name: "CmsMutation") {
            fields {
                name
            }
        }
        envelope: __type(name: "CmsEntryReviewListResponse") {
            name
        }
    }
`;

const CMS_QUERY_FIELDS = [
    "listCmsEntryWorkflows",
    "getCmsEntryWorkflow",
    "getCmsEntryReview",
    "getCmsEntryTargetReview",
    "getCmsEntryReviewStepRun",
    "listCmsEntryReviews",
    "listCmsEntryWorkflowModels",
    "listCmsEntryStepCandidates",
    "listCmsEntryReviewStepCandidates",
    "inspectCmsEntryRouting",
    "cmsEntryFolderExists"
];

const CMS_MUTATION_FIELDS = [
    "storeCmsEntryWorkflow",
    "deleteCmsEntryWorkflow",
    "requestCmsEntryReview",
    "startCmsEntryReviewStep",
    "takeOverCmsEntryReviewStep",
    "reassignCmsEntryReviewStep",
    "restartCmsEntryReviewStep",
    "approveCmsEntryReviewStep",
    "rejectCmsEntryReviewStep",
    "cancelCmsEntryReview",
    "cancelCmsEntryReviewsForDelete"
];

interface NamedRow {
    name: string;
}

const names = (rows: NamedRow[] | undefined): string[] => {
    return (rows ?? []).map(row => row.name);
};

describe("CMS workflows GraphQL and the license", () => {
    it("adds every CMS operation with the advancedPublishingWorkflow license (R88)", async () => {
        const client = createGraphQLClient();

        const body = await client(ROOT_FIELDS);

        expect(names(body.data.query.fields)).toEqual(expect.arrayContaining(CMS_QUERY_FIELDS));
        expect(names(body.data.mutation.fields)).toEqual(
            expect.arrayContaining(CMS_MUTATION_FIELDS)
        );
        expect(body.data.envelope).toEqual({ name: "CmsEntryReviewListResponse" });
    });

    it("adds nothing without the advancedPublishingWorkflow license (R100)", async () => {
        const license = createTestWcpLicense();
        license.package.features[PROJECT_PACKAGE_FEATURE_NAME.APW] = { enabled: false };
        const client = createGraphQLClient({ testProjectLicense: license });

        const body = await client(ROOT_FIELDS);

        expect(body.errors).toBeUndefined();
        for (const field of CMS_QUERY_FIELDS) {
            expect(names(body.data.query.fields)).not.toContain(field);
        }
        for (const field of CMS_MUTATION_FIELDS) {
            expect(names(body.data.mutation.fields)).not.toContain(field);
        }
        expect(body.data.envelope).toBeNull();
    });
});
