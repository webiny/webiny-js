import type {
    IWorkflowsPresenter,
    IWorkflowsViewModel
} from "./abstractions/WorkflowsPresenter.js";
import type {
    IWorkflowNotificationsRepository,
    IWorkflowsRepository
} from "../Repositories/index.js";
import { makeAutoObservable, observable, runInAction, toJS } from "mobx";
import type {
    IWorkflow,
    IWorkflowApplication,
    IWorkflowNotification,
    IWorkflowStep
} from "~/types.js";
import { type IWorkflowModel, WorkflowModel } from "~/Models/index.js";

export interface IWorkflowsPresenterParams {
    app: IWorkflowApplication;
    workflowsRepository: IWorkflowsRepository;
    notificationsRepository: IWorkflowNotificationsRepository;
    defaultWorkflow: IWorkflow;
}

export class WorkflowsPresenter implements IWorkflowsPresenter {
    private readonly app;
    private readonly workflowsRepository;
    private readonly notificationsRepository;
    private readonly workflows;
    private readonly notifications;
    private readonly defaultWorkflow;

    get vm(): IWorkflowsViewModel {
        const workflow = this.workflows[0] || null;
        return {
            workflows: this.workflows.map(w => w.toJS()),
            dirty: workflow ? workflow.dirty : false,
            workflow: workflow ? workflow.toJS() : null,
            notifications: this.notifications,
            loading: this.workflowsRepository.loading || this.notificationsRepository.loading,
            error: toJS(this.workflowsRepository.error || this.notificationsRepository.error),
            app: this.app
        };
    }

    public constructor(params: IWorkflowsPresenterParams) {
        this.app = params.app;
        this.workflowsRepository = params.workflowsRepository;
        this.notificationsRepository = params.notificationsRepository;
        this.defaultWorkflow = params.defaultWorkflow;

        this.workflows = observable.array<IWorkflowModel>([]);
        this.notifications = observable.array<IWorkflowNotification>([]);

        makeAutoObservable(this);

        this.init();
    }

    private async init(): Promise<void> {
        const [notifications, workflows] = await Promise.all([
            this.notificationsRepository.list(),
            this.workflowsRepository.listWorkflows({
                where: {
                    app: this.app.id
                }
            })
        ]);

        if (workflows.length === 0) {
            workflows.push(this.defaultWorkflow);
        }

        runInAction(() => {
            this.workflows.replace(workflows.map(w => new WorkflowModel(w)));
            this.notifications.replace(notifications);
        });
    }

    updateWorkflow = (workflow: IWorkflow): void => {
        this.workflowsRepository.save(workflow);
    };

    deleteWorkflow(workflow: IWorkflow) {
        this.workflowsRepository.remove(workflow.id);
    }

    getWorkflow = () => {
        return this.workflows[0];
    };

    addStep = (step: IWorkflowStep): void => {
        const workflow = this.getWorkflow();
        workflow.addStep(step);
        this.updateWorkflow(workflow.toJS());
    };

    updateStep = (step: IWorkflowStep): void => {
        const workflow = this.getWorkflow();
        workflow.updateStep(step);
        this.updateWorkflow(workflow.toJS());
    };

    removeStep = ({ id }: Pick<IWorkflowStep, "id">): void => {
        const workflow = this.getWorkflow();
        workflow.removeStep(id);
        this.updateWorkflow(workflow.toJS());
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
        this.updateWorkflow(workflow.toJS());
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
        this.updateWorkflow(workflow.toJS());
    };
}
