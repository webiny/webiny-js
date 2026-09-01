import { WorkflowStateAfterDeleteHandler } from "@webiny/api-workflows/features/workflowState/DeleteTargetWorkflowState/events.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";

class ClearEntryStateOnWorkflowStateAfterDeleteImpl
    implements WorkflowStateAfterDeleteHandler.Interface
{
    constructor(
        private getModel: GetModelUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface
    ) {}

    async handle(event: WorkflowStateAfterDeleteHandler.Event): Promise<void> {
        const { state } = event.payload;

        const modelId = getModelIdFromAppName(state.app);
        if (!modelId) {
            return;
        }

        const modelResult = await this.getModel.execute(modelId);
        if (modelResult.isFail()) {
            return;
        }

        const model = modelResult.value;
        await this.updateEntry.execute(
            model,
            state.targetRevisionId,
            { system: { workflow: null } },
            { skipValidation: true }
        );
    }
}

export const ClearEntryStateOnWorkflowStateAfterDelete =
    WorkflowStateAfterDeleteHandler.createImplementation({
        implementation: ClearEntryStateOnWorkflowStateAfterDeleteImpl,
        dependencies: [GetModelUseCase, UpdateEntryUseCase]
    });
