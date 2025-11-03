import type {
    IWorkflowStatePresenter,
    IWorkflowStatePresenterViewModel
} from "./abstractions/WorkflowStatePresenter.js";
import type { IWorkflowsRepository, IWorkflowStateRepository } from "../Repositories/index.js";
import { makeAutoObservable, runInAction, toJS } from "mobx";
import {
    type IWorkflowStateModel,
    type IWorkflowStateStepModel,
    WorkflowStateModel
} from "~/Models/index.js";
import { type IIdentity, type IWorkflow, WorkflowStateValue } from "~/types.js";

export interface IWorkflowStatePresenterParams {
    repository: IWorkflowStateRepository;
    workflowsRepository: IWorkflowsRepository;
    app: string;
    targetRevisionId: string;
    title: string;
    identity: IIdentity | null;
}

export class WorkflowStatePresenter implements IWorkflowStatePresenter {
    private readonly repository;
    private readonly workflowsRepository;
    private workflow: IWorkflow | null = null;
    private readonly app;
    private readonly targetRevisionId;
    private readonly title;
    private readonly identity;
    private state: IWorkflowStateModel | null | undefined = undefined;
    private dialog:
        | "cancelReview"
        | "requestReview"
        | "start"
        | "start:success"
        | "approve"
        | "approve:success"
        | "reject"
        | "reject:success"
        | "comment"
        | null = null;
    step: IWorkflowStateStepModel | null = null;

    private get isOwner(): boolean {
        if (!this.identity) {
            return false;
        }
        return this.state?.createdBy?.id === this.identity.id;
    }
    /**
     * Determines whether the current user can cancel the review request.
     * User must be the owner of the requested review.
     * Previous step must not exist (only the initial request can be cancelled).
     * Current step must be in pending state.
     */
    private get canCancel(): boolean {
        if (!this.isOwner) {
            return false;
        } else if (this.state?.previousStep) {
            return false;
        } else if (
            this.state?.state === WorkflowStateValue.approved ||
            this.state?.state === WorkflowStateValue.rejected
        ) {
            return false;
        }
        return true;
    }

    get vm(): IWorkflowStatePresenterViewModel {
        return {
            workflow: this.workflow,
            state: this.state ? this.state.toJS() : null,
            step: toJS(this.step || this.state?.currentStep || null),
            lastApprovedStep: toJS(this.state?.lastApproved || null),
            lastRejectedStep: toJS(this.state?.lastRejected || null),
            nextStep: toJS(this.state ? this.state.nextStep : null),
            loading: this.repository.loading || this.workflowsRepository.loading,
            error: toJS(this.repository.error || this.workflowsRepository.error),
            app: this.app,
            id: this.targetRevisionId,
            canCancel: this.canCancel,
            dialog: this.dialog
        };
    }

    public constructor(params: IWorkflowStatePresenterParams) {
        this.repository = params.repository;
        this.workflowsRepository = params.workflowsRepository;
        this.app = params.app;
        this.title = params.title;
        this.identity = params.identity;
        this.targetRevisionId = params.targetRevisionId;

        makeAutoObservable(this);

        this.init();
    }

    private async init(): Promise<void> {
        /**
         * We do not want to load anything if there is no targetRevisionId.
         * This will effectively disable the workflow state functionality - nothing will get rendered.
         */
        if (!this.targetRevisionId) {
            return;
        }
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
            this.state = state ? WorkflowStateModel.create(state) : null;
        });
    }

    requestReview = async () => {
        const item = await this.repository.requestReview({
            app: this.app,
            targetRevisionId: this.targetRevisionId,
            title: this.title
        });
        runInAction(() => {
            this.state = item ? WorkflowStateModel.create(item) : null;
            this.dialog = null;
        });
    };

    start = async () => {
        const item = await this.repository.start({
            id: this.state!.id
        });
        runInAction(() => {
            this.state = item ? WorkflowStateModel.create(item) : null;
            if (!item) {
                return;
            }
            this.dialog = "start:success";
        });
    };

    approve = async (comment?: string) => {
        const item = await this.repository.approve({
            id: this.state!.id,
            comment
        });
        runInAction(() => {
            this.state = item ? WorkflowStateModel.create(item) : null;
            if (!item) {
                return;
            }
            this.dialog = "approve:success";
        });
    };

    reject = async (comment: string) => {
        const item = await this.repository.reject({
            id: this.state!.id,
            comment
        });
        runInAction(() => {
            this.state = item ? WorkflowStateModel.create(item) : null;
            if (!item) {
                return;
            }
            this.dialog = "reject:success";
        });
    };

    cancel = async () => {
        await this.repository.cancel(this.state!.id);
        runInAction(() => {
            this.state = null;
            this.dialog = null;
        });
    };

    showCancelReviewDialog = () => {
        runInAction(() => {
            this.dialog = "cancelReview";
        });
    };

    showRequestReviewDialog = () => {
        runInAction(() => {
            this.dialog = "requestReview";
        });
    };

    showStartDialog = () => {
        runInAction(() => {
            this.dialog = "start";
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
            this.step = null;
        });
    };

    showRejectDialog = () => {
        runInAction(() => {
            this.dialog = "reject";
        });
    };

    showCommentDialog = (id: string) => {
        const step = this.state?.steps.find(step => step.id === id);
        if (!step) {
            return;
        }
        runInAction(() => {
            this.step = step;
            this.dialog = "comment";
        });
    };
}
