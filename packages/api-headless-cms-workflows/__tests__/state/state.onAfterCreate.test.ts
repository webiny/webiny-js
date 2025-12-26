import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__handler/context.js";
import { model as modelDefinition } from "~tests/__cms/models.js";
import { createWorkflow } from "~tests/__workflows/workflow.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { CreateWorkflowStateUseCase } from "@webiny/api-workflows/features/workflowState/CreateWorkflowState/index.js";

describe("state onAfterCreate", () => {
    it("should attach a state to cms entry", async () => {
        const { context: createContext } = createContextHandler();

        const context = await createContext();
        const { workflow } = await createWorkflow(context);

        // Resolve use cases from DI container
        const getModel = context.container.resolve(GetModelUseCase);
        const createEntry = context.container.resolve(CreateEntryUseCase);
        const listLatestEntries = context.container.resolve(ListLatestEntriesUseCase);
        const createWorkflowState = context.container.resolve(CreateWorkflowStateUseCase);

        // Get the model
        const modelResult = await getModel.execute(modelDefinition.modelId);
        expect(modelResult.isOk()).toBe(true);
        const model = modelResult.value!;

        // Create an entry
        const entryResult = await createEntry.execute(model, {
            name: "John Doe"
        });
        expect(entryResult.isOk()).toBe(true);
        const entry = entryResult.value!;

        // List entries before creating workflow state
        const listResult = await listLatestEntries.execute(model);
        expect(listResult.isOk()).toBe(true);
        const [items] = listResult.value!;

        expect(items).toMatchObject([
            {
                id: entry.id,
                values: {
                    name: "John Doe"
                }
            }
        ]);

        // Create workflow state
        const stateResult = await createWorkflowState.execute({
            app: workflow.app,
            targetRevisionId: entry.id,
            title: `CMS: ${entry.values.name}`
        });
        expect(stateResult.isOk()).toBe(true);
        const state = stateResult.value!;

        expect(state.app).toEqual(workflow.app);
        expect(state.targetRevisionId).toEqual(entry.id);

        // List entries after creating workflow state
        const listAfterStateResult = await listLatestEntries.execute(model);
        expect(listAfterStateResult.isOk()).toBe(true);
        const [itemsAfterState] = listAfterStateResult.value!;

        expect(itemsAfterState).toMatchObject([
            {
                id: entry.id,
                values: {
                    name: "John Doe"
                }
            }
        ]);
    });
});
