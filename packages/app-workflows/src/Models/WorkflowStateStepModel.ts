import type { IWorkflowStateStep } from "~/types.js";
import { makeAutoObservable, runInAction, toJS } from "mobx";
import type { IWorkflowStateStepModel } from "./abstractions/WorkflowStateStepModel.js";

export class WorkflowStateStepModel implements IWorkflowStateStepModel {
    public id;
    public comment;
    public userId;
    public state;

    public constructor(data: IWorkflowStateStep) {
        this.id = data.id;
        this.comment = data.comment;
        this.userId = data.userId;
        this.state = data.state;

        makeAutoObservable(this);
    }

    public toJS(): IWorkflowStateStep {
        return toJS({
            id: this.id,
            comment: this.comment,
            userId: this.userId,
            state: this.state
        });
    }

    public updateStep(input: Partial<IWorkflowStateStep>) {
        runInAction(() => {
            Object.assign(this, input);
        });
    }
}
