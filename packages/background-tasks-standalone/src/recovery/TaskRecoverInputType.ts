import { InputType } from "@webiny/api-kernel-core";

import { TaskRecoverInputHandler } from "./TaskRecoverInputHandler.js";

export const TASK_RECOVER_EVENT_IDENTIFIER = "WebinyBackgroundTaskRecover";

/**
 * Asks this process to take over every task that nobody holds. Dispatched at boot and then on a
 * timer: a task whose process died is stranded until some other process looks for it.
 */
export interface ITaskRecoverEvent {
    [TASK_RECOVER_EVENT_IDENTIFIER]: true;
}

class TaskRecoverInputTypeImpl implements InputType.Interface<ITaskRecoverEvent> {
    matches(input: any): input is ITaskRecoverEvent {
        return input?.[TASK_RECOVER_EVENT_IDENTIFIER] === true;
    }

    getHandlerAbstraction() {
        return TaskRecoverInputHandler;
    }
}

export const TaskRecoverInputType = InputType.createImplementation({
    implementation: TaskRecoverInputTypeImpl,
    dependencies: []
});
