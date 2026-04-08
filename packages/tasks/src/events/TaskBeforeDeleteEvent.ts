import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { TaskBeforeDeleteEventHandler, TaskBeforeDeletePayload } from "./abstractions.js";

export class TaskBeforeDeleteEvent extends DomainEvent<TaskBeforeDeletePayload> {
    eventType = "task.beforeDelete" as const;

    getHandlerAbstraction() {
        return TaskBeforeDeleteEventHandler;
    }
}
