import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { Workflow } from "~/domain/workflow/types.js";

/**
 * Event payloads. `workflow.savedBy` is the last editor, not the person deleting; phase 1b adds
 * an `actor` to the workflow events.
 */
export interface WorkflowBeforeDeletePayload {
    workflow: Workflow;
}

export interface WorkflowAfterDeletePayload {
    workflow: Workflow;
}

/**
 * WorkflowBeforeDeleteEvent - published before a workflow is deleted.
 */
export class WorkflowBeforeDeleteEvent extends DomainEvent<WorkflowBeforeDeletePayload> {
    eventType = "Workflows/Workflow/BeforeDelete" as const;

    getHandlerAbstraction() {
        return WorkflowBeforeDeleteEventHandler;
    }
}

/** Hook in before a workflow is deleted. */
export const WorkflowBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<WorkflowBeforeDeleteEvent>
>("WorkflowBeforeDeleteEventHandler");

export namespace WorkflowBeforeDeleteEventHandler {
    export type Interface = IEventHandler<WorkflowBeforeDeleteEvent>;
    export type Event = WorkflowBeforeDeleteEvent;
}

/**
 * WorkflowAfterDeleteEvent - published after a workflow is deleted.
 */
export class WorkflowAfterDeleteEvent extends DomainEvent<WorkflowAfterDeletePayload> {
    eventType = "Workflows/Workflow/AfterDelete" as const;

    getHandlerAbstraction() {
        return WorkflowAfterDeleteEventHandler;
    }
}

/** Hook in after a workflow is deleted. */
export const WorkflowAfterDeleteEventHandler = createAbstraction<
    IEventHandler<WorkflowAfterDeleteEvent>
>("WorkflowAfterDeleteEventHandler");

export namespace WorkflowAfterDeleteEventHandler {
    export type Interface = IEventHandler<WorkflowAfterDeleteEvent>;
    export type Event = WorkflowAfterDeleteEvent;
}
