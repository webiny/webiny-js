import type {
    IWorkflowsPresenter,
    IWorkflowsViewModel
} from "./abstractions/WorkflowsPresenter.js";
import type { IWorkflowsRepository } from "../Repositories/index.js";
import { makeAutoObservable, observable, runInAction, toJS } from "mobx";
import type { IWorkflow, IWorkflowApplication, IWorkflowStep } from "~/types.js";
import { type IWorkflowModel, WorkflowModel } from "~/Models/index.js";

export interface IWorkflowsPresenterParams {
    app: IWorkflowApplication;
    repository: IWorkflowsRepository;
    defaultWorkflow: IWorkflow;
}

export class WorkflowsPresenter implements IWorkflowsPresenter {
    private readonly app;
    private readonly repository;
    private readonly workflows;
    private readonly defaultWorkflow;

    get vm(): IWorkflowsViewModel {
        const workflow = this.workflows[0] || null;
        return {
            workflows: this.workflows.map(w => w.toJS()),
            dirty: workflow ? workflow.dirty : false,
            workflow: workflow ? workflow.toJS() : null,
            loading: this.repository.loading,
            error: toJS(this.repository.error),
            app: this.app
        };
    }

    public constructor(params: IWorkflowsPresenterParams) {
        this.app = params.app;
        this.repository = params.repository;
        this.defaultWorkflow = params.defaultWorkflow;

        this.workflows = observable.array<IWorkflowModel>([]);

        makeAutoObservable(this);
    }

    public async init(): Promise<void> {
        const workflows = await this.repository.listWorkflows({
            where: {
                app: this.app.id
            }
        });
        if (workflows.length === 0) {
            workflows.push(this.defaultWorkflow);
        }

        runInAction(() => {
            this.workflows.replace(workflows.map(w => new WorkflowModel(w)));
        });
    }

    updateWorkflow = (workflow: IWorkflow): void => {
        this.repository.save(toJS(workflow));
    };

    deleteWorkflow(workflow: IWorkflow) {
        this.repository.remove(workflow.id);
    }

    getWorkflow = () => {
        return this.workflows[0];
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
