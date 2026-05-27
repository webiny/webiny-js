import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { TaskAfterDeleteEventHandler, TaskAfterDeletePayload } from "./abstractions.js";

export class TaskAfterDeleteEvent extends DomainEvent<TaskAfterDeletePayload> {
    eventType = "task.afterDelete" as const;

    getHandlerAbstraction() {
        return TaskAfterDeleteEventHandler;
    }
}
