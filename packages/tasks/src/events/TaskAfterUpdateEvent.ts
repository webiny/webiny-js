import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { TaskAfterUpdateHandler, TaskAfterUpdatePayload } from "./abstractions.js";

export class TaskAfterUpdateEvent extends DomainEvent<TaskAfterUpdatePayload> {
    eventType = "task.afterUpdate" as const;

    getHandlerAbstraction(): Abstraction<IEventHandler<any>> {
        return TaskAfterUpdateHandler;
    }
}
