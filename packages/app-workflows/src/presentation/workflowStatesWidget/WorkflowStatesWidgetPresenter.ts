import { makeAutoObservable, observable, runInAction, set, toJS } from "mobx";
import { ListWorkflowStatesUseCase } from "~/features/listWorkflowStates/abstractions.js";
import { StartStepUseCase } from "~/features/startStep/abstractions.js";
import { ApproveStepUseCase } from "~/features/approveStep/abstractions.js";
import { RejectStepUseCase } from "~/features/rejectStep/abstractions.js";
import { TakeOverStepUseCase } from "~/features/takeOverStep/abstractions.js";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import type { NonEmptyArray } from "@webiny/app/types.js";
import {
    WorkflowStatesWidgetPresenter as Abstraction,
    type IWorkflowStatesWidgetPresenter,
    type IWorkflowStatesWidgetPresenterViewModel,
    type IWorkflowStatesWidgetPresenterInitParams,
    type IWorkflowStatesWidgetViewModelValues
} from "./abstractions.js";

type DialogType =
    | "approve"
    | "reject"
    | "approve:success"
    | "reject:success"
    | "start"
    | "start:success"
    | "takeOver"
    | "takeOver:success"
    | null;

class WorkflowStatesWidgetPresenterImpl implements IWorkflowStatesWidgetPresenter {
    private _type: "own" | "requested" = "own";
    private _states: NonEmptyArray<WorkflowStateValue> = [WorkflowStateValue.pending];
    private _loading = false;
    private _error: string | null = null;
    private _actionLoading = false;
    private _actionError: string | null = null;
    private _dialog: DialogType = null;
    private _dialogState: IWorkflowState | null = null;
    private _values = observable.object<IWorkflowStatesWidgetViewModelValues>({});

    constructor(
        private listWorkflowStatesUseCase: ListWorkflowStatesUseCase.Interface,
        private startStepUseCase: StartStepUseCase.Interface,
        private approveStepUseCase: ApproveStepUseCase.Interface,
        private rejectStepUseCase: RejectStepUseCase.Interface,
        private takeOverStepUseCase: TakeOverStepUseCase.Interface
    ) {
        makeAutoObservable<
            WorkflowStatesWidgetPresenterImpl,
            | "listWorkflowStatesUseCase"
            | "startStepUseCase"
            | "approveStepUseCase"
            | "rejectStepUseCase"
            | "takeOverStepUseCase"
        >(this, {
            listWorkflowStatesUseCase: false,
            startStepUseCase: false,
            approveStepUseCase: false,
            rejectStepUseCase: false,
            takeOverStepUseCase: false
        });
    }

    get vm(): IWorkflowStatesWidgetPresenterViewModel {
        return {
            type: this._type,
            states: this._states,
            loading: this._loading,
            error: this._error,
            actionLoading: this._actionLoading,
            actionError: this._actionError,
            values: toJS(this._values),
            showStartDialog: this._dialog === "start" ? this._dialogState : null,
            showStartSuccessDialog: this._dialog === "start:success" ? this._dialogState : null,
            showApproveDialog: this._dialog === "approve" ? this._dialogState : null,
            showApproveSuccessDialog: this._dialog === "approve:success" ? this._dialogState : null,
            showRejectDialog: this._dialog === "reject" ? this._dialogState : null,
            showRejectSuccessDialog: this._dialog === "reject:success" ? this._dialogState : null,
            showTakeOverDialog: this._dialog === "takeOver" ? this._dialogState : null,
            showTakeOverSuccessDialog:
                this._dialog === "takeOver:success" ? this._dialogState : null
        };
    }

    async init(params: IWorkflowStatesWidgetPresenterInitParams): Promise<void> {
        this._type = params.type;
        this._states = params.states;
        this._loading = true;
        this._error = null;

        try {
            const variant = params.type === "own" ? "own" : "requested";
            const results = await Promise.all(
                params.states.map(async state => {
                    const result = await this.listWorkflowStatesUseCase.execute(
                        { where: { state }, limit: 5 },
                        variant
                    );
                    return {
                        key: state,
                        items: result.data,
                        totalCount: result.meta?.totalCount ?? 0
                    };
                })
            );

            runInAction(() => {
                for (const result of results) {
                    set(this._values, result.key, {
                        items: result.items,
                        total: result.totalCount
                    });
                }
                this._loading = false;
            });
        } catch (err) {
            runInAction(() => {
                this._error = err instanceof Error ? err.message : "Unknown error";
                this._loading = false;
            });
        }
    }

    private moveStepBetweenStates(from: IWorkflowState, to: IWorkflowState): void {
        if (from.state === to.state) {
            return;
        }

        const fromValues = this._values[from.state];
        if (fromValues) {
            const fromItems = fromValues.items.filter(item => item.id !== from.id);
            set(this._values, from.state, { ...fromValues, items: fromItems });
        }

        const toValues = this._values[to.state];
        const toItems = [to, ...(toValues?.items || [])];
        set(this._values, to.state, { total: toValues?.total ?? 0, items: toItems });
    }

    private adjustTotal(key: WorkflowStateValue, delta: number): void {
        const value = this._values[key];
        if (!value) {
            if (delta > 0) {
                set(this._values, key, { items: [], total: delta });
            }
            return;
        }
        set(this._values, key, { ...value, total: Math.max(0, value.total + delta) });
    }

    startStateStep = async (state: IWorkflowState): Promise<void> => {
        this._actionLoading = true;
        this._actionError = null;

        try {
            const result = await this.startStepUseCase.execute({ id: state.id });
            runInAction(() => {
                this.moveStepBetweenStates(state, result);
                if (result.state === WorkflowStateValue.inReview) {
                    this.adjustTotal(WorkflowStateValue.pending, -1);
                    this.adjustTotal(WorkflowStateValue.inReview, 1);
                }
                this._dialogState = result;
                this._dialog = "start:success";
                this._actionLoading = false;
            });
        } catch (err) {
            runInAction(() => {
                this._actionError = err instanceof Error ? err.message : "Unknown error";
                this._actionLoading = false;
            });
        }
    };

    takeOverStateStep = async (state: IWorkflowState): Promise<void> => {
        this._actionLoading = true;
        this._actionError = null;

        try {
            const result = await this.takeOverStepUseCase.execute({ id: state.id });
            runInAction(() => {
                const key = WorkflowStateValue.inReview;
                const values = this._values[key];
                if (values) {
                    const items = values.items.map(item => (item.id === state.id ? result : item));
                    set(this._values, key, { ...values, items });
                }
                this._dialogState = result;
                this._dialog = "takeOver:success";
                this._actionLoading = false;
            });
        } catch (err) {
            runInAction(() => {
                this._actionError = err instanceof Error ? err.message : "Unknown error";
                this._actionLoading = false;
            });
        }
    };

    approveStateStep = async (state: IWorkflowState, comment?: string): Promise<void> => {
        this._actionLoading = true;
        this._actionError = null;

        try {
            const result = await this.approveStepUseCase.execute({ id: state.id, comment });
            runInAction(() => {
                this.moveStepBetweenStates(state, result);
                if (result.state === WorkflowStateValue.pending) {
                    this.adjustTotal(WorkflowStateValue.pending, 1);
                }
                this.adjustTotal(WorkflowStateValue.inReview, -1);
                this._dialogState = result;
                this._dialog = "approve:success";
                this._actionLoading = false;
            });
        } catch (err) {
            runInAction(() => {
                this._actionError = err instanceof Error ? err.message : "Unknown error";
                this._actionLoading = false;
            });
        }
    };

    rejectStateStep = async (state: IWorkflowState, comment: string): Promise<void> => {
        this._actionLoading = true;
        this._actionError = null;

        try {
            const result = await this.rejectStepUseCase.execute({ id: state.id, comment });
            runInAction(() => {
                this.moveStepBetweenStates(state, result);
                if (result.state === WorkflowStateValue.rejected) {
                    this.adjustTotal(WorkflowStateValue.inReview, -1);
                }
                this._dialogState = result;
                this._dialog = "reject:success";
                this._actionLoading = false;
            });
        } catch (err) {
            runInAction(() => {
                this._actionError = err instanceof Error ? err.message : "Unknown error";
                this._actionLoading = false;
            });
        }
    };

    showStartStateStepDialog = (state: IWorkflowState): void => {
        this._dialogState = state;
        this._dialog = "start";
    };

    showTakeOverStateStepDialog = (state: IWorkflowState): void => {
        this._dialogState = state;
        this._dialog = "takeOver";
    };

    showApproveStateStepDialog = (state: IWorkflowState): void => {
        this._dialogState = state;
        this._dialog = "approve";
    };

    showRejectStateStepDialog = (state: IWorkflowState): void => {
        this._dialogState = state;
        this._dialog = "reject";
    };

    hideDialog = (): void => {
        this._dialogState = null;
        this._dialog = null;
    };
}

export const WorkflowStatesWidgetPresenterImplementation = Abstraction.createImplementation({
    implementation: WorkflowStatesWidgetPresenterImpl,
    dependencies: [
        ListWorkflowStatesUseCase,
        StartStepUseCase,
        ApproveStepUseCase,
        RejectStepUseCase,
        TakeOverStepUseCase
    ]
});
