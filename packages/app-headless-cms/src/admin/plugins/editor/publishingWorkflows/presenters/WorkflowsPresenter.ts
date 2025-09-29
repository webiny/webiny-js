import type { IWorkflowsPresenter, IWorkflowsViewModel } from "./abstractions/index.js";
import type { IWorkflowsRepository } from "../repositories/index.js";
import { makeAutoObservable } from "mobx";

export interface IWorkflowsPresenterParams {
    repository: IWorkflowsRepository;
}

export class WorkflowsPresenter implements IWorkflowsPresenter {
    private readonly repository;

    get vm(): IWorkflowsViewModel {
        return {} as IWorkflowsViewModel;
    }

    public constructor(params: IWorkflowsPresenterParams) {
        this.repository = params.repository;

        makeAutoObservable(this);
    }
}
