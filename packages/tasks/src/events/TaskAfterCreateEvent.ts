import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { TaskAfterCreateEventHandler, TaskAfterCreatePayload } from "./abstractions.js";

export class TaskAfterCreateEvent extends DomainEvent<TaskAfterCreatePayload> {
    eventType = "task.afterCreate" as const;

    getHandlerAbstraction() {
        return TaskAfterCreateEventHandler;
    }
}
