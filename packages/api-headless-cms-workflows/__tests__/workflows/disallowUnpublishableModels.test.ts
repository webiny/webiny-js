import { Result } from "@webiny/feature/api";
import type { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ModelNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentModel/errors.js";
import type { WorkflowBeforeCreateEventHandler } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { DisallowUnpublishableModelsOnBeforeCreate } from "~/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeCreate.js";
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__handler/context.js";
import { model as modelDefinition } from "~tests/__cms/models.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";

const expectedMessage = `Cannot bind a workflow to the model "${modelDefinition.modelId}" because it is marked as unpublishable.`;

/** Every model problem of the handlers marks the models field (R267). */
const MODELS_ERROR_DATA = { stepId: null, field: "models", workflowId: null, ruleId: null };

/** A workflow editor with no CMS permissions, so no read access to the model. */
const EDITOR_WITHOUT_MODEL_ACCESS = [{ name: "workflows", editor: true }];

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
        expect(result.error.data).toEqual(MODELS_ERROR_DATA);
    });

    it("rejects binding an existing workflow to an unpublishable model", async () => {
        const context = await createUnpublishableContext();
        const created = await storeWorkflow(context, createWorkflowValues(["wb.page"]));
        expect(created.isOk()).toBe(true);

        const result = await storeWorkflow(context, createWorkflowValues(), created.value.savedOn);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(expectedMessage);
        expect(result.error.data).toEqual(MODELS_ERROR_DATA);
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
        expect(result.error.data).toEqual(MODELS_ERROR_DATA);
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
        expect(result.error.data).toEqual(MODELS_ERROR_DATA);
    });

    it("allows a workflow for a publishable model", async () => {
        const { context } = createContextHandler();

        const result = await storeWorkflow(await context());

        expect(result.isOk()).toBe(true);
    });

    it("fails validation, not a throw, for a model the caller cannot access (R38)", async () => {
        const { context } = createContextHandler({ permissions: EDITOR_WITHOUT_MODEL_ACCESS });

        const result = await storeWorkflow(await context());

        // Code-defined models the caller cannot access are filtered out by the CMS, so they
        // look missing.
        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(`The model "${modelDefinition.modelId}" does not exist.`);
        expect(result.error.data).toEqual(MODELS_ERROR_DATA);
    });

    it("maps a model access failure to a validation error (R38)", async () => {
        const getModel = {
            execute: async () => Result.fail(new ModelNotAuthorizedError())
        } as unknown as GetModelUseCase.Interface;

        const handler = new DisallowUnpublishableModelsOnBeforeCreate(getModel);
        const event = {
            payload: { workflow: { models: ["cms.author"] } }
        } as unknown as WorkflowBeforeCreateEventHandler.Event;

        await expect(handler.handle(event)).rejects.toMatchObject({
            code: "Workflows/Workflow/Validation",
            message: `You don't have access to the model "author".`,
            data: MODELS_ERROR_DATA
        });
    });
});
