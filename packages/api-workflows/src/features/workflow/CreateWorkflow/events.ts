import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { WorkflowBeforeCreatePayload, WorkflowAfterCreatePayload } from "./abstractions.js";

// Before create event
export class WorkflowBeforeCreateEvent extends DomainEvent<WorkflowBeforeCreatePayload> {
    eventType = "workflow.beforeCreate" as const;

    getHandlerAbstraction() {
        return WorkflowBeforeCreateHandler;
    }
}

export const WorkflowBeforeCreateHandler = createAbstraction<
    IEventHandler<WorkflowBeforeCreateEvent>
>("WorkflowBeforeCreateHandler");

export namespace WorkflowBeforeCreateHandler {
    export type Interface = IEventHandler<WorkflowBeforeCreateEvent>;
    export type Event = WorkflowBeforeCreateEvent;
}

// After create event
export class WorkflowAfterCreateEvent extends DomainEvent<WorkflowAfterCreatePayload> {
    eventType = "workflow.afterCreate" as const;

    getHandlerAbstraction() {
        return WorkflowAfterCreateHandler;
    }
}

export const WorkflowAfterCreateHandler = createAbstraction<
    IEventHandler<WorkflowAfterCreateEvent>
>("WorkflowAfterCreateHandler");

export namespace WorkflowAfterCreateHandler {
    export type Interface = IEventHandler<WorkflowAfterCreateEvent>;
    export type Event = WorkflowAfterCreateEvent;
}
