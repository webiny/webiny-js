import zod from "zod";
import { workflowValidation } from "~/validation/workflow.js";

export const createWorkflowValidation = zod.object({
    app: zod.string(),
    data: workflowValidation
});
