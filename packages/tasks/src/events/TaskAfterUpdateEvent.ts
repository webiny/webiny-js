import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { TaskAfterUpdateEventHandler, TaskAfterUpdatePayload } from "./abstractions.js";

export class TaskAfterUpdateEvent extends DomainEvent<TaskAfterUpdatePayload> {
    eventType = "task.afterUpdate" as const;

    getHandlerAbstraction() {
        return TaskAfterUpdateEventHandler;
    }
}
