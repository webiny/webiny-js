import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { TaskAfterDeleteHandler, TaskAfterDeletePayload } from "./abstractions.js";

export class TaskAfterDeleteEvent extends DomainEvent<TaskAfterDeletePayload> {
    eventType = "task.afterDelete" as const;

    getHandlerAbstraction() {
        return TaskAfterDeleteHandler;
    }
}
