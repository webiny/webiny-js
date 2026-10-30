import { DeleteModelOperations } from "@webiny/api-headless-cms-tasks/graphql/deleteModel/abstractions.js";
import type {
    IDeleteCmsModelTask,
    IStoreValue
} from "@webiny/api-headless-cms-tasks/features/DeleteModelTask/types.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { ModelBoundToWorkflowError } from "~/domain/errors.js";
import { toCmsNamespace } from "~/utils/appName.js";

/** v1 binds one workflow per model (D15); a few extra cover the accepted save race (D41). */
const BOUND_WORKFLOWS_LIMIT = 10;

/**
 * Refuses to start the "fully delete model" background task for a model bound to a workflow
 * (D134 point 4, R64). The task deletes every entry and folder before it calls
 * `DeleteModelUseCase`, so the use-case decorator alone would fire after the content is gone.
 * `fullyDeleteModel` reports errors by throwing (its GraphQL resolver maps them), so this throws
 * too. The other operations pass through.
 */
class FullyDeleteModelBoundToWorkflowDecoratorImpl implements DeleteModelOperations.Interface {
    public constructor(
        private getModel: GetModelUseCase.Interface,
        private accessControl: AccessControl.Interface,
        private listWorkflows: ListWorkflowsUseCase.Interface,
        private decoratee: DeleteModelOperations.Interface
    ) {}

    public listModelsBeingDeleted(): Promise<IStoreValue[]> {
        return this.decoratee.listModelsBeingDeleted();
    }

    public isModelBeingDeleted(modelId: string): Promise<boolean> {
        return this.decoratee.isModelBeingDeleted(modelId);
    }

    public async fullyDeleteModel(modelId: string): Promise<IDeleteCmsModelTask> {
        // A caller who cannot read and delete the model gets the CMS's own error from the decorated
        // chain, never the bound workflows' ids and names (R64).
        const model = await this.getModel.execute(modelId);
        if (model.isFail()) {
            return this.decoratee.fullyDeleteModel(modelId);
        }
        if (!(await this.accessControl.canAccessModel({ model: model.value, rwd: "d" }))) {
            return this.decoratee.fullyDeleteModel(modelId);
        }

        const workflows = await this.listWorkflows.execute({
            where: { models_in: [toCmsNamespace(modelId)] },
            limit: BOUND_WORKFLOWS_LIMIT
        });
        if (workflows.isFail()) {
            throw workflows.error;
        }
        if (workflows.value.items.length > 0) {
            throw new ModelBoundToWorkflowError({
                modelId,
                workflows: workflows.value.items.map(workflow => {
                    return { id: workflow.id, name: workflow.name };
                })
            });
        }
        return this.decoratee.fullyDeleteModel(modelId);
    }

    public cancelFullyDeleteModel(modelId: string): Promise<IDeleteCmsModelTask> {
        return this.decoratee.cancelFullyDeleteModel(modelId);
    }

    public getDeleteModelProgress(modelId: string): Promise<IDeleteCmsModelTask> {
        return this.decoratee.getDeleteModelProgress(modelId);
    }
}

export const FullyDeleteModelBoundToWorkflowDecorator = DeleteModelOperations.createDecorator({
    decorator: FullyDeleteModelBoundToWorkflowDecoratorImpl,
    dependencies: [GetModelUseCase, AccessControl, ListWorkflowsUseCase]
});
