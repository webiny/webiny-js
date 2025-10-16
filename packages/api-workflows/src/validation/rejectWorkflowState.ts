import zod from "zod";

export const rejectWorkflowStateValidation = zod.object({
    id: zod.string().min(1, "ID is required."),
    stepId: zod.string().min(1, "Step ID is required."),
    comment: zod.string().min(1, "Comment is required.")
});
