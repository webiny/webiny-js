import zod from "zod";

export const getWorkflowStateValidation = zod.object({
    id: zod.string().min(1, "ID is required.")
});
