import type {
    IWorkflowStateIdentity,
    IWorkflowStateRecordStep,
    WorkflowStateRecordState
} from "~/context/abstractions/WorkflowState.js";

export interface IWidgetWorkflowState {
    id: string;
    app: string;
    state: WorkflowStateRecordState;
    savedBy: IWorkflowStateIdentity;
    savedOn: Date;
    step: IWorkflowStateRecordStep;
    title: string;
    targetRevisionId: string;
}
