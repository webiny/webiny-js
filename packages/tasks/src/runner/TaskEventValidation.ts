import zod from "zod";
import WebinyError from "@webiny/error";
import { ITaskEvent } from "~/handler/types";
import { createZodError } from "@webiny/utils";

const validation = zod
    .object({
        webinyTaskId: zod.string(),
        endpoint: zod.string(),
        tenant: zod.string(),
        locale: zod.string(),
        stateMachineId: zod.string()
    })
    .required();

export class TaskEventValidation {
    public validate(event: ITaskEvent & Record<string, any>): WebinyError | ITaskEvent {
        const result = validation.safeParse(event);
        if (result.success) {
            return result.data;
        }
        return createZodError(result.error);
    }
}
