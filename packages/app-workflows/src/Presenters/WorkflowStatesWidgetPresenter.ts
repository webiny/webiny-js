import type {
    IWorkflowStatesWidgetRepository,
    IWorkflowStatesWidgetRepositoryListResult
} from "~/Repositories/abstractions/WorkflowStatesWidgetRepository.js";
import type {
    IWorkflowStatesWidgetPresenter,
    IWorkflowStatesWidgetPresenterViewModel,
    IWorkflowStatesWidgetPresenterViewModelValues
} from "./abstractions/WorkflowStatesWidgetPresenter.js";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import { makeAutoObservable, observable, runInAction, set, toJS } from "mobx";
import type { NonEmptyArray } from "@webiny/app/types.js";

export interface IWorkflowStatesWidgetPresenterParams {
    repository: IWorkflowStatesWidgetRepository;
    type: "own" | "requested";
    states: NonEmptyArray<WorkflowStateValue>;
}

interface ITotals {
    key: WorkflowStateValue;
    value: number;
}

interface IResultData {
    key: WorkflowStateValue;
    items: IWorkflowState[];
    totalCount: number;
}

interface IWorkflowStatesData {
    items: IWorkflowState[];
    totals: ITotals[];
}

const mapListStatesResponse = (key: WorkflowStateValue) => {
    return (input: IWorkflowStatesWidgetRepositoryListResult): IResultData => {
        return {
            key,
            items: input.items,
            totalCount: input.totalCount
        };
    };
};

const mapPromiseAllResponse = (
    results: IResultData[]
): IWorkflowStatesWidgetPresenterViewModelValues => {
    return results.reduce<IWorkflowStatesWidgetPresenterViewModelValues>((output, result) => {
        output[result.key] = {
            items: result.items,
            total: result.totalCount
        };
        return output;
    }, {});
};

export class WorkflowStatesWidgetPresenter implements IWorkflowStatesWidgetPresenter {
    readonly #type;
    readonly #states;
    private readonly repository;
    private readonly items;
    private readonly totals;
    private dialog:
        | "approve"
        | "reject"
        | "approve:success"
        | "reject:success"
        | "start"
        | "start:success"
        | null;
    private state: IWorkflowState | null;

    private values;

    public get vm(): IWorkflowStatesWidgetPresenterViewModel {
        return {
            type: this.#type,
            states: this.#states,
            loading: toJS(this.repository.loading),
            error: toJS(this.repository.error),
            values: toJS(this.values),
            dialogLoading: this.repository.actionLoading,
            dialogError: this.repository.actionError,
            showStartDialog: this.dialog === "start" && this.state ? this.state : null,
            showStartSuccessDialog:
                this.dialog === "start:success" && this.state ? this.state : null,
            showApproveDialog: this.dialog === "approve" && this.state ? this.state : null,
            showApproveSuccessDialog:
                this.dialog === "approve:success" && this.state ? this.state : null,
            showRejectDialog: this.dialog === "reject" && this.state ? this.state : null,
            showRejectSuccessDialog:
                this.dialog === "reject:success" && this.state ? this.state : null
        };
    }

    public constructor(params: IWorkflowStatesWidgetPresenterParams) {
        this.repository = params.repository;
        this.#type = params.type;
        this.#states = params.states;
        this.values = observable.object<IWorkflowStatesWidgetPresenterViewModelValues>({});
        this.items = observable.array<IWorkflowState>([]);
        this.totals = observable.array<ITotals>([]);
        this.dialog = null;
        this.state = null;

        makeAutoObservable(this);

        this.init();
    }

    private async init(): Promise<void> {
        const result = await (this.#type === "requested" ? this.initRequested() : this.initOwn());

        runInAction(() => {
            for (const key in result) {
                set(this.values, key, result[key]);
            }
        });
    }

    private async initOwn() {
        return await Promise.all(
            this.#states.map(state => {
                return this.repository
                    .listOwnStates({
                        state,
                        limit: 5
                    })
                    .then(mapListStatesResponse(state));
            })
        ).then(mapPromiseAllResponse);
    }

    private async initRequested() {
        return await Promise.all(
            this.#states.map(state => {
                return this.repository
                    .listRequestedStates({
                        state,
                        limit: 5
                    })
                    .then(mapListStatesResponse(state));
            })
        ).then(mapPromiseAllResponse);
    }

    private increaseTotals(key: WorkflowStateValue): void {
        const total = this.totals.find(t => t.key === key);
        if (total) {
            total.value = total.value + 1;
            return;
        }
        this.totals.push({
            key,
            value: 1
        });
    }

    private decreaseTotals(key: WorkflowStateValue): void {
        const total = this.totals.find(t => t.key === key);
        if (!total?.value) {
            return;
        }

        total.value = total.value - 1;
        return;
    }

    startStateStep = async (state: IWorkflowState): Promise<void> => {
        const index = this.items.findIndex(
            item => item.id === state.id && item.state === WorkflowStateValue.pending
        );
        if (index === -1) {
            return;
        }
        const result = await this.repository.startStateStep({
            id: state.id
        });
        if (!result) {
            return;
        }
        runInAction(() => {
            this.items[index] = result;
            if (result.state === WorkflowStateValue.inReview) {
                this.decreaseTotals(WorkflowStateValue.pending);
                this.increaseTotals(WorkflowStateValue.inReview);
            }
            this.state = result;
            this.dialog = "start:success";
        });
    };

    approveStateStep = async (state: IWorkflowState, comment?: string): Promise<void> => {
        const index = this.items.findIndex(
            item => item.id === state.id && item.state === WorkflowStateValue.inReview
        );
        if (index === -1) {
            return;
        }
        const result = await this.repository.approveStateStep({
            id: state.id,
            comment
        });
        if (!result) {
            return;
        }
        runInAction(() => {
            this.items[index] = result;
            if (result.state === WorkflowStateValue.pending) {
                this.increaseTotals(WorkflowStateValue.pending);
            }
            this.decreaseTotals(WorkflowStateValue.inReview);
            this.state = result;
            this.dialog = "approve:success";
        });
    };

    rejectStateStep = async (state: IWorkflowState, comment: string): Promise<void> => {
        const index = this.items.findIndex(
            item => item.id === state.id && item.state === WorkflowStateValue.inReview
        );
        if (index === -1) {
            return;
        }
        const result = await this.repository.rejectStateStep({
            id: state.id,
            comment
        });
        if (!result) {
            return;
        }

        runInAction(() => {
            this.items[index] = result;
            if (result.state === WorkflowStateValue.rejected) {
                this.decreaseTotals(WorkflowStateValue.inReview);
            }
            this.state = result;
            this.dialog = "reject:success";
        });
    };

    showStartStateStepDialog = (state: IWorkflowState): void => {
        runInAction(() => {
            this.state = state;
            this.dialog = "start";
        });
    };

    showApproveStateStepDialog = (state: IWorkflowState): void => {
        runInAction(() => {
            this.state = state;
            this.dialog = "approve";
        });
    };

    showRejectStateStepDialog = (state: IWorkflowState): void => {
        runInAction(() => {
            this.state = state;
            this.dialog = "reject";
        });
    };

    hideDialog = (): void => {
        runInAction(() => {
            this.state = null;
            this.dialog = null;
        });
    };
}
