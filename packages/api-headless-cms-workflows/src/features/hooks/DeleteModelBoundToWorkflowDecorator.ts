import { Result } from "@webiny/feature/api";
import { DeleteModelUseCase } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { ModelBoundToWorkflowError } from "~/domain/errors.js";
import { toCmsNamespace } from "~/utils/appName.js";

/** v1 binds one workflow per model (D15); a few extra cover the accepted save race (D41). */
const BOUND_WORKFLOWS_LIMIT = 10;

/**
 * Blocks deleting a model bound to a workflow (spec 9.2, D41, D64, R64), following
 * `DeleteModelWithEntryCleanup`. Registered after the CMS's decorators, so it runs first and a
 * bound singleton model keeps its entries. A caller who cannot delete the model is left to the
 * CMS's own checks; a failed lookup blocks the delete with the workflows error.
 */
class DeleteModelBoundToWorkflowDecoratorImpl implements DeleteModelUseCase.Interface {
    public constructor(
        private getModel: GetModelUseCase.Interface,
        private accessControl: AccessControl.Interface,
        private listWorkflows: ListWorkflowsUseCase.Interface,
        private decoratee: DeleteModelUseCase.Interface
    ) {}

    public async execute(modelId: string): DeleteModelUseCase.Return {
        // A caller who cannot read and delete the model gets the CMS's own error from the decorated
        // chain, never the bound workflows' ids and names (R64).
        const model = await this.getModel.execute(modelId);
        if (model.isFail()) {
            return this.decoratee.execute(modelId);
        }
        if (!(await this.accessControl.canAccessModel({ model: model.value, rwd: "d" }))) {
            return this.decoratee.execute(modelId);
        }

        const workflows = await this.listWorkflows.execute({
            where: { models_in: [toCmsNamespace(modelId)] },
            limit: BOUND_WORKFLOWS_LIMIT
        });
        if (workflows.isFail()) {
            return Result.fail(workflows.error);
        }
        if (workflows.value.items.length > 0) {
            return Result.fail(
                new ModelBoundToWorkflowError({
                    modelId,
                    workflows: workflows.value.items.map(workflow => {
                        return { id: workflow.id, name: workflow.name };
                    })
                })
            );
        }
        return this.decoratee.execute(modelId);
    }
}

export const DeleteModelBoundToWorkflowDecorator = DeleteModelUseCase.createDecorator({
    decorator: DeleteModelBoundToWorkflowDecoratorImpl,
    dependencies: [GetModelUseCase, AccessControl, ListWorkflowsUseCase]
});
