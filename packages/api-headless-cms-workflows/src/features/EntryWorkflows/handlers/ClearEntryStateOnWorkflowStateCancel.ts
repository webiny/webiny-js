import { WorkflowStateCancelHandler } from "@webiny/api-workflows/features/workflowState/CancelWorkflowState/events.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";

class ClearEntryStateOnWorkflowStateCancelImpl implements WorkflowStateCancelHandler.Interface {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface
    ) {}

    async handle(event: WorkflowStateCancelHandler.Event): Promise<void> {
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

export const ClearEntryStateOnWorkflowStateCancel = WorkflowStateCancelHandler.createImplementation(
    {
        implementation: ClearEntryStateOnWorkflowStateCancelImpl,
        dependencies: [GetModelUseCase, UpdateEntryUseCase]
    }
);
