import type {
    IWorkflowStatePresenter,
    IWorkflowStatePresenterViewModel
} from "./abstractions/WorkflowStatePresenter.js";
import type { IWorkflowsRepository, IWorkflowStateRepository } from "../Repositories/index.js";
import { makeAutoObservable, runInAction, toJS } from "mobx";
import { type IWorkflowStateModel, WorkflowStateModel } from "~/Models/index.js";
import { type IIdentity, type IWorkflow, WorkflowStateValue } from "~/types.js";

export interface IWorkflowStatePresenterParams {
    repository: IWorkflowStateRepository;
    workflowsRepository: IWorkflowsRepository;
    app: string;
    targetRevisionId: string;
    identity: IIdentity;
}

export class WorkflowStatePresenter implements IWorkflowStatePresenter {
    private readonly repository;
    private readonly workflowsRepository;
    private workflow: IWorkflow | null = null;
    private readonly app;
    private readonly targetRevisionId;
    private readonly identity;
    private state: IWorkflowStateModel | null | undefined = undefined;
    private dialog: "approve" | "reject" | null = null;

    private get isOwner(): boolean {
        return this.state?.createdBy?.id === this.identity.id;
    }
    /**
     * Determines whether the current user can start the step review.
     * User must not be the owner of the requested review, there must be a current step,
     * and the workflow state must be pending.
     */
    private get canStartStepReview(): boolean {
        if (this.isOwner) {
            return false;
        } else if (!this.state?.currentStep) {
            return false;
        } else if (this.state.state !== WorkflowStateValue.pending) {
            return false;
        }
        return true;
    }
    /**
     * Determines whether the current user can cancel the review request.
     * User must be the owner of the requested review and current step must exist.
     */
    private get canCancel(): boolean {
        return this.isOwner && !!this.state?.currentStep;
    }

    private get canReview(): boolean {
        if (this.state?.state !== WorkflowStateValue.inReview) {
            return false;
        } else if (this.isOwner) {
            return false;
        }
        return !!this.state.currentStep;
    }

    get vm(): IWorkflowStatePresenterViewModel {
        return {
            workflow: this.workflow,
            state: this.state ? this.state.toJS() : null,
            step: toJS(this.state ? this.state.currentStep : null),
            nextStep: toJS(this.state ? this.state.nextStep : null),
            loading: this.repository.loading || this.workflowsRepository.loading,
            error: toJS(this.repository.error || this.workflowsRepository.error),
            app: this.app,
            id: this.targetRevisionId,
            canStartStepReview: this.canStartStepReview,
            canCancel: this.canCancel,
            canReview: this.canReview,
            showApproveDialog: this.dialog === "approve",
            showRejectDialog: this.dialog === "reject"
        };
    }

    public constructor(params: IWorkflowStatePresenterParams) {
        this.repository = params.repository;
        this.workflowsRepository = params.workflowsRepository;
        this.app = params.app;
        this.targetRevisionId = params.targetRevisionId;
        this.identity = params.identity;

        makeAutoObservable(this);
    }

    public async init(): Promise<void> {
        const workflows = await this.workflowsRepository.listWorkflows({
            where: {
                app: this.app
            }
        });
        runInAction(() => {
            if (workflows.length === 0) {
                this.workflow = null;
                this.state = null;
                return;
            }
            this.workflow = workflows[0];
        });
        if (!this.workflow) {
            return;
        }

        const state = await this.repository.getTargetState(this.app, this.targetRevisionId);
        runInAction(() => {
            this.state = state ? new WorkflowStateModel(state) : null;
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

    start = async () => {
        const item = await this.repository.start({
            id: this.state!.id
        });
        runInAction(() => {
            this.state = item ? new WorkflowStateModel(item) : null;
        });
    };

    approve = async (comment?: string) => {
        const item = await this.repository.approve({
            id: this.state!.id,
            comment
        });
        runInAction(() => {
            this.state = item ? new WorkflowStateModel(item) : null;
        });
    };

    reject = async (comment: string) => {
        const item = await this.repository.reject({
            id: this.state!.id,
            comment
        });
        runInAction(() => {
            this.state = item ? new WorkflowStateModel(item) : null;
        });
    };

    cancel = async () => {
        await this.repository.cancel(this.state!.id);
        runInAction(() => {
            this.state = null;
        });
    };

    showApproveDialog = () => {
        runInAction(() => {
            this.dialog = "approve";
        });
    };

    hideDialog = () => {
        runInAction(() => {
            this.dialog = null;
        });
    };

    showRejectDialog = () => {
        runInAction(() => {
            this.dialog = "reject";
        });
    };
}
