import { describe, expect, it } from "vitest";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { requestPageReview, STEP_ID, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { asGraphQLUser, GET_PAGE_SYSTEM } from "~tests/__helpers/graphql.js";

describe("WbPage.system.workflow on /graphql (R102)", () => {
    it("returns the stored system.workflow of a page under review", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        const page = await createPage(admin, { title: "Page A" });
        await requestPageReview(admin, page);

        const body = await asGraphQLUser().run(GET_PAGE_SYSTEM, { id: page.id });
        const result = body.data.websiteBuilder.getPageById;

        expect(result.error).toBeNull();
        expect(result.data.system.workflow).toEqual({
            workflowId: "wb-workflow",
            reviewState: "inProgress",
            stepId: STEP_ID,
            stepName: "Step 1",
            stepState: "awaiting"
        });
    });

    it("returns a null workflow for a page that was never reviewed", async () => {
        const admin = await createUserContext();
        const page = await createPage(admin, { title: "Page A" });

        const body = await asGraphQLUser().run(GET_PAGE_SYSTEM, { id: page.id });

        expect(body.data.websiteBuilder.getPageById.data.system).toBeNull();
    });
});
