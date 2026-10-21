import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__handler/context.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { createDbModel } from "~tests/__helpers/dbModels.js";
import { EDITOR } from "~tests/__helpers/identities.js";
import { WORKFLOWS_EDITOR } from "~tests/__helpers/permissions.js";

describe("Bindable check on a database model (R38 carry-over)", () => {
    it("fails validation for a workflow editor without read access to the model", async () => {
        const admin = createContextHandler();
        await createDbModel(await admin.context(), "book");
        const editor = createContextHandler({ identity: EDITOR, permissions: [WORKFLOWS_EDITOR] });

        const result = await storeWorkflow(
            await editor.context(),
            createWorkflowValues(["cms.book"])
        );

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe('You don\'t have access to the model "book".');
    });
});
