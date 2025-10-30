import type {
    IWorkflowStatesWidgetRepository,
    IWorkflowStatesWidgetRepositoryListResult
} from "~/Repositories/abstractions/WorkflowStatesWidgetRepository.js";
import type {
    IWorkflowStatesWidgetPresenter,
    IWorkflowStatesWidgetPresenterViewModel
} from "./abstractions/WorkflowStatesWidgetPresenter.js";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import { makeAutoObservable, observable, runInAction, toJS } from "mobx";

export interface IWorkflowStatesWidgetPresenterParams {
    repository: IWorkflowStatesWidgetRepository;
    type: "own" | "requested";
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

const toResultData = (key: WorkflowStateValue) => {
    
    return (input: IWorkflowStatesWidgetRepositoryListResult): IResultData =>  {
        return {
            key,
            items: input.items,
            totalCount: input.totalCount
        };
        
    }
}

const toResponseData = (results: IResultData[]): IWorkflowStatesData => {
        return results.reduce<IWorkflowStatesData>(
            (output, result) => {
                return {
                    items: output.items.concat(result.items),
                    totals: output.totals.concat({
                        key: result.key,
                        value: result.totalCount
                    })
                };
            },
            {
                items: [],
                totals: []
            }
        );
}

export class WorkflowStatesWidgetPresenter implements IWorkflowStatesWidgetPresenter {
    readonly #repository;
    readonly #type: "own" | "requested";
    readonly #items;
    readonly #totals;
    #dialog: "approve" | "decline" | "approve:success" | "decline:success" | null = null;
    #state: IWorkflowState | null = null;

    public get vm(): IWorkflowStatesWidgetPresenterViewModel {
        const approved = this.#totals.find(t => t.key === WorkflowStateValue.approved);
        const inReview = this.#totals.find(t => t.key === WorkflowStateValue.inReview);
        const rejected = this.#totals.find(t => t.key === WorkflowStateValue.rejected);
        const items = toJS(this.#items);
        return {
            loading: this.#repository.loading,
            error: this.#repository.error,
            approved: items.filter(item => item.state === WorkflowStateValue.approved),
            rejected: items.filter(item => item.state === WorkflowStateValue.rejected),
            inReview: items.filter(item => item.state === WorkflowStateValue.inReview),
            approvedCount: approved?.value || 0,
            inReviewCount: inReview?.value || 0,
            rejectedCount: rejected?.value || 0,
            showApproveDialog: this.#dialog === "approve",
            showApproveSuccessDialog: this.#dialog === "approve:success",
            showDeclineDialog: this.#dialog === "decline",
            showDeclineSuccessDialog: this.#dialog === "decline:success"
        };
    }

    public constructor(params: IWorkflowStatesWidgetPresenterParams) {
        this.#repository = params.repository;
        this.#type = params.type;
        this.#items = observable.array<IWorkflowState>([]);
        this.#totals = observable.array<ITotals>([]);

        makeAutoObservable(this);

        this.init();
    }

    private async init(): Promise<void> {
        const result = await (this.#type === "requested" ? this.initRequested() : this.initOwn());

        runInAction(() => {
            this.#items.replace(result.items);
            this.#totals.replace(result.totals);
        });
    }

    private async initOwn() {
        return await Promise.all([
            this.#repository
                .listOwnStates(WorkflowStateValue.inReview)
                .then(toResultData(WorkflowStateValue.inReview)),
            this.#repository
                .listOwnStates(WorkflowStateValue.approved)
                .then(toResultData(WorkflowStateValue.approved)),
            this.#repository
                .listOwnStates(WorkflowStateValue.rejected)
                .then(toResultData(WorkflowStateValue.rejected))
        ]).then(toResponseData);
    }

    private async initRequested() {
        return await Promise.all([
            this.#repository
                .listRequestedStates(WorkflowStateValue.inReview)
                .then(toResultData(WorkflowStateValue.inReview)),
            this.#repository
                .listRequestedStates(WorkflowStateValue.approved)
                .then(toResultData(WorkflowStateValue.approved)),
            this.#repository
                .listRequestedStates(WorkflowStateValue.rejected)
                .then(toResultData(WorkflowStateValue.rejected))
        ]).then(toResponseData);
    }

    approveState = async (state: IWorkflowState, comment?: string): Promise<void> => {
        const index = this.#items.findIndex(
            item => item.id === state.id && item.state === WorkflowStateValue.inReview
        );
        if (index === -1) {
            return;
        }
        const result = await this.#repository.approveState({
            id: state.id,
            comment
        });
        if (!result) {
            return;
        }
        runInAction(() => {
            this.#items[index] = result;
        });
    };

    declineState = async (state: IWorkflowState, comment: string): Promise<void> => {
        const index = this.#items.findIndex(
            item => item.id === state.id && item.state === WorkflowStateValue.inReview
        );
        if (index === -1) {
            return;
        }
        const result = await this.#repository.declineState({
            id: state.id,
            comment
        });
        if (!result) {
            return;
        }

        runInAction(() => {
            this.#items[index] = result;
        });
    };

    showApproveStateDialog = (state: IWorkflowState): void => {
        runInAction(() => {
            this.#state = state;
            this.#dialog = "approve";
        });
    };
    showDeclineStateDialog = (state: IWorkflowState): void => {
        runInAction(() => {
            this.#state = state;
            this.#dialog = "decline";
        });
    };
    hideDialog = (): void => {
        runInAction(() => {
            this.#state = null;
            this.#dialog = null;
        });
    };
}
