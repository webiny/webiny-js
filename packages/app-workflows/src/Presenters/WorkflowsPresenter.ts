import type {
    IWorkflowsPresenter,
    IWorkflowsViewModel
} from "./abstractions/WorkflowsPresenter.js";
import type { IWorkflowsRepository } from "../Repositories/index.js";
import { makeAutoObservable, runInAction } from "mobx";
import type { IWorkflowModel } from "~/Models/index.js";
import type { IWorkflowStep } from "~/types.js";

export interface IWorkflowsPresenterParams {
    repository: IWorkflowsRepository;
}

export class WorkflowsPresenter implements IWorkflowsPresenter {
    private readonly repository;

    get vm(): IWorkflowsViewModel {
        const workflows = this.repository.workflows;
        const workflow = workflows[0] || null;
        return {
            workflows,
            dirty: workflow ? workflow.steps.length > 0 : false,
            workflow,
            loading: this.repository.loading,
            error: this.repository.error
        };
    }

    public constructor(params: IWorkflowsPresenterParams) {
        this.repository = params.repository;

        makeAutoObservable(this);
    }

    updateWorkflow = (workflow: IWorkflowModel): void => {
        this.repository.save(workflow.toJS());
    };

    getWorkflow = () => {
        return this.repository.workflows[0];
    };

    addStep = (step: IWorkflowStep): void => {
        const workflow = this.getWorkflow();
        workflow.addStep(step);
    };

    updateStep = (step: IWorkflowStep): void => {
        const workflow = this.getWorkflow();
        workflow.updateStep(step);
    };

    removeStep = ({ id }: Pick<IWorkflowStep, "id">): void => {
        const workflow = this.getWorkflow();
        workflow.removeStep(id);
    };

    canMoveStepUp = (step: Pick<IWorkflowStep, "id">): boolean => {
        const workflow = this.getWorkflow();
        const stepIndex = workflow.steps.findIndex(s => s.id === step.id);
        return stepIndex > 0;
    };

    moveStepUp = (step: Pick<IWorkflowStep, "id">): void => {
        const workflow = this.getWorkflow();
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
        const workflow = this.getWorkflow();
        const stepIndex = workflow.steps.findIndex(s => s.id === step.id);
        return stepIndex < workflow.steps.length - 1;
    };

    moveStepDown = (step: Pick<IWorkflowStep, "id">): void => {
        const workflow = this.getWorkflow();
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
