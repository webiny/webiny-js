import { describe, expect, it } from "vitest";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";

describe("WorkflowsFeature registration", () => {
    it("registers the workflow use cases once", async () => {
        const { context } = await createContextHandler();

        expect(context.container.resolveAll(StoreWorkflowUseCase)).toHaveLength(1);
        expect(context.container.resolveAll(DeleteWorkflowUseCase)).toHaveLength(1);
    });

    it("does not register the old workflow state model", async () => {
        const { context } = await createContextHandler();

        const result = await context.container.resolve(GetModelUseCase).execute("wbyWorkflowState");

        expect(result.isFail()).toBe(true);
    });
});
