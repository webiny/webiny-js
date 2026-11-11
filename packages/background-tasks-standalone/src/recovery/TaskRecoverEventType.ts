import { EventType } from "@webiny/event-handler-core";
import type { IEventType } from "@webiny/event-handler-core";
import { TaskRecoverEventHandler } from "./TaskRecoverEventHandler.js";

export const TASK_RECOVER_EVENT_IDENTIFIER = "WebinyBackgroundTaskRecover";

/**
 * Asks this process to take over every task that nobody holds. Dispatched at boot and then on a
 * timer: a task whose process died is stranded until some other process looks for it.
 */
export interface ITaskRecoverEvent {
    [TASK_RECOVER_EVENT_IDENTIFIER]: true;
}

class TaskRecoverEventTypeImpl implements IEventType<ITaskRecoverEvent> {
    canHandle(event: any): event is ITaskRecoverEvent {
        return event?.[TASK_RECOVER_EVENT_IDENTIFIER] === true;
    }

    getHandlerAbstraction() {
        return TaskRecoverEventHandler;
    }
}

export const TaskRecoverEventType = EventType.createImplementation({
    implementation: TaskRecoverEventTypeImpl,
    dependencies: []
});
