import zod from "zod";

export const getWorkflowTargetStateValidation = zod.object({
    app: zod.string().min(1, "App is required."),
    id: zod.string().min(1, "ID is required.")
});
