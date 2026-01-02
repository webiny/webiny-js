import zod from "zod";

export const startWorkflowStateValidation = zod.object({
    id: zod.string().min(1, "ID is required.")
});
