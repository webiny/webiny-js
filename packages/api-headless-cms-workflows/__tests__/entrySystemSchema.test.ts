import { describe, expect, it } from "vitest";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { createContextHandler } from "~tests/__handler/context.js";

const CMS_ENTRY_SYSTEM_WORKFLOW_FIELDS = /* GraphQL */ `
    {
        __type(name: "CmsEntrySystemWorkflow") {
            fields {
                name
            }
        }
    }
`;

const GET_AUTHOR_SYSTEM = /* GraphQL */ `
    query GetAuthor($revision: ID!) {
        getAuthor(revision: $revision) {
            data {
                id
                meta {
                    system {
                        workflow {
                            workflowId
                            reviewState
                            stepId
                            stepName
                            stepState
                        }
                    }
                }
            }
            error {
                code
                message
            }
        }
    }
`;

interface NamedRow {
    name: string;
}

describe("CmsEntrySystem workflow field (R102)", () => {
    it("has the stored shape on the CMS manage endpoint", async () => {
        const { invokeCms } = createContextHandler();

        const [body] = await invokeCms({ body: { query: CMS_ENTRY_SYSTEM_WORKFLOW_FIELDS } });

        const fieldNames = (body.data.__type.fields as NamedRow[]).map(field => field.name);
        expect(fieldNames).toEqual([
            "workflowId",
            "reviewState",
            "stepId",
            "stepName",
            "stepState"
        ]);
    });

    it("reads a stored system.workflow through /cms/manage", async () => {
        const { context, invokeCms } = createContextHandler();
        const admin = await context();
        expectOk(await storeWorkflow(admin));
        const entry = await createAuthorEntry(admin, { name: "Ann" });
        await requestEntryReview(admin, entry);

        const [body] = await invokeCms({
            body: { query: GET_AUTHOR_SYSTEM, variables: { revision: entry.id } }
        });

        expect(body.errors).toBeUndefined();
        expect(body.data.getAuthor.error).toBeNull();
        expect(body.data.getAuthor.data.meta.system.workflow).toEqual({
            workflowId: "workflow-1",
            reviewState: "inProgress",
            stepId: "step-1",
            stepName: "Step 1",
            stepState: "awaiting"
        });
    });
});
