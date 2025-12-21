import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { TaskAfterCreateHandler, TaskAfterCreatePayload } from "./abstractions.js";

export class TaskAfterCreateEvent extends DomainEvent<TaskAfterCreatePayload> {
    eventType = "task.afterCreate" as const;

    getHandlerAbstraction() {
        return TaskAfterCreateHandler;
    }
}
