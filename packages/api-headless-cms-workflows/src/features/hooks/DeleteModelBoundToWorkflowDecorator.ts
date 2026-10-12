import { Result } from "@webiny/feature/api";
import { DeleteModelUseCase } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { ModelBoundToWorkflowError } from "~/domain/errors.js";
import { canCallerDeleteModel } from "./canCallerDeleteModel.js";
import { listBoundWorkflows } from "./listBoundWorkflows.js";

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
        if (!(await canCallerDeleteModel(this.getModel, this.accessControl, modelId))) {
            return this.decoratee.execute(modelId);
        }

        const workflows = await listBoundWorkflows(this.listWorkflows, modelId);
        if (workflows.isFail()) {
            return Result.fail(workflows.error);
        }
        if (workflows.value.length > 0) {
            return Result.fail(
                new ModelBoundToWorkflowError({ modelId, workflows: workflows.value })
            );
        }
        return this.decoratee.execute(modelId);
    }
}

export const DeleteModelBoundToWorkflowDecorator = DeleteModelUseCase.createDecorator({
    decorator: DeleteModelBoundToWorkflowDecoratorImpl,
    dependencies: [GetModelUseCase, AccessControl, ListWorkflowsUseCase]
});
