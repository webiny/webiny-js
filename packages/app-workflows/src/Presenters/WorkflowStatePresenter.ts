import type {
    IWorkflowStatePresenter,
    IWorkflowStatePresenterViewModel
} from "./abstractions/WorkflowStatePresenter.js";
import type { IWorkflowStateRepository } from "../Repositories/index.js";
import { makeAutoObservable, runInAction, toJS } from "mobx";
import { type IWorkflowStateModel, WorkflowStateModel } from "~/Models/index.js";
import type { IIdentity } from "~/types.js";

export interface IWorkflowStatePresenterParams {
    repository: IWorkflowStateRepository;
    app: string;
    targetRevisionId: string;
    identity: IIdentity;
}

export class WorkflowStatePresenter implements IWorkflowStatePresenter {
    private readonly repository;
    private readonly app;
    private readonly targetRevisionId;
    private readonly identity;
    private state: IWorkflowStateModel | null | undefined = undefined;

    get vm(): IWorkflowStatePresenterViewModel {
        return {
            state: this.state ? this.state.toJS() : null,
            step: toJS(this.state ? this.state.currentStep : null),
            loading: this.repository.loading,
            error: toJS(this.repository.error),
            app: this.app,
            id: this.targetRevisionId,
            isOwner: this.state?.createdBy?.id === this.identity.id
        };
    }

    public constructor(params: IWorkflowStatePresenterParams) {
        this.repository = params.repository;
        this.app = params.app;
        this.targetRevisionId = params.targetRevisionId;
        this.identity = params.identity;

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

    approve = async (comment?: string) => {
        const item = await this.repository.approve({
            id: this.targetRevisionId,
            comment
        });
        runInAction(() => {
            this.state = item ? new WorkflowStateModel(item) : null;
        });
    };

    reject = async (comment: string) => {
        const item = await this.repository.reject({
            id: this.targetRevisionId,
            comment
        });
        runInAction(() => {
            this.state = item ? new WorkflowStateModel(item) : null;
        });
    };

    cancel = async () => {
        await this.repository.cancel(this.targetRevisionId);
        runInAction(() => {
            this.state = null;
        });
    };
}
