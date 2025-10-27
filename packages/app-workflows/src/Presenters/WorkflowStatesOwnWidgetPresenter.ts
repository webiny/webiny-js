import type { IWorkflowStatesWidgetRepository } from "~/Repositories/abstractions/WorkflowStatesWidgetRepository.js";
import type {
    IWorkflowStatesWidgetPresenter,
    IWorkflowStatesWidgetPresenterViewModel
} from "./abstractions/WorkflowStatesWidgetPresenter.js";
import { type IIdentity, type IWorkflowStatesWidgetItem, WorkflowStateValue } from "~/types.js";
import { makeAutoObservable } from "mobx";

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

    #items: IWorkflowStatesOwnWidgetPresenterItems = {
        inReview: [],
        approved: [],
        rejected: []
    };

    public get vm(): IWorkflowStatesWidgetPresenterViewModel {
        return {
            inReview: this.#items.inReview,
            approved: this.#items.approved,
            rejected: this.#items.rejected
        };
    }

    public constructor(params: IWorkflowStatesOwnWidgetPresenterParams) {
        this.#repository = params.repository;

        makeAutoObservable(this);

        this.init();
    }

    private async init(): Promise<void> {
        this.#items = await Promise.all([
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
    }
}
