import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { TaskBeforeUpdateHandler, TaskBeforeUpdatePayload } from "./abstractions.js";

export class TaskBeforeUpdateEvent extends DomainEvent<TaskBeforeUpdatePayload> {
    eventType = "task.beforeUpdate" as const;

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return TaskBeforeUpdateHandler;
    }
}
