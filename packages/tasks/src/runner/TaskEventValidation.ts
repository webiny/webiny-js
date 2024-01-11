import zod from "zod";
import { createZodError } from "@webiny/utils";
import { ITaskEventValidation, ITaskEventValidationResult } from "./abstractions";
import { ITaskEvent } from "~/handler/types";

const validation = zod
    .object({
        webinyTaskId: zod.string(),
        webinyTaskDefinitionId: zod.string(),
        endpoint: zod.string(),
        tenant: zod.string(),
        locale: zod.string(),
        executionName: zod.string(),
        stateMachineId: zod.string()
    })
    .required();

export class TaskEventValidation implements ITaskEventValidation {
    public validate(event: Partial<ITaskEvent>): ITaskEventValidationResult {
        const result = validation.safeParse(event);
        if (result.success) {
            return result.data;
        }
        throw createZodError(result.error);
    }
}
