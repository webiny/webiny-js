import zod from "zod";
import { WorkflowStateRecordState } from "~/context/abstractions/WorkflowState.js";

export const listWidgetWorkflowStatesValidation = zod.object({
    where: zod.object({
        state: zod.nativeEnum(WorkflowStateRecordState)
    }),
    limit: zod.number().min(1).max(10000)
});
