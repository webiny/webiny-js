import { createAbstraction } from "@webiny/feature/admin";
import { BaseEvent, type IEventHandler } from "@webiny/app/features/eventPublisher/abstractions.js";
import type { IWorkflowState } from "~/types.js";

export interface WorkflowStateChangedPayload {
    app: string;
    targetRevisionId: string;
    state: IWorkflowState | null;
}

export const WorkflowStateChangedHandler = createAbstraction<
    IEventHandler<WorkflowStateChangedEvent>
>("WorkflowStateChangedHandler");

export namespace WorkflowStateChangedHandler {
    export type Interface = IEventHandler<WorkflowStateChangedEvent>;
    export type Event = WorkflowStateChangedEvent;
}

export class WorkflowStateChangedEvent extends BaseEvent<WorkflowStateChangedPayload> {
    eventType = "workflowState.changed" as const;

    getHandlerAbstraction() {
        return WorkflowStateChangedHandler;
    }
}
