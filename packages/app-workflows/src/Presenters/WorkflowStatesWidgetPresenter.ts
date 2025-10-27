import type { IWorkflowStatesWidgetRepository } from "~/Repositories/abstractions/WorkflowStatesWidgetRepository.js";
import type {
    IWorkflowStatesWidgetPresenter,
    IWorkflowStatesWidgetPresenterViewModel
} from "./abstractions/WorkflowStatesWidgetPresenter.js";
import type { IIdentity } from "~/types.js";
import { makeAutoObservable } from "mobx";

export interface IWorkflowStatesWidgetPresenterParams {
    repository: IWorkflowStatesWidgetRepository;
    identity: IIdentity;
}

export class WorkflowStatesWidgetPresenter implements IWorkflowStatesWidgetPresenter {
    #repository;
    #identity;

    public get vm(): IWorkflowStatesWidgetPresenterViewModel {
        return {
            inReview: [],
            approved: [],
            declined: []
        };
    }

    public constructor(params: IWorkflowStatesWidgetPresenterParams) {
        this.#repository = params.repository;
        this.#identity = params.identity;

        makeAutoObservable(this);

        this.init();
    }

    private async init(): Promise<void> {
        //
    }
}
