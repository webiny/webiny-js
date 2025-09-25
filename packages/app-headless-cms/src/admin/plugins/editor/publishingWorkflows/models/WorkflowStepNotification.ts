import { makeAutoObservable } from "mobx";
import type { IWorkflowStepNotification } from "~/types.js";
import type { IWorkflowStepNotificationModel } from "./abstractions/WorkflowStepNotificationModel.js";

export class WorkflowStepNotification implements IWorkflowStepNotificationModel {
    public id: string;

    public constructor(data: IWorkflowStepNotification) {
        this.id = data.id;
        makeAutoObservable(this);
    }
}
