import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WorkflowStateRejectPayload } from "./abstractions.js";

export class WorkflowStateRejectEvent extends DomainEvent<WorkflowStateRejectPayload> {
    eventType = "workflowState.reject" as const;

    getHandlerAbstraction() {
        return WorkflowStateRejectHandler;
    }
}

export const WorkflowStateRejectHandler = createAbstraction<
    IEventHandler<WorkflowStateRejectEvent>
>("WorkflowStateRejectHandler");

export namespace WorkflowStateRejectHandler {
    export type Interface = IEventHandler<WorkflowStateRejectEvent>;
    export type Event = WorkflowStateRejectEvent;
}
