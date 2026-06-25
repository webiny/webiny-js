import { makeAutoObservable, runInAction, toJS } from "mobx";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/abstractions.js";
import { ListWorkflowsUseCase } from "~/features/listWorkflows/abstractions.js";
import { GetTargetWorkflowStateUseCase } from "~/features/getTargetWorkflowState/abstractions.js";
import { RequestReviewUseCase } from "~/features/requestReview/abstractions.js";
import { StartStepUseCase } from "~/features/startStep/abstractions.js";
import { ApproveStepUseCase } from "~/features/approveStep/abstractions.js";
import { RejectStepUseCase } from "~/features/rejectStep/abstractions.js";
import { TakeOverStepUseCase } from "~/features/takeOverStep/abstractions.js";
import { CancelWorkflowStateUseCase } from "~/features/cancelWorkflowState/abstractions.js";
import { WorkflowStateModel } from "~/domain/index.js";
import { WorkflowStateChangedEvent } from "~/domain/events.js";
import type { IWorkflowStateModel } from "~/domain/abstractions/WorkflowStateModel.js";
import type { IWorkflow, IWorkflowState } from "~/types.js";
import { WorkflowStateValue } from "~/types.js";
import {
    WorkflowStatePresenter as Abstraction,
    type IWorkflowStatePresenter,
    type IWorkflowStatePresenterViewModel,
    type IWorkflowStatePresenterViewModelDialog,
    type IWorkflowStateError
} from "./abstractions.js";

class WorkflowStatePresenterImpl implements IWorkflowStatePresenter {
    private _app: string = "";
    private _targetRevisionId: string = "";
    private _title: string = "";
    private _workflow: IWorkflow | null = null;
    private _state: IWorkflowStateModel | null | undefined = undefined;
    private _dialog: IWorkflowStatePresenterViewModelDialog | null = null;
    private _loading = false;
    private _executing = false;
    private _error: IWorkflowStateError | null = null;

    constructor(
        private listWorkflows: ListWorkflowsUseCase.Interface,
        private getTargetWorkflowState: GetTargetWorkflowStateUseCase.Interface,
        private requestReviewUseCase: RequestReviewUseCase.Interface,
        private startStepUseCase: StartStepUseCase.Interface,
        private approveStepUseCase: ApproveStepUseCase.Interface,
        private rejectStepUseCase: RejectStepUseCase.Interface,
        private takeOverStepUseCase: TakeOverStepUseCase.Interface,
        private cancelWorkflowStateUseCase: CancelWorkflowStateUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {
        makeAutoObservable<
            WorkflowStatePresenterImpl,
            | "listWorkflows"
            | "getTargetWorkflowState"
            | "requestReviewUseCase"
            | "startStepUseCase"
            | "approveStepUseCase"
            | "rejectStepUseCase"
            | "takeOverStepUseCase"
            | "cancelWorkflowStateUseCase"
            | "identityContext"
            | "eventPublisher"
        >(this, {
            listWorkflows: false,
            getTargetWorkflowState: false,
            requestReviewUseCase: false,
            startStepUseCase: false,
            approveStepUseCase: false,
            rejectStepUseCase: false,
            takeOverStepUseCase: false,
            cancelWorkflowStateUseCase: false,
            identityContext: false,
            eventPublisher: false
        });
    }

    private get identity() {
        try {
            const id = this.identityContext.getIdentity();
            return { id: id.id, displayName: id.displayName };
        } catch {
            return null;
        }
    }

    private get isOwner(): boolean {
        const identity = this.identity;
        if (!identity) {
            return false;
        }
        return this._state?.createdBy?.id === identity.id;
    }

    private get canCancel(): boolean {
        if (!this.isOwner) {
            return false;
        } else if (this._state?.previousStep) {
            return false;
        } else if (
            this._state?.state === WorkflowStateValue.approved ||
            this._state?.state === WorkflowStateValue.rejected
        ) {
            return false;
        }
        return true;
    }

    get vm(): IWorkflowStatePresenterViewModel {
        const stateValue = this._state?.state ?? null;

        return {
            workflow: toJS(this._workflow),
            state: this._state ? this._state.toJS() : (this._state as null | undefined),
            step: this._state?.currentStep?.toJS() ?? null,
            lastApprovedStep: toJS(this._state?.lastApproved ?? null),
            lastRejectedStep: toJS(this._state?.lastRejected ?? null),
            nextStep: toJS(this._state ? this._state.nextStep : null),
            loading: this._loading,
            executing: this._executing,
            error: this._error,
            app: this._app,
            id: this._targetRevisionId,
            canCancel: this.canCancel,
            dialog: this._dialog,
            hasWorkflow: this._workflow != null,
            hasState: this._state != null,
            isApproved: stateValue === WorkflowStateValue.approved,
            isRejected: stateValue === WorkflowStateValue.rejected,
            isPending: stateValue === WorkflowStateValue.pending,
            isInReview: stateValue === WorkflowStateValue.inReview
        };
    }

    async init(app: string, targetRevisionId: string, title: string): Promise<void> {
        this._app = app;
        this._targetRevisionId = targetRevisionId;
        this._title = title;
        this._workflow = null;
        this._state = undefined;
        this._dialog = null;
        this._error = null;

        if (!targetRevisionId) {
            return;
        }

        this._loading = true;

        try {
            const workflows = await this.listWorkflows.execute({ where: { app } });

            runInAction(() => {
                if (workflows.length === 0) {
                    this._workflow = null;
                    this._state = null;
                    this._loading = false;
                    return;
                }
                this._workflow = workflows[0];
            });

            if (!this._workflow) {
                return;
            }

            const state = await this.getTargetWorkflowState.execute({ app, targetRevisionId });

            runInAction(() => {
                this._state = state ? WorkflowStateModel.create(state) : null;
                this._loading = false;
            });
        } catch (err) {
            runInAction(() => {
                this._error = {
                    code: null,
                    message: err instanceof Error ? err.message : "Unknown error"
                };
                this._loading = false;
            });
        }
    }

    dispose(): void {
        this._app = "";
        this._targetRevisionId = "";
        this._title = "";
        this._workflow = null;
        this._state = undefined;
        this._dialog = null;
        this._loading = false;
        this._executing = false;
        this._error = null;
    }

    private setState(state: IWorkflowState | null) {
        this._state = state ? WorkflowStateModel.create(state) : null;
    }

    private publishStateChanged(state: IWorkflowState | null) {
        this.eventPublisher.publish(
            new WorkflowStateChangedEvent({
                app: this._app,
                targetRevisionId: this._targetRevisionId,
                state
            })
        );
    }

    requestReview = async () => {
        this._executing = true;
        try {
            const data = await this.requestReviewUseCase.execute({
                app: this._app,
                targetRevisionId: this._targetRevisionId,
                title: this._title
            });
            runInAction(() => {
                this.setState(data);
                this._dialog = null;
                this._executing = false;
            });
            this.publishStateChanged(data);
        } catch (err) {
            runInAction(() => {
                this._error = {
                    code: null,
                    message: err instanceof Error ? err.message : "Unknown error"
                };
                this._executing = false;
            });
        }
    };

    start = async () => {
        this._executing = true;
        try {
            const data = await this.startStepUseCase.execute({ id: this._state!.id });
            runInAction(() => {
                this.setState(data);
                this._dialog = { type: "start:success" };
                this._executing = false;
            });
            this.publishStateChanged(data);
        } catch (err) {
            runInAction(() => {
                this._error = {
                    code: null,
                    message: err instanceof Error ? err.message : "Unknown error"
                };
                this._executing = false;
            });
        }
    };

    approve = async (comment?: string) => {
        this._executing = true;
        try {
            const data = await this.approveStepUseCase.execute({ id: this._state!.id, comment });
            runInAction(() => {
                this.setState(data);
                this._dialog = { type: "approve:success" };
                this._executing = false;
            });
            this.publishStateChanged(data);
        } catch (err) {
            runInAction(() => {
                this._error = {
                    code: null,
                    message: err instanceof Error ? err.message : "Unknown error"
                };
                this._executing = false;
            });
        }
    };

    reject = async (comment: string) => {
        this._executing = true;
        try {
            const data = await this.rejectStepUseCase.execute({ id: this._state!.id, comment });
            runInAction(() => {
                this.setState(data);
                this._dialog = { type: "reject:success" };
                this._executing = false;
            });
            this.publishStateChanged(data);
        } catch (err) {
            runInAction(() => {
                this._error = {
                    code: null,
                    message: err instanceof Error ? err.message : "Unknown error"
                };
                this._executing = false;
            });
        }
    };

    cancel = async () => {
        this._executing = true;
        try {
            await this.cancelWorkflowStateUseCase.execute({ id: this._state!.id });
            runInAction(() => {
                this._state = null;
                this._dialog = null;
                this._executing = false;
            });
            this.publishStateChanged(null);
        } catch (err) {
            runInAction(() => {
                this._error = {
                    code: null,
                    message: err instanceof Error ? err.message : "Unknown error"
                };
                this._executing = false;
            });
        }
    };

    takeOver = async () => {
        this._executing = true;
        try {
            const data = await this.takeOverStepUseCase.execute({ id: this._state!.id });
            runInAction(() => {
                this.setState(data);
                this._dialog = { type: "takeOver:success", step: null };
                this._executing = false;
            });
            this.publishStateChanged(data);
        } catch (err) {
            runInAction(() => {
                this._error = {
                    code: null,
                    message: err instanceof Error ? err.message : "Unknown error"
                };
                this._executing = false;
            });
        }
    };

    showCancelReviewDialog = () => {
        this._dialog = { type: "cancelReview" };
    };

    showRequestReviewDialog = () => {
        this._dialog = { type: "requestReview" };
    };

    showStartDialog = () => {
        this._dialog = { type: "start" };
    };

    showApproveDialog = () => {
        this._dialog = { type: "approve" };
    };

    hideDialog = () => {
        this._dialog = null;
    };

    showRejectDialog = () => {
        this._dialog = { type: "reject" };
    };

    showCommentDialog = (id: string) => {
        const step = this._state?.steps.find(step => step.id === id);
        if (!step) {
            return;
        }
        this._dialog = { type: "comment", step };
    };

    showTakeOverDialog = () => {
        this._dialog = { type: "takeOver" };
    };
}

export const WorkflowStatePresenter = Abstraction.createImplementation({
    implementation: WorkflowStatePresenterImpl,
    dependencies: [
        ListWorkflowsUseCase,
        GetTargetWorkflowStateUseCase,
        RequestReviewUseCase,
        StartStepUseCase,
        ApproveStepUseCase,
        RejectStepUseCase,
        TakeOverStepUseCase,
        CancelWorkflowStateUseCase,
        IdentityContext,
        EventPublisher
    ]
});
