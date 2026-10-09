import { describe, expect, it } from "vitest";
import { CreateWorkflowUseCase } from "@webiny/api-workflows/features/workflow/CreateWorkflow/index.js";
import { createContextHandler } from "./__handler/context.js";

describe("CmsWorkflowsFeature registration", () => {
    it("registers the core workflows feature only once", async () => {
        const { context } = createContextHandler();
        const ctx = await context();

        expect(ctx.container.resolveAll(CreateWorkflowUseCase)).toHaveLength(1);
    });
});
