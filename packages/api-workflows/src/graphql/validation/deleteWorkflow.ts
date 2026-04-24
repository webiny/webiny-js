import zod from "zod";

export const deleteWorkflowValidation = zod.object({
    app: zod.string().min(1, "App is required."),
    id: zod.string().min(1, "ID is required.")
});
