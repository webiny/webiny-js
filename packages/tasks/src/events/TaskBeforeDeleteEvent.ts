import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { TaskBeforeDeleteEventHandler, TaskBeforeDeletePayload } from "./abstractions.js";

export class TaskBeforeDeleteEvent extends DomainEvent<TaskBeforeDeletePayload> {
    eventType = "task.beforeDelete" as const;

    getHandlerAbstraction() {
        return TaskBeforeDeleteEventHandler;
    }
}
