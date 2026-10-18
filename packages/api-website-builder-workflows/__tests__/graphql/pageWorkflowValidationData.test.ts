import { describe, expect, it } from "vitest";
import { createWbWorkflowValues } from "~tests/__helpers/engine.js";
import { asGraphQLUser, STORE_WORKFLOW } from "~tests/__helpers/graphql.js";

describe("WB workflow validation errors carry their data (R267)", () => {
    it("marks the models field when the workflow is bound to a model of another app", async () => {
        const admin = asGraphQLUser();

        const body = await admin.run(STORE_WORKFLOW, {
            data: { ...createWbWorkflowValues(), models: ["cms.article"] }
        });

        const result = body.data.websiteBuilder.storeWebsiteBuilderPageWorkflow;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual({ stepId: null, field: "models", workflowId: null });
    });

    it("marks the step and the title field of a step with a blank title", async () => {
        const admin = asGraphQLUser();
        const values = createWbWorkflowValues();
        const data = { ...values, steps: [{ ...values.steps[0], title: " " }] };

        const body = await admin.run(STORE_WORKFLOW, { data });

        const result = body.data.websiteBuilder.storeWebsiteBuilderPageWorkflow;
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual({ stepId: "step-1", field: "title", workflowId: null });
    });

    it("names the other workflow when pages already have one", async () => {
        const admin = asGraphQLUser();
        const stored = await admin.run(STORE_WORKFLOW, { data: createWbWorkflowValues() });
        expect(stored.data.websiteBuilder.storeWebsiteBuilderPageWorkflow.error).toBeNull();

        const body = await admin.run(STORE_WORKFLOW, {
            data: { ...createWbWorkflowValues(), id: "wb-workflow-2", name: "Second workflow" }
        });

        const result = body.data.websiteBuilder.storeWebsiteBuilderPageWorkflow;
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: "wb-workflow"
        });
    });
});
