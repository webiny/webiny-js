import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { TaskBeforeCreateEventHandler, TaskBeforeCreatePayload } from "./abstractions.js";

export class TaskBeforeCreateEvent extends DomainEvent<TaskBeforeCreatePayload> {
    eventType = "task.beforeCreate" as const;

    getHandlerAbstraction() {
        return TaskBeforeCreateEventHandler;
    }
}
