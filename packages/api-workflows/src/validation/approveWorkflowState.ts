import zod from "zod";

export const approveWorkflowStateValidation = zod.object({
    id: zod.string().min(1, "ID is required."),
    comment: zod.string().optional()
});
