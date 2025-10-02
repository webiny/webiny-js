import zod from "zod";

export const getWorkflowValidation = zod.object({
    app: zod.string(),
    id: zod.string()
});
