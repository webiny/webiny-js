import zod from "zod";

export const getWorkflowValidation = zod.object({
    app: zod.string().min(1, "App is required."),
    id: zod.string().min(1, "ID is required.")
});
