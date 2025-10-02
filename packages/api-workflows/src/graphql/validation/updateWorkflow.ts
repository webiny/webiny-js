import zod from "zod";
import { workflowValidation } from "~/validation/workflow.js";

export const updateWorkflowValidation = zod.object({
    app: zod.string(),
    id: zod.string(),
    data: workflowValidation
});
