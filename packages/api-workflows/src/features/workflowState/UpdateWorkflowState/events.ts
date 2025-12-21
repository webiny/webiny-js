import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { WorkflowStateAfterUpdatePayload } from "./abstractions.js";

export class WorkflowStateAfterUpdateEvent extends DomainEvent<WorkflowStateAfterUpdatePayload> {
    eventType = "workflowState.afterUpdate" as const;

    getHandlerAbstraction() {
        return WorkflowStateAfterUpdateHandler;
    }
}

export const WorkflowStateAfterUpdateHandler = createAbstraction<
    IEventHandler<WorkflowStateAfterUpdateEvent>
>("WorkflowStateAfterUpdateHandler");

export namespace WorkflowStateAfterUpdateHandler {
    export type Interface = IEventHandler<WorkflowStateAfterUpdateEvent>;
    export type Event = WorkflowStateAfterUpdateEvent;
}
