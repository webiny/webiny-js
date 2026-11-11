import { describe, expect, it } from "vitest";
import {
    createWbWorkflowValues,
    createWbWorkflowValuesWithAssignment
} from "~tests/__helpers/engine.js";
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
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: null,
            ruleId: null
        });
    });

    it("marks the step and the title field of a step with a blank title", async () => {
        const admin = asGraphQLUser();
        const values = createWbWorkflowValues();
        const data = { ...values, steps: [{ ...values.steps[0], title: " " }] };

        const body = await admin.run(STORE_WORKFLOW, { data });

        const result = body.data.websiteBuilder.storeWebsiteBuilderPageWorkflow;
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual({
            stepId: "step-1",
            field: "title",
            workflowId: null,
            ruleId: null
        });
    });

    it("names the rule of a team target outside the step's teams (R288)", async () => {
        const admin = asGraphQLUser();
        const data = createWbWorkflowValuesWithAssignment({
            strategy: "none",
            allowManualPick: false,
            rules: [
                { id: "rule-1", conditions: {}, target: { type: "team", id: "team-elsewhere" } }
            ]
        });

        const body = await admin.run(STORE_WORKFLOW, { data });

        const result = body.data.websiteBuilder.storeWebsiteBuilderPageWorkflow;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            "The target team is not one of the step's reviewing teams."
        );
        expect(result.error.data).toEqual({
            stepId: "step-1",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-1"
        });
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
            workflowId: "wb-workflow",
            ruleId: null
        });
    });
});
