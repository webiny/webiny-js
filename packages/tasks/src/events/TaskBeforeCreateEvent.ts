import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { TaskBeforeCreateEventHandler, TaskBeforeCreatePayload } from "./abstractions.js";

export class TaskBeforeCreateEvent extends DomainEvent<TaskBeforeCreatePayload> {
    eventType = "task.beforeCreate" as const;

    getHandlerAbstraction() {
        return TaskBeforeCreateEventHandler;
    }
}
