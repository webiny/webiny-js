import zod from "zod";

export const listWorkflowsValidation = zod.object({
    app: zod.string()
});
