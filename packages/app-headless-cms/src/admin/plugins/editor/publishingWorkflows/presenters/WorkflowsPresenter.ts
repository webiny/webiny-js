import type { IWorkflowsPresenter, IWorkflowsViewModel } from "./abstractions/index.js";
import type { IWorkflowsRepository } from "../repositories/index.js";
import { makeAutoObservable, runInAction } from "mobx";
import type { IWorkflowModel } from "~/admin/plugins/editor/publishingWorkflows/models/index.js";
import type { IWorkflowStep } from "@webiny/app-headless-cms-common/types/index.js";

export interface IWorkflowsPresenterParams {
    repository: IWorkflowsRepository;
}

export class WorkflowsPresenter implements IWorkflowsPresenter {
    private readonly repository;
    private current: IWorkflowModel;

    get vm(): IWorkflowsViewModel {
        return {
            workflow: this.current
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

    private _setCurrentWorkflow(id: string): void {
        runInAction(() => {
            this.current = this.repository.findOne(id);
        });
    }

    updateWorkflow = (workflow: IWorkflowModel): void => {
        runInAction(() => {
            this.repository.save(workflow.toJS());
        });
    };

    setCurrentWorkflow = (id: string): void => {
        this._setCurrentWorkflow(id);
    };

    getWorkflow = () => {
        return this.getCurrentWorkflow();
    };

    addStep = (step: IWorkflowStep): void => {
        const workflow = this.getCurrentWorkflow();
        console.log({
            WorkflowsPresenter: true,
            addStep: true,
            step
        });
        workflow.addStep(step);
        runInAction(() => {
            this.repository.save(workflow.toJS());
        });
    };

    updateStep = (step: IWorkflowStep): void => {
        const workflow = this.getCurrentWorkflow();
        workflow.updateStep(step);
        runInAction(() => {
            this.repository.save(workflow.toJS());
        });
    };

    removeStep = ({ id }: Pick<IWorkflowStep, "id">): void => {
        const workflow = this.getCurrentWorkflow();
        workflow.removeStep(id);
        runInAction(() => {
            this.repository.save(workflow.toJS());
        });
    };

    canMoveStepUp = (step: Pick<IWorkflowStep, "id">): boolean => {
        const workflow = this.getCurrentWorkflow();
        const stepIndex = workflow.steps.findIndex(s => s.id === step.id);
        return stepIndex > 0;
    };

    moveStepUp = (step: Pick<IWorkflowStep, "id">): void => {
        const workflow = this.getCurrentWorkflow();
        if (this.canMoveStepUp(step) === false) {
            return;
        }
        const stepIndex = workflow.steps.findIndex(s => s.id === step.id);
        const steps = [...workflow.steps];
        const temp = steps[stepIndex - 1];
        steps[stepIndex - 1] = steps[stepIndex];
        steps[stepIndex] = temp;
        runInAction(() => {
            workflow.steps.replace(steps);

            this.repository.save(workflow.toJS());
        });
    };

    canMoveStepDown = (step: Pick<IWorkflowStep, "id">): boolean => {
        const workflow = this.getCurrentWorkflow();
        const stepIndex = workflow.steps.findIndex(s => s.id === step.id);
        return stepIndex < workflow.steps.length - 1;
    };

    moveStepDown = (step: Pick<IWorkflowStep, "id">): void => {
        const workflow = this.getCurrentWorkflow();
        if (this.canMoveStepDown(step) === false) {
            return;
        }
        const stepIndex = workflow.steps.findIndex(s => s.id === step.id);
        const steps = [...workflow.steps];
        const temp = steps[stepIndex + 1];
        steps[stepIndex + 1] = steps[stepIndex];
        steps[stepIndex] = temp;
        runInAction(() => {
            workflow.steps.replace(steps);
            this.repository.save(workflow.toJS());
        });
    };
}
