import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { WorkflowStateCancelPayload } from "./abstractions.js";

export class WorkflowStateCancelEvent extends DomainEvent<WorkflowStateCancelPayload> {
    eventType = "workflowState.cancel" as const;

    getHandlerAbstraction() {
        return WorkflowStateCancelHandler;
    }
}

export const WorkflowStateCancelHandler = createAbstraction<
    IEventHandler<WorkflowStateCancelEvent>
>("WorkflowStateCancelHandler");

export namespace WorkflowStateCancelHandler {
    export type Interface = IEventHandler<WorkflowStateCancelEvent>;
    export type Event = WorkflowStateCancelEvent;
}
