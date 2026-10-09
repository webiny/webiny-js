import { describe, expect, it } from "vitest";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { createContextHandler } from "./__handler/context.js";

describe("CmsWorkflowsFeature registration", () => {
    it("registers the core workflows feature only once", async () => {
        const { context } = createContextHandler();
        const ctx = await context();

        expect(ctx.container.resolveAll(StoreWorkflowUseCase)).toHaveLength(1);
    });
});
