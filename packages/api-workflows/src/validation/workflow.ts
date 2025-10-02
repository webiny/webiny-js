import zod from "zod";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type { WorkflowStep } from "~/types.js";
import { stepValidation } from "./step.js";

export const workflowValidation = zod.object({
    id: zod.string(),
    name: zod.string(),
    steps: zod
        .array(stepValidation)
        .min(1, "You must add at least one step.")
        .transform(value => {
            return value as NonEmptyArray<WorkflowStep>;
        })
});
