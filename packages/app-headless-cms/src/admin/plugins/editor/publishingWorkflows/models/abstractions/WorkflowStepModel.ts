import type { IWorkflowStep, IWorkflowStepNotification, IWorkflowStepTeam } from "~/types.js";

export interface IWorkflowStepModel extends IWorkflowStep {
    addTeam(team: IWorkflowStepTeam): void;
    removeTeam(id: string): void;
    addNotification(notification: IWorkflowStepNotification): void;
    removeNotification(id: string): void;
}
