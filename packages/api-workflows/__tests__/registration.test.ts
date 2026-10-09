import { describe, expect, it } from "vitest";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { CreateWorkflowUseCase } from "~/features/workflow/CreateWorkflow/index.js";
import { UpdateWorkflowUseCase } from "~/features/workflow/UpdateWorkflow/index.js";

describe("WorkflowsFeature registration", () => {
    it("registers create and update workflow use cases once", async () => {
        const { context } = await createContextHandler();

        expect(context.container.resolveAll(CreateWorkflowUseCase)).toHaveLength(1);
        expect(context.container.resolveAll(UpdateWorkflowUseCase)).toHaveLength(1);
    });

    it("does not register the old workflow state model", async () => {
        const { context } = await createContextHandler();

        const result = await context.container.resolve(GetModelUseCase).execute("wbyWorkflowState");

        expect(result.isFail()).toBe(true);
    });
});
