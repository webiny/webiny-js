import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { WorkflowStateStartStepPayload } from "./abstractions.js";

export class WorkflowStateStartStepEvent extends DomainEvent<WorkflowStateStartStepPayload> {
    eventType = "workflowState.startStep" as const;

    getHandlerAbstraction() {
        return WorkflowStateStartStepHandler;
    }
}

export const WorkflowStateStartStepHandler = createAbstraction<
    IEventHandler<WorkflowStateStartStepEvent>
>("WorkflowStateStartStepHandler");

export namespace WorkflowStateStartStepHandler {
    export type Interface = IEventHandler<WorkflowStateStartStepEvent>;
    export type Event = WorkflowStateStartStepEvent;
}
