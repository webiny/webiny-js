import zod from "zod";

export const getTargetWorkflowStateValidation = zod.object({
    app: zod.string().min(1, "App is required."),
    targetRevisionId: zod.string().min(1, "Target revision ID is required.")
});
