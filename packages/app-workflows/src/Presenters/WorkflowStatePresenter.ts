import type {
    IWorkflowStatePresenter,
    IWorkflowStatePresenterViewModel
} from "./abstractions/WorkflowStatePresenter.js";
import type { IWorkflowStateRepository } from "../Repositories/index.js";
import { makeAutoObservable, runInAction, toJS } from "mobx";
import { type IWorkflowStateModel, WorkflowStateModel } from "~/Models/index.js";

export interface IWorkflowStatePresenterParams {
    repository: IWorkflowStateRepository;
    app: string;
    targetRevisionId: string;
}

export class WorkflowStatePresenter implements IWorkflowStatePresenter {
    private readonly repository;
    private readonly app: string;
    private readonly targetRevisionId: string;
    private state: IWorkflowStateModel | null | undefined = undefined;

    get vm(): IWorkflowStatePresenterViewModel {
        return {
            state: toJS(this.state),
            loading: this.repository.loading,
            error: toJS(this.repository.error),
            app: this.app,
            id: this.targetRevisionId
        };
    }

    public constructor(params: IWorkflowStatePresenterParams) {
        this.repository = params.repository;
        this.app = params.app;
        this.targetRevisionId = params.targetRevisionId;

        makeAutoObservable(this);
    }

    public async init(): Promise<void> {
        const item = await this.repository.getTargetState(this.app, this.targetRevisionId);
        runInAction(() => {
            this.state = item ? new WorkflowStateModel(item) : null;
        });
    }

    requestReview = async () => {
        const item = await this.repository.requestReview({
            app: this.app,
            targetRevisionId: this.targetRevisionId
        });
        runInAction(() => {
            this.state = item ? new WorkflowStateModel(item) : null;
        });
    };
}
