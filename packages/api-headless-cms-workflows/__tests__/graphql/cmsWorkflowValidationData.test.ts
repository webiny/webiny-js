import { describe, expect, it } from "vitest";
import { createWorkflowValues } from "~tests/__workflows/workflow.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { EDITOR } from "~tests/__helpers/identities.js";
import { CMS_READER, WORKFLOWS_EDITOR } from "~tests/__helpers/permissions.js";
import { createGraphQLClient } from "~tests/__helpers/graphql.js";

const STORE_WORKFLOW = /* GraphQL */ `
    mutation StoreWorkflow($data: WorkflowsWorkflowInput!, $savedOn: String) {
        cms {
            storeCmsEntryWorkflow(data: $data, savedOn: $savedOn) {
                data {
                    id
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

const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...CMS_READER];

const createEditorClient = async () => {
    await createUserContext();
    return createGraphQLClient({ identity: EDITOR, permissions: EDITOR_PERMISSIONS });
};

describe("CMS workflow validation errors carry their data (R267)", () => {
    it("marks the models field when the workflow is bound to a model of another app", async () => {
        const editor = await createEditorClient();

        const body = await editor(STORE_WORKFLOW, { data: createWorkflowValues(["wb.page"]) });

        expect(body.errors).toBeUndefined();
        const result = body.data.cms.storeCmsEntryWorkflow;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual({ stepId: null, field: "models", workflowId: null });
    });

    it("marks the step and the title field of a step with a blank title", async () => {
        const editor = await createEditorClient();
        const values = createWorkflowValues();
        const data = { ...values, steps: [{ ...values.steps[0], title: " " }] };

        const body = await editor(STORE_WORKFLOW, { data });

        expect(body.errors).toBeUndefined();
        const result = body.data.cms.storeCmsEntryWorkflow;
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual({ stepId: "step-1", field: "title", workflowId: null });
    });

    it("names the other workflow when the model already has one", async () => {
        const editor = await createEditorClient();
        const stored = await editor(STORE_WORKFLOW, { data: createWorkflowValues() });
        expect(stored.data.cms.storeCmsEntryWorkflow.error).toBeNull();

        const body = await editor(STORE_WORKFLOW, {
            data: { ...createWorkflowValues(), id: "workflow-2", name: "Second workflow" }
        });

        expect(body.errors).toBeUndefined();
        const result = body.data.cms.storeCmsEntryWorkflow;
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: "workflow-1"
        });
    });
});
