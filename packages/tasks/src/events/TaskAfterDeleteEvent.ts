import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { TaskAfterDeleteEventHandler, TaskAfterDeletePayload } from "./abstractions.js";

export class TaskAfterDeleteEvent extends DomainEvent<TaskAfterDeletePayload> {
    eventType = "task.afterDelete" as const;

    getHandlerAbstraction() {
        return TaskAfterDeleteEventHandler;
    }
}
