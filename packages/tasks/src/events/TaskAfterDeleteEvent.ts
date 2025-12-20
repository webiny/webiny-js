import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { TaskAfterDeleteHandler, TaskAfterDeletePayload } from "./abstractions.js";

export class TaskAfterDeleteEvent extends DomainEvent<TaskAfterDeletePayload> {
    eventType = "task.afterDelete" as const;

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return TaskAfterDeleteHandler;
    }
}
