import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WorkflowStateAfterDeletePayload } from "./abstractions.js";

export class WorkflowStateAfterDeleteEvent extends DomainEvent<WorkflowStateAfterDeletePayload> {
    eventType = "workflowState.afterDelete" as const;

    getHandlerAbstraction() {
        return WorkflowStateAfterDeleteHandler;
    }
}

export const WorkflowStateAfterDeleteHandler = createAbstraction<
    IEventHandler<WorkflowStateAfterDeleteEvent>
>("WorkflowStateAfterDeleteHandler");

export namespace WorkflowStateAfterDeleteHandler {
    export type Interface = IEventHandler<WorkflowStateAfterDeleteEvent>;
    export type Event = WorkflowStateAfterDeleteEvent;
}
