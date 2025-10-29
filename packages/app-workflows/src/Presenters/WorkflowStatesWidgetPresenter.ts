import type { IWorkflowStatesWidgetRepository } from "~/Repositories/abstractions/WorkflowStatesWidgetRepository.js";
import type {
    IWorkflowStatesWidgetPresenter,
    IWorkflowStatesWidgetPresenterViewModel
} from "./abstractions/WorkflowStatesWidgetPresenter.js";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import { type IObservableArray, makeAutoObservable, observable, runInAction, toJS } from "mobx";

export interface IWorkflowStatesWidgetPresenterParams {
    repository: IWorkflowStatesWidgetRepository;
    type: "own" | "requested";
}

interface IWorkflowStatesWidgetPresenterItems {
    inReview: IWorkflowState[];
    inReviewTotalCount: number;
    approved: IWorkflowState[];
    approvedTotalCount: number;
    rejected: IWorkflowState[];
    rejectedTotalCount: number;
}

export class WorkflowStatesWidgetPresenter implements IWorkflowStatesWidgetPresenter {
    readonly #repository;
    readonly #type: "own" | "requested";

    #inReview: IObservableArray<IWorkflowState>;
    #inReviewTotalCount: number = 0;
    #approved: IObservableArray<IWorkflowState>;
    #approvedTotalCount: number = 0;
    #rejected: IObservableArray<IWorkflowState>;
    #rejectedTotalCount: number = 0;

    public get vm(): IWorkflowStatesWidgetPresenterViewModel {
        return {
            loading: this.#repository.loading,
            error: this.#repository.error,
            inReview: toJS(this.#inReview),
            inReviewTotalCount: this.#inReviewTotalCount,
            approved: toJS(this.#approved),
            approvedTotalCount: this.#approvedTotalCount,
            rejected: toJS(this.#rejected),
            rejectedTotalCount: this.#rejectedTotalCount
        };
    }

    public constructor(params: IWorkflowStatesWidgetPresenterParams) {
        this.#repository = params.repository;
        this.#type = params.type;

        this.#inReview = observable.array<IWorkflowState>([]);
        this.#approved = observable.array<IWorkflowState>([]);
        this.#rejected = observable.array<IWorkflowState>([]);

        makeAutoObservable(this);

        this.init();
    }

    private async init(): Promise<void> {
        const result = await (this.#type === "requested" ? this.initRequested() : this.initOwn());

        runInAction(() => {
            this.#inReview.replace(result.inReview);
            this.#inReviewTotalCount = result.inReviewTotalCount;
            this.#approved.replace(result.approved);
            this.#approvedTotalCount = result.approvedTotalCount;
            this.#rejected.replace(result.rejected);
            this.#rejectedTotalCount = result.rejectedTotalCount;
        });
    }

    private async initOwn() {
        return await Promise.all([
            this.#repository.listOwnStates(WorkflowStateValue.inReview).then(data => {
                return {
                    inReview: data.items,
                    inReviewTotalCount: data.totalCount
                };
            }),
            this.#repository.listOwnStates(WorkflowStateValue.approved).then(data => {
                return {
                    approved: data.items,
                    approvedTotalCount: data.totalCount
                };
            }),
            this.#repository.listOwnStates(WorkflowStateValue.rejected).then(data => {
                return {
                    rejected: data.items,
                    rejectedTotalCount: data.totalCount
                };
            })
        ]).then(results => {
            return results.reduce<IWorkflowStatesWidgetPresenterItems>(
                (output, result) => {
                    return {
                        ...output,
                        ...result
                    };
                },
                {
                    inReview: [],
                    inReviewTotalCount: 0,
                    approved: [],
                    approvedTotalCount: 0,
                    rejected: [],
                    rejectedTotalCount: 0
                }
            );
        });
    }

    private async initRequested() {
        return await Promise.all([
            this.#repository.listRequestedStates(WorkflowStateValue.inReview).then(data => {
                return {
                    inReview: data.items,
                    inReviewTotalCount: data.totalCount
                };
            }),
            this.#repository.listRequestedStates(WorkflowStateValue.approved).then(data => {
                return {
                    approved: data.items,
                    approvedTotalCount: data.totalCount
                };
            }),
            this.#repository.listRequestedStates(WorkflowStateValue.rejected).then(data => {
                return {
                    rejected: data.items,
                    rejectedTotalCount: data.totalCount
                };
            })
        ]).then(results => {
            return results.reduce<IWorkflowStatesWidgetPresenterItems>(
                (output, result) => {
                    return {
                        ...output,
                        ...result
                    };
                },
                {
                    inReview: [],
                    inReviewTotalCount: 0,
                    approved: [],
                    approvedTotalCount: 0,
                    rejected: [],
                    rejectedTotalCount: 0
                }
            );
        });
    }
}
