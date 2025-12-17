import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { WorkflowBeforeDeletePayload, WorkflowAfterDeletePayload } from "./abstractions.js";

// Before delete event
export class WorkflowBeforeDeleteEvent extends DomainEvent<WorkflowBeforeDeletePayload> {
    eventType = "workflow.beforeDelete" as const;

    getHandlerAbstraction() {
        return WorkflowBeforeDeleteHandler;
    }
}

export const WorkflowBeforeDeleteHandler = createAbstraction<
    IEventHandler<WorkflowBeforeDeleteEvent>
>("WorkflowBeforeDeleteHandler");

export namespace WorkflowBeforeDeleteHandler {
    export type Interface = IEventHandler<WorkflowBeforeDeleteEvent>;
    export type Event = WorkflowBeforeDeleteEvent;
}

// After delete event
export class WorkflowAfterDeleteEvent extends DomainEvent<WorkflowAfterDeletePayload> {
    eventType = "workflow.afterDelete" as const;

    getHandlerAbstraction() {
        return WorkflowAfterDeleteHandler;
    }
}

export const WorkflowAfterDeleteHandler = createAbstraction<
    IEventHandler<WorkflowAfterDeleteEvent>
>("WorkflowAfterDeleteHandler");

export namespace WorkflowAfterDeleteHandler {
    export type Interface = IEventHandler<WorkflowAfterDeleteEvent>;
    export type Event = WorkflowAfterDeleteEvent;
}
