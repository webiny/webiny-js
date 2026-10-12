import { TaskHandler } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { DELETE_MODEL_TASK } from "@webiny/api-headless-cms-tasks/constants.js";
import type { IDeleteModelTaskInput } from "@webiny/api-headless-cms-tasks/features/DeleteModelTask/types.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { ModelBoundToWorkflowError } from "~/domain/errors.js";
import { listBoundWorkflows } from "./listBoundWorkflows.js";

/**
 * Refuses every run of the "delete model and entries" task for a model bound to a workflow (D134
 * point 4, R64), before anything is deleted. `triggerTask(definition: "deleteModelAndEntries")`
 * starts the task without `DeleteModelOperations.fullyDeleteModel`, so the guard there alone can
 * be bypassed. Registered against `TaskHandler`, so it wraps every task's handler and acts only on
 * this task, identified by `params.definition`. The runner runs tasks without authorization, so
 * no model is read here: the binding is looked up by the input's model id. A failed lookup refuses
 * the run (fail closed); the runner turns the throw into a task error.
 */
class DeleteModelTaskBoundToWorkflowDecoratorImpl implements TaskHandler.Interface {
    public constructor(
        private listWorkflows: ListWorkflowsUseCase.Interface,
        private decoratee: TaskHandler.Interface
    ) {}

    public get run(): TaskHandler.Interface["run"] {
        return async params => {
            if (params.definition.id === DELETE_MODEL_TASK) {
                const input: Partial<IDeleteModelTaskInput> = params.input;
                await this.assertNotBound(String(input.modelId));
            }
            return this.decoratee.run(params);
        };
    }

    public get onBeforeTrigger(): TaskHandler.Interface["onBeforeTrigger"] {
        return this.decoratee.onBeforeTrigger?.bind(this.decoratee);
    }

    public get onDone(): TaskHandler.Interface["onDone"] {
        return this.decoratee.onDone?.bind(this.decoratee);
    }

    public get onError(): TaskHandler.Interface["onError"] {
        return this.decoratee.onError?.bind(this.decoratee);
    }

    public get onAbort(): TaskHandler.Interface["onAbort"] {
        return this.decoratee.onAbort?.bind(this.decoratee);
    }

    public get onMaxIterations(): TaskHandler.Interface["onMaxIterations"] {
        return this.decoratee.onMaxIterations?.bind(this.decoratee);
    }

    public get createInputValidation(): TaskHandler.Interface["createInputValidation"] {
        return this.decoratee.createInputValidation?.bind(this.decoratee);
    }

    private async assertNotBound(modelId: string): Promise<void> {
        const workflows = await listBoundWorkflows(this.listWorkflows, modelId);
        if (workflows.isFail()) {
            throw workflows.error;
        }
        if (workflows.value.length > 0) {
            throw new ModelBoundToWorkflowError({ modelId, workflows: workflows.value });
        }
    }
}

export const DeleteModelTaskBoundToWorkflowDecorator = TaskHandler.createDecorator({
    decorator: DeleteModelTaskBoundToWorkflowDecoratorImpl,
    dependencies: [ListWorkflowsUseCase]
});
