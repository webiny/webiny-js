import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__handler/context.js";
import { model as modelDefinition } from "~tests/__cms/models.js";
import { createWorkflow } from "~tests/__workflows/workflow.js";

describe("state onAfterCreate", () => {
    it("should attach a state to cms entry", async () => {
        const { context: createContext } = createContextHandler();

        const context = await createContext();

        const { workflow } = await createWorkflow(context);

        const model = await context.cms.getModel(modelDefinition.modelId);

        const entry = await context.cms.createEntry(model, {
            name: "John Doe"
        });

        const [items] = await context.cms.listLatestEntries(model);

        expect(items).toMatchObject([
            {
                id: entry.id,
                values: {
                    name: "John Doe"
                }
            }
        ]);

        const state = await context.workflowState.createState(
            workflow.app,
            entry.id,
            `CMS: ${entry.values.name}`
        );
        expect(state.app).toEqual(workflow.app);
        expect(state.targetRevisionId).toEqual(entry.id);

        const [itemsAfterState] = await context.cms.listLatestEntries(model);

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
