import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { TaskBeforeUpdateEventHandler, TaskBeforeUpdatePayload } from "./abstractions.js";

export class TaskBeforeUpdateEvent extends DomainEvent<TaskBeforeUpdatePayload> {
    eventType = "task.beforeUpdate" as const;

    getHandlerAbstraction() {
        return TaskBeforeUpdateEventHandler;
    }
}
