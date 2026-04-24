import zod from "zod";

export const cancelWorkflowStateValidation = zod.object({
    id: zod.string().min(1, "ID is required.")
});
