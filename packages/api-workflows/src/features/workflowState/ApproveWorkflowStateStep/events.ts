import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WorkflowStateApproveStepPayload } from "./abstractions.js";

export class WorkflowStateApproveStepEvent extends DomainEvent<WorkflowStateApproveStepPayload> {
    eventType = "workflowState.approveStep" as const;

    getHandlerAbstraction() {
        return WorkflowStateApproveStepHandler;
    }
}

export const WorkflowStateApproveStepHandler = createAbstraction<
    IEventHandler<WorkflowStateApproveStepEvent>
>("WorkflowStateApproveStepHandler");

export namespace WorkflowStateApproveStepHandler {
    export type Interface = IEventHandler<WorkflowStateApproveStepEvent>;
    export type Event = WorkflowStateApproveStepEvent;
}
