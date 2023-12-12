import zod from "zod";
import { createZodError } from "@webiny/utils";
import {
    ITaskEventValidation,
    ITaskEventValidationResult,
    PollutedITaskEvent
} from "./abstractions";

const validation = zod
    .object({
        webinyTaskId: zod.string(),
        endpoint: zod.string(),
        tenant: zod.string(),
        locale: zod.string(),
        stateMachineId: zod.string()
    })
    .required();

export class TaskEventValidation implements ITaskEventValidation {
    public validate(event: PollutedITaskEvent): ITaskEventValidationResult {
        const result = validation.safeParse(event);
        if (result.success) {
            return result.data;
        }
        throw createZodError(result.error);
    }
}
