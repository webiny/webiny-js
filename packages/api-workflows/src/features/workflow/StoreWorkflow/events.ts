import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { Workflow, WorkflowValues } from "~/domain/workflow/types.js";

/**
 * Event payloads. No actor in 1a: workflow use cases take no actor until phase 1b adds one.
 */
export interface WorkflowBeforeCreatePayload {
    workflow: WorkflowValues;
}

export interface WorkflowAfterCreatePayload {
    workflow: Workflow;
}

export interface WorkflowBeforeUpdatePayload {
    original: Workflow;
    workflow: WorkflowValues;
}

export interface WorkflowAfterUpdatePayload {
    original: Workflow;
    workflow: Workflow;
}

/**
 * WorkflowBeforeCreateEvent - published before a workflow is created.
 */
export class WorkflowBeforeCreateEvent extends DomainEvent<WorkflowBeforeCreatePayload> {
    eventType = "Workflows/Workflow/BeforeCreate" as const;

    getHandlerAbstraction() {
        return WorkflowBeforeCreateEventHandler;
    }
}

/** Hook in before a workflow is created. Throw `WorkflowValidationError` to reject the save. */
export const WorkflowBeforeCreateEventHandler = createAbstraction<
    IEventHandler<WorkflowBeforeCreateEvent>
>("WorkflowBeforeCreateEventHandler");

export namespace WorkflowBeforeCreateEventHandler {
    export type Interface = IEventHandler<WorkflowBeforeCreateEvent>;
    export type Event = WorkflowBeforeCreateEvent;
}

/**
 * WorkflowAfterCreateEvent - published after a workflow is created.
 */
export class WorkflowAfterCreateEvent extends DomainEvent<WorkflowAfterCreatePayload> {
    eventType = "Workflows/Workflow/AfterCreate" as const;

    getHandlerAbstraction() {
        return WorkflowAfterCreateEventHandler;
    }
}

/** Hook in after a workflow is created. */
export const WorkflowAfterCreateEventHandler = createAbstraction<
    IEventHandler<WorkflowAfterCreateEvent>
>("WorkflowAfterCreateEventHandler");

export namespace WorkflowAfterCreateEventHandler {
    export type Interface = IEventHandler<WorkflowAfterCreateEvent>;
    export type Event = WorkflowAfterCreateEvent;
}

/**
 * WorkflowBeforeUpdateEvent - published before a workflow is updated.
 */
export class WorkflowBeforeUpdateEvent extends DomainEvent<WorkflowBeforeUpdatePayload> {
    eventType = "Workflows/Workflow/BeforeUpdate" as const;

    getHandlerAbstraction() {
        return WorkflowBeforeUpdateEventHandler;
    }
}

/** Hook in before a workflow is updated. Throw `WorkflowValidationError` to reject the save. */
export const WorkflowBeforeUpdateEventHandler = createAbstraction<
    IEventHandler<WorkflowBeforeUpdateEvent>
>("WorkflowBeforeUpdateEventHandler");

export namespace WorkflowBeforeUpdateEventHandler {
    export type Interface = IEventHandler<WorkflowBeforeUpdateEvent>;
    export type Event = WorkflowBeforeUpdateEvent;
}

/**
 * WorkflowAfterUpdateEvent - published after a workflow is updated.
 */
export class WorkflowAfterUpdateEvent extends DomainEvent<WorkflowAfterUpdatePayload> {
    eventType = "Workflows/Workflow/AfterUpdate" as const;

    getHandlerAbstraction() {
        return WorkflowAfterUpdateEventHandler;
    }
}

/** Hook in after a workflow is updated. */
export const WorkflowAfterUpdateEventHandler = createAbstraction<
    IEventHandler<WorkflowAfterUpdateEvent>
>("WorkflowAfterUpdateEventHandler");

export namespace WorkflowAfterUpdateEventHandler {
    export type Interface = IEventHandler<WorkflowAfterUpdateEvent>;
    export type Event = WorkflowAfterUpdateEvent;
}
