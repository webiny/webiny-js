import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { WorkflowStateTakeOverStepPayload } from "./abstractions.js";

export class WorkflowStateTakeOverStepEvent extends DomainEvent<WorkflowStateTakeOverStepPayload> {
    eventType = "workflowState.takeOverStep" as const;

    getHandlerAbstraction() {
        return WorkflowStateTakeOverStepHandler;
    }
}

export const WorkflowStateTakeOverStepHandler = createAbstraction<
    IEventHandler<WorkflowStateTakeOverStepEvent>
>("WorkflowStateTakeOverStepHandler");

export namespace WorkflowStateTakeOverStepHandler {
    export type Interface = IEventHandler<WorkflowStateTakeOverStepEvent>;
    export type Event = WorkflowStateTakeOverStepEvent;
}
