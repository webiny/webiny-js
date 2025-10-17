import zod from "zod";

export const rejectWorkflowStateValidation = zod.object({
    id: zod.string().min(1, "ID is required."),
    comment: zod.string().min(1, "Comment is required.")
});
