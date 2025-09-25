export interface IWorkflowStepTeamInput {
    id: string;
}

export interface IWorkflowStepNotificationInput {
    id: string;
}

export interface IWorkflowStepInput {
    id: string;
    title: string;
    color: string;
    description?: string;
    teams: IWorkflowStepTeamInput[];
    notifications?: IWorkflowStepNotificationInput[];
}
export interface IWorkflowInput {
    id: string;
    name: string;
    steps: IWorkflowStepInput[];
}
