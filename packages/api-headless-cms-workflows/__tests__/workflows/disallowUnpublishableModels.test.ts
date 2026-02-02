import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__handler/context.js";
import { model as modelDefinition } from "~tests/__cms/models.js";
import { createWorkflow } from "~tests/__workflows/workflow.js";

describe("Disallow unpublishable models", () => {
    it("should not allow creating workflows for unpublishable models", async () => {
        expect.assertions(1);
        const { context: createContext } = createContextHandler({
            modifyModel: model => {
                return {
                    ...model,
                    tags: ["$publishing:false"]
                };
            }
        });
        const context = await createContext();
        try {
            await createWorkflow(context);
        } catch (ex) {
            expect((ex as Error).message).toBe(
                `Cannot create a workflow for the model "${modelDefinition.modelId}" because it is marked as unpublishable.`
            );
        }
    });
});
