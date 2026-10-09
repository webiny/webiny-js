import { describe, expect, expectTypeOf, it } from "vitest";
import type { ICmsEntrySystem } from "@webiny/api-headless-cms/types/types.js";
import type { ReviewSystemWorkflow } from "~/domain/review/types.js";
// Consumers see the augmentation through the package entry point, which re-exports `types.ts`.
import type { IWorkflowsSecurityPermission } from "~/index.js";

describe("ICmsEntrySystem augmentation", () => {
    it("types system.workflow as the review's system value", () => {
        expectTypeOf<ICmsEntrySystem["workflow"]>().toEqualTypeOf<
            ReviewSystemWorkflow | null | undefined
        >();
        expectTypeOf<IWorkflowsSecurityPermission["editor"]>().toEqualTypeOf<boolean>();

        const system: ICmsEntrySystem = {
            workflow: {
                workflowId: "workflow-1",
                reviewState: "inProgress",
                stepId: "legal",
                stepName: "Legal review",
                stepState: "awaiting"
            }
        };

        expect(system.workflow?.stepState).toBe("awaiting");
    });
});
