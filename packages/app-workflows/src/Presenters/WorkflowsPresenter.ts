import type { IWorkflowsPresenter, IWorkflowsViewModel } from "./abstractions/WorkflowsPresenter.js";
import type { IWorkflowsRepository } from "../Repositories/index.js";
import { makeAutoObservable, runInAction } from "mobx";
import type { IWorkflowModel } from "~/Models/index.js";
import type { IWorkflowStep } from "~/types.js";

export interface IWorkflowsPresenterParams {
    repository: IWorkflowsRepository;
}

export class WorkflowsPresenter implements IWorkflowsPresenter {
    private readonly repository;
    private current: IWorkflowModel;

    get vm(): IWorkflowsViewModel {
        return {
            dirty: this.current.steps.length > 0,
            workflow: this.current,
            loading: this.repository.loading,
            error: this.repository.error,
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
        this.repository.save(workflow.toJS());
    };

    setCurrentWorkflow = (id: string): void => {
        this._setCurrentWorkflow(id);
    };

    getWorkflow = () => {
        return this.getCurrentWorkflow();
    };

    addStep = (step: IWorkflowStep): void => {
        const workflow = this.getCurrentWorkflow();
        workflow.addStep(step);
    };

    updateStep = (step: IWorkflowStep): void => {
        const workflow = this.getCurrentWorkflow();
        workflow.updateStep(step);
    };

    removeStep = ({ id }: Pick<IWorkflowStep, "id">): void => {
        const workflow = this.getCurrentWorkflow();
        workflow.removeStep(id);
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
        });
    };
}
