import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WorkflowStateAfterCreatePayload } from "./abstractions.js";

export class WorkflowStateAfterCreateEvent extends DomainEvent<WorkflowStateAfterCreatePayload> {
    eventType = "workflowState.afterCreate" as const;

    getHandlerAbstraction() {
        return WorkflowStateAfterCreateHandler;
    }
}

export const WorkflowStateAfterCreateHandler = createAbstraction<
    IEventHandler<WorkflowStateAfterCreateEvent>
>("WorkflowStateAfterCreateHandler");

export namespace WorkflowStateAfterCreateHandler {
    export type Interface = IEventHandler<WorkflowStateAfterCreateEvent>;
    export type Event = WorkflowStateAfterCreateEvent;
}
