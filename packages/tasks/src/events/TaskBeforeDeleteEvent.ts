import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { TaskBeforeDeleteHandler, TaskBeforeDeletePayload } from "./abstractions.js";

export class TaskBeforeDeleteEvent extends DomainEvent<TaskBeforeDeletePayload> {
    eventType = "task.beforeDelete" as const;

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return TaskBeforeDeleteHandler;
    }
}
