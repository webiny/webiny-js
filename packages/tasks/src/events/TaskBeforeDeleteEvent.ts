import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { TaskBeforeDeleteHandler, TaskBeforeDeletePayload } from "./abstractions.js";

export class TaskBeforeDeleteEvent extends DomainEvent<TaskBeforeDeletePayload> {
    eventType = "task.beforeDelete" as const;

    getHandlerAbstraction() {
        return TaskBeforeDeleteHandler;
    }
}
