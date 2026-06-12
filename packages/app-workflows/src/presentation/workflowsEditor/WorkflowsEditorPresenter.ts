import { makeAutoObservable, observable, runInAction, toJS } from "mobx";
import { ListWorkflowsUseCase } from "~/features/listWorkflows/abstractions.js";
import { StoreWorkflowUseCase } from "~/features/storeWorkflow/abstractions.js";
import { DeleteWorkflowUseCase } from "~/features/deleteWorkflow/abstractions.js";
import { ListNotificationTypesUseCase } from "~/features/listNotificationTypes/abstractions.js";
import {
    type IWorkflow,
    type IWorkflowApplication,
    type IWorkflowNotificationType,
    type IWorkflowStep
} from "~/types.js";
import { type IWorkflowModel, WorkflowModel } from "~/domain/index.js";
import {
    WorkflowsEditorPresenter as Abstraction,
    type IWorkflowsEditorPresenter,
    type IWorkflowsEditorPresenterViewModel,
    type IWorkflowsEditorPresenterInitParams,
    type IWorkflowError
} from "./abstractions.js";

class WorkflowsEditorPresenterImpl implements IWorkflowsEditorPresenter {
    private _app: IWorkflowApplication = { id: "", name: "", icon: null as any };
    private _workflows = observable.array<IWorkflowModel>([]);
    private _notifications = observable.array<IWorkflowNotificationType>([]);
    private _loading = false;
    private _error: IWorkflowError | null = null;

    constructor(
        private listWorkflowsUseCase: ListWorkflowsUseCase.Interface,
        private storeWorkflowUseCase: StoreWorkflowUseCase.Interface,
        private deleteWorkflowUseCase: DeleteWorkflowUseCase.Interface,
        private listNotificationTypesUseCase: ListNotificationTypesUseCase.Interface
    ) {
        makeAutoObservable<
            WorkflowsEditorPresenterImpl,
            | "listWorkflowsUseCase"
            | "storeWorkflowUseCase"
            | "deleteWorkflowUseCase"
            | "listNotificationTypesUseCase"
        >(this, {
            listWorkflowsUseCase: false,
            storeWorkflowUseCase: false,
            deleteWorkflowUseCase: false,
            listNotificationTypesUseCase: false
        });
    }

    get vm(): IWorkflowsEditorPresenterViewModel {
        const workflow = this._workflows[0] || null;
        return {
            workflows: this._workflows.map(w => w.toJS()),
            dirty: workflow ? workflow.dirty : false,
            workflow: workflow ? workflow.toJS() : null,
            notifications: toJS(this._notifications),
            loading: this._loading,
            error: this._error,
            app: this._app
        };
    }

    async init(params: IWorkflowsEditorPresenterInitParams): Promise<void> {
        this._app = params.app;
        this._loading = true;
        this._error = null;

        try {
            const [notifications, workflows] = await Promise.all([
                this.listNotificationTypesUseCase.execute(),
                this.listWorkflowsUseCase.execute({ where: { app: params.app.id } })
            ]);

            if (workflows.length === 0) {
                workflows.push(params.defaultWorkflow);
            }

            runInAction(() => {
                this._workflows.replace(workflows.map(w => new WorkflowModel(w)));
                this._notifications.replace(notifications);
                this._loading = false;
            });
        } catch (err) {
            runInAction(() => {
                this._error = {
                    code: null,
                    message: err instanceof Error ? err.message : "Unknown error"
                };
                this._loading = false;
            });
        }
    }

    getWorkflow = () => {
        return this._workflows[0];
    };

    updateWorkflow = (workflow: IWorkflow): void => {
        this.storeWorkflowUseCase.execute(workflow).catch(err => {
            runInAction(() => {
                this._error = {
                    code: null,
                    message: err instanceof Error ? err.message : "Unknown error"
                };
            });
        });
    };

    deleteWorkflow = (workflow: IWorkflow): void => {
        this.deleteWorkflowUseCase.execute(workflow).catch(err => {
            runInAction(() => {
                this._error = {
                    code: null,
                    message: err instanceof Error ? err.message : "Unknown error"
                };
            });
        });
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
        if (workflow.steps.length === 1) {
            workflow.removeStep(id);
            return this.deleteWorkflow(workflow.toJS());
        }
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
        if (!this.canMoveStepUp(step)) {
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
        if (!this.canMoveStepDown(step)) {
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

export const WorkflowsEditorPresenterImplementation = Abstraction.createImplementation({
    implementation: WorkflowsEditorPresenterImpl,
    dependencies: [
        ListWorkflowsUseCase,
        StoreWorkflowUseCase,
        DeleteWorkflowUseCase,
        ListNotificationTypesUseCase
    ]
});
