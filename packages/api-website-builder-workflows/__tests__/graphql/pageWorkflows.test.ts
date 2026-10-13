import { beforeEach, describe, expect, it } from "vitest";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createWbWorkflowValues, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import { REVIEWER, WB_READER } from "~tests/__helpers/identities.js";
import { failListWorkflows } from "~tests/__helpers/FailingListWorkflows.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    asGraphQLUser,
    DELETE_WORKFLOW,
    GET_WORKFLOW,
    LIST_WORKFLOWS,
    STORE_WORKFLOW
} from "~tests/__helpers/graphql.js";

describe("WB workflow operations through GraphQL", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    it("stores, lists, gets, updates and deletes the pages workflow", async () => {
        const admin = asGraphQLUser();

        const created = await admin.run(STORE_WORKFLOW, { data: createWbWorkflowValues() });
        const stored = created.data.websiteBuilder.storeWebsiteBuilderPageWorkflow;
        const listed = await admin.run(LIST_WORKFLOWS);
        const read = await admin.run(GET_WORKFLOW, { id: "wb-workflow" });
        const updated = await admin.run(STORE_WORKFLOW, {
            data: { ...createWbWorkflowValues(), name: "Pages review v2" },
            savedOn: stored.data.savedOn
        });
        const deleted = await admin.run(DELETE_WORKFLOW, { id: "wb-workflow" });

        expect(stored.error).toBeNull();
        expect(stored.data).toMatchObject({ id: "wb-workflow", models: ["wb.page"] });
        expect(stored.data.steps).toEqual([
            {
                id: "step-1",
                title: "Step 1",
                type: "review",
                config: createWbWorkflowValues().steps[0].config
            }
        ]);
        expect(
            listed.data.websiteBuilder.listWebsiteBuilderPageWorkflows.data.map(
                (workflow: { id: string }) => workflow.id
            )
        ).toEqual(["wb-workflow"]);
        expect(listed.data.websiteBuilder.listWebsiteBuilderPageWorkflows.meta).toEqual({
            cursor: null,
            hasMoreItems: false
        });
        expect(read.data.websiteBuilder.getWebsiteBuilderPageWorkflow.data.name).toBe(
            "Pages review"
        );
        expect(updated.data.websiteBuilder.storeWebsiteBuilderPageWorkflow.error).toBeNull();
        expect(updated.data.websiteBuilder.storeWebsiteBuilderPageWorkflow.data.name).toBe(
            "Pages review v2"
        );
        expect(deleted.data.websiteBuilder.deleteWebsiteBuilderPageWorkflow).toEqual({
            data: { id: "wb-workflow" },
            error: null
        });
    });

    it("returns the conflict error with its code and data when savedOn is stale (D131)", async () => {
        const workflow = await storeWbWorkflow(await createUserContext());
        const admin = asGraphQLUser();

        const body = await admin.run(STORE_WORKFLOW, {
            data: createWbWorkflowValues(),
            savedOn: "2020-01-01T00:00:00.000Z"
        });
        const result = body.data.websiteBuilder.storeWebsiteBuilderPageWorkflow;

        expect(result.data).toBeNull();
        expect(result.error.code).toBe("Workflows/Workflow/Conflict");
        expect(result.error.data).toEqual({
            savedOn: workflow.savedOn,
            savedBy: workflow.savedBy
        });
    });

    it("returns Workflows/NotAuthorized with data to a user without editor", async () => {
        await storeWbWorkflow(await createUserContext());
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const stored = await reviewer.run(STORE_WORKFLOW, { data: createWbWorkflowValues() });
        const deleted = await reviewer.run(DELETE_WORKFLOW, { id: "wb-workflow" });

        for (const result of [
            stored.data.websiteBuilder.storeWebsiteBuilderPageWorkflow,
            deleted.data.websiteBuilder.deleteWebsiteBuilderPageWorkflow
        ]) {
            expect(result.data).toBeNull();
            expect(result.error.code).toBe("Workflows/NotAuthorized");
            expect(result.error.data).toEqual({ action: "manage workflows" });
        }
    });

    it("reports a Headless CMS workflow as not found through get and delete (R46)", async () => {
        const setup = await createUserContext();
        await storeWbWorkflow(setup);
        await createCmsReview(setup);
        const admin = asGraphQLUser({ legacyPlugins: [countEngineCalls] });

        const read = await admin.run(GET_WORKFLOW, { id: "cms-workflow" });
        const deleted = await admin.run(DELETE_WORKFLOW, { id: "cms-workflow" });
        const listed = await admin.run(LIST_WORKFLOWS);

        for (const result of [
            read.data.websiteBuilder.getWebsiteBuilderPageWorkflow,
            deleted.data.websiteBuilder.deleteWebsiteBuilderPageWorkflow
        ]) {
            expect(result.data).toBeNull();
            expect(result.error).toMatchObject({
                code: "Workflows/Workflow/NotFound",
                data: { id: "cms-workflow" }
            });
        }
        expect(engineCalls).not.toContain("DeleteWorkflow");
        expect(
            listed.data.websiteBuilder.listWebsiteBuilderPageWorkflows.data.map(
                (workflow: { id: string }) => workflow.id
            )
        ).toEqual(["wb-workflow"]);
    });

    it("returns a list error response with null meta when listing the workflows fails", async () => {
        await storeWbWorkflow(await createUserContext());
        const admin = asGraphQLUser({ legacyPlugins: [failListWorkflows] });

        const body = await admin.run(LIST_WORKFLOWS);
        const result = body.data.websiteBuilder.listWebsiteBuilderPageWorkflows;

        expect(result.data).toBeNull();
        expect(result.meta).toBeNull();
        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
    });
});
