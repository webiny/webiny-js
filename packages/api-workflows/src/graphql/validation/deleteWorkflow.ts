import zod from "zod";

export const deleteWorkflowValidation = zod.object({
    app: zod.string(),
    id: zod.string()
});
