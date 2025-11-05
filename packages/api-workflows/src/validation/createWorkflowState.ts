import zod from "zod";

export const createWorkflowStateValidation = zod.object({
    app: zod.string().min(1, "App is required."),
    targetRevisionId: zod.string().min(1, "Target revision ID is required."),
    title: zod.string().min(5, "Title is required.")
});
