import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__handler/context.js";
import { model as modelDefinition } from "~tests/__cms/models.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";

const expectedMessage = `Cannot bind a workflow to the model "${modelDefinition.modelId}" because it is marked as unpublishable.`;

const createUnpublishableContext = async () => {
    const { context } = createContextHandler({
        modifyModel: model => {
            return {
                ...model,
                tags: ["$publishing:false"]
            };
        }
    });
    return context();
};

describe("Disallow unpublishable models", () => {
    it("rejects creating a workflow for an unpublishable model", async () => {
        const context = await createUnpublishableContext();

        const result = await storeWorkflow(context);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(expectedMessage);
    });

    it("rejects binding an existing workflow to an unpublishable model", async () => {
        const context = await createUnpublishableContext();
        const created = await storeWorkflow(context, createWorkflowValues(["wb.page"]));
        expect(created.isOk()).toBe(true);

        const result = await storeWorkflow(context, createWorkflowValues(), created.value.savedOn);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(expectedMessage);
    });

    it("rejects a workflow bound to a model that does not exist", async () => {
        const { context } = createContextHandler();

        const result = await storeWorkflow(
            await context(),
            createWorkflowValues(["cms.doesNotExist"])
        );

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe('The model "doesNotExist" does not exist.');
    });

    it("rejects a workflow bound to a private model", async () => {
        const { context } = createContextHandler({
            modifyModel: model => {
                return { ...model, isPrivate: true };
            }
        });

        const result = await storeWorkflow(await context());

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            `Cannot bind a workflow to the model "${modelDefinition.modelId}" because it is a private model.`
        );
    });

    it("allows a workflow for a publishable model", async () => {
        const { context } = createContextHandler();

        const result = await storeWorkflow(await context());

        expect(result.isOk()).toBe(true);
    });
});
