import zod from "zod";
import { workflowValidation } from "./workflow.js";

export const createWorkflowValidation = zod.object({
    app: zod.string().min(1, "App is required."),
    data: workflowValidation.merge(
        zod.object({
            id: zod.string().min(1, "ID is required.")
        })
    )
});
