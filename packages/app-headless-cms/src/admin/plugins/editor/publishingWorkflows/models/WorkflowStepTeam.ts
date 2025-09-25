import { makeAutoObservable } from "mobx";
import type { IWorkflowStepTeam } from "~/types.js";
import type { IWorkflowStepTeamModel } from "./abstractions/WorkflowStepTeamModel.js";

export class WorkflowStepTeam implements IWorkflowStepTeamModel {
    public id: string;

    public constructor(data: IWorkflowStepTeam) {
        this.id = data.id;
        makeAutoObservable(this);
    }
}
