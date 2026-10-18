import { describe, expect, it } from "vitest";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import { asGraphQLUser, TYPE_FIELDS } from "~tests/__helpers/graphql.js";

const QUERIES = [
    "listWebsiteBuilderPageWorkflows",
    "getWebsiteBuilderPageWorkflow",
    "getWebsiteBuilderPageReview",
    "getWebsiteBuilderPageTargetReview",
    "getWebsiteBuilderPageReviewStepRun",
    "listWebsiteBuilderPageReviews",
    "listWebsiteBuilderPageStepCandidates",
    "listWebsiteBuilderPageReviewStepCandidates",
    "inspectWebsiteBuilderPageRouting",
    "websiteBuilderPageFolderExists"
];

const MUTATIONS = [
    "storeWebsiteBuilderPageWorkflow",
    "deleteWebsiteBuilderPageWorkflow",
    "requestWebsiteBuilderPageReview",
    "startWebsiteBuilderPageReviewStep",
    "takeOverWebsiteBuilderPageReviewStep",
    "reassignWebsiteBuilderPageReviewStep",
    "restartWebsiteBuilderPageReviewStep",
    "approveWebsiteBuilderPageReviewStep",
    "rejectWebsiteBuilderPageReviewStep",
    "cancelWebsiteBuilderPageReview",
    "cancelWebsiteBuilderPageReviewsForDelete"
];

interface TypeField {
    name: string;
}

const fieldNames = async (user: ReturnType<typeof asGraphQLUser>, name: string) => {
    const body = await user.run(TYPE_FIELDS, { name });
    return ((body.data.__type?.fields ?? []) as TypeField[]).map(field => field.name);
};

describe("WB workflows GraphQL and the advancedPublishingWorkflow license (R100)", () => {
    it("adds every WB operation and WbPageSystem.workflow with the license", async () => {
        const admin = asGraphQLUser();

        expect(await fieldNames(admin, "WbQuery")).toEqual(expect.arrayContaining(QUERIES));
        expect(await fieldNames(admin, "WbMutation")).toEqual(expect.arrayContaining(MUTATIONS));
        expect(await fieldNames(admin, "WbPageSystem")).toContain("workflow");
    });

    it("adds nothing without the license", async () => {
        const license = createTestWcpLicense();
        license.package.features[PROJECT_PACKAGE_FEATURE_NAME.APW] = { enabled: false };
        const admin = asGraphQLUser({ testProjectLicense: license });

        const queries = await fieldNames(admin, "WbQuery");
        const mutations = await fieldNames(admin, "WbMutation");

        expect(queries).toContain("getPageById");
        for (const name of QUERIES) {
            expect(queries).not.toContain(name);
        }
        for (const name of MUTATIONS) {
            expect(mutations).not.toContain(name);
        }
        expect(await fieldNames(admin, "WbPageSystem")).toEqual(["_empty"]);
    });
});
