import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { WorkflowBeforeUpdatePayload, WorkflowAfterUpdatePayload } from "./abstractions.js";

// Before update event
export class WorkflowBeforeUpdateEvent extends DomainEvent<WorkflowBeforeUpdatePayload> {
    eventType = "workflow.beforeUpdate" as const;

    getHandlerAbstraction() {
        return WorkflowBeforeUpdateHandler;
    }
}

export const WorkflowBeforeUpdateHandler = createAbstraction<
    IEventHandler<WorkflowBeforeUpdateEvent>
>("WorkflowBeforeUpdateHandler");

export namespace WorkflowBeforeUpdateHandler {
    export type Interface = IEventHandler<WorkflowBeforeUpdateEvent>;
    export type Event = WorkflowBeforeUpdateEvent;
}

// After update event
export class WorkflowAfterUpdateEvent extends DomainEvent<WorkflowAfterUpdatePayload> {
    eventType = "workflow.afterUpdate" as const;

    getHandlerAbstraction() {
        return WorkflowAfterUpdateHandler;
    }
}

export const WorkflowAfterUpdateHandler = createAbstraction<
    IEventHandler<WorkflowAfterUpdateEvent>
>("WorkflowAfterUpdateHandler");

export namespace WorkflowAfterUpdateHandler {
    export type Interface = IEventHandler<WorkflowAfterUpdateEvent>;
    export type Event = WorkflowAfterUpdateEvent;
}
