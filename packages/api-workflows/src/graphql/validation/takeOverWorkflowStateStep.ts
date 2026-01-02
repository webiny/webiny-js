import zod from "zod";

export const takeOverWorkflowStateStepValidation = zod.object({
    id: zod.string().min(1, "ID is required.")
});
