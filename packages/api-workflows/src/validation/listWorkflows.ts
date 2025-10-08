import zod from "zod";

export const listWorkflowsValidation = zod.object({
    app: zod
        .string()
        .min(1, "App is required.")
        .optional()
        .transform(value => {
            return value || undefined;
        })
});
