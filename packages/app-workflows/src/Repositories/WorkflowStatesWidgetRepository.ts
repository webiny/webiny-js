import type { IWorkflowStatesWidgetRepository } from "./abstractions/WorkflowStatesWidgetRepository.js";
import { makeAutoObservable } from "mobx";

export interface IWorkflowStatesWidgetRepositoryParams {
    //
}

export class WorkflowStatesWidgetRepository implements IWorkflowStatesWidgetRepository {
    public constructor(params: IWorkflowStatesWidgetRepositoryParams) {
        //

        makeAutoObservable(this);
    }
}
