import type { IWorkflowStatesWidgetRepository } from "~/Repositories/abstractions/WorkflowStatesWidgetRepository.js";
import type {
    IWorkflowStatesWidgetPresenter,
    IWorkflowStatesWidgetPresenterViewModel
} from "./abstractions/WorkflowStatesWidgetPresenter.js";
import { type IWorkflowStatesWidgetItem, WorkflowStateValue } from "~/types.js";
import { type IObservableArray, makeAutoObservable, observable, runInAction, toJS } from "mobx";

export interface IWorkflowStatesOwnWidgetPresenterParams {
    repository: IWorkflowStatesWidgetRepository;
}

interface IWorkflowStatesOwnWidgetPresenterItems {
    inReview: IWorkflowStatesWidgetItem[];
    approved: IWorkflowStatesWidgetItem[];
    rejected: IWorkflowStatesWidgetItem[];
}

export class WorkflowStatesOwnWidgetPresenter implements IWorkflowStatesWidgetPresenter {
    readonly #repository;

    #inReview: IObservableArray<IWorkflowStatesWidgetItem>;
    #approved: IObservableArray<IWorkflowStatesWidgetItem>;
    #rejected: IObservableArray<IWorkflowStatesWidgetItem>;

    public get vm(): IWorkflowStatesWidgetPresenterViewModel {
        return {
            inReview: toJS(this.#inReview),
            approved: toJS(this.#approved),
            rejected: toJS(this.#rejected)
        };
    }

    public constructor(params: IWorkflowStatesOwnWidgetPresenterParams) {
        this.#repository = params.repository;

        this.#inReview = observable.array<IWorkflowStatesWidgetItem>([]);
        this.#approved = observable.array<IWorkflowStatesWidgetItem>([]);
        this.#rejected = observable.array<IWorkflowStatesWidgetItem>([]);

        makeAutoObservable(this);
    }

    public async init(): Promise<void> {
        const result = await Promise.all([
            this.#repository.listOwnStates(WorkflowStateValue.inReview).then(data => {
                return {
                    inReview: data
                };
            }),
            this.#repository.listOwnStates(WorkflowStateValue.approved).then(data => {
                return {
                    approved: data
                };
            }),
            this.#repository.listOwnStates(WorkflowStateValue.rejected).then(data => {
                return {
                    rejected: data
                };
            })
        ]).then(results => {
            return results.reduce<IWorkflowStatesOwnWidgetPresenterItems>(
                (output, result) => {
                    return {
                        ...output,
                        ...result
                    };
                },
                {
                    inReview: [],
                    approved: [],
                    rejected: []
                }
            );
        });

        runInAction(() => {
            this.#inReview.replace(result.inReview);
            this.#approved.replace(result.approved);
            this.#rejected.replace(result.rejected);
        });
    }
}
