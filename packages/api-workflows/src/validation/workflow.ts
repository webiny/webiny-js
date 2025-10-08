import zod from "zod";
import type { NonEmptyArray } from "@webiny/api/types.js";
import { stepValidation } from "./step.js";
import type { WorkflowStep } from "~/context/abstractions/Workflow.js";

export const workflowValidation = zod.object({
    name: zod.string().min(1, "Name is required."),
    steps: zod
        .array(stepValidation)
        .min(1, "You must add at least one step.")
        .transform(value => {
            return value as NonEmptyArray<WorkflowStep>;
        })
});
