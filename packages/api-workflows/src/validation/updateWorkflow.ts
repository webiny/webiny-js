import zod from "zod";
import { workflowValidation } from "~/validation/workflow.js";

export const updateWorkflowValidation = zod.object({
    app: zod.string().min(1, "App is required."),
    id: zod.string().min(1, "ID is required."),
    data: workflowValidation
});
