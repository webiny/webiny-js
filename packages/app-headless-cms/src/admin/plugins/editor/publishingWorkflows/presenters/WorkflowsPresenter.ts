import type { IWorkflowsPresenter, IWorkflowsViewModel } from "./abstractions/index.js";
import type { IWorkflowsRepository } from "../repositories/index.js";
import { makeAutoObservable } from "mobx";
import type { IWorkflowModel } from "~/admin/plugins/editor/publishingWorkflows/models/index.js";

export interface IWorkflowsPresenterParams {
    repository: IWorkflowsRepository;
}

export class WorkflowsPresenter implements IWorkflowsPresenter {
    private readonly repository;
    private current: IWorkflowModel;

    get vm(): IWorkflowsViewModel {
        return {
            updateWorkflow: workflow => {
                this.repository.save(workflow);
            },
            setCurrentWorkflow: id => {
                this.setCurrentWorkflow(id);
            },
            getWorkflow: () => {
                return this.getCurrentWorkflow();
            },
            addStep: step => {
                const workflow = this.getCurrentWorkflow();
                workflow.addStep(step);
                this.repository.save(workflow.toJS());
            },
            updateStep: step => {
                const workflow = this.getCurrentWorkflow();
                workflow.updateStep(step);
                this.repository.save(workflow);
            },
            removeStep: ({ id }) => {
                const workflow = this.getCurrentWorkflow();
                workflow.removeStep(id);
                this.repository.save(workflow);
            }
        };
    }

    public constructor(params: IWorkflowsPresenterParams) {
        this.repository = params.repository;
        /**
         * Need to set the first workflow as current.
         */
        const workflow = this.repository.list().find(() => true);
        if (!workflow) {
            throw new Error("There are no workflows available.");
        }
        this.current = workflow;

        makeAutoObservable(this);
    }

    private getCurrentWorkflow(): IWorkflowModel {
        return this.current;
    }

    private setCurrentWorkflow(id: string): void {
        this.current = this.repository.findOne(id);
    }
}
