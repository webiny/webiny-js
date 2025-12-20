import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { TaskBeforeCreateHandler, TaskBeforeCreatePayload } from "./abstractions.js";

export class TaskBeforeCreateEvent extends DomainEvent<TaskBeforeCreatePayload> {
    eventType = "task.beforeCreate" as const;

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return TaskBeforeCreateHandler;
    }
}
