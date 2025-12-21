import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { WorkflowStateAfterUpdateHandler } from "@webiny/api-workflows/features/workflowState/UpdateWorkflowState/events.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { getStateValues } from "~/utils/state.js";

class UpdateEntryOnWorkflowStateAfterUpdateImpl
    implements WorkflowStateAfterUpdateHandler.Interface
{
    constructor(
        private getModel: GetModelUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface
    ) {}

    async handle(event: WorkflowStateAfterUpdateHandler.Event): Promise<void> {
        const { state } = event.payload;

        const modelId = getModelIdFromAppName(state.app);
        if (!modelId) {
            return;
        }

        const values = getStateValues(state);

        const modelResult = await this.getModel.execute(modelId);
        if (modelResult.isFail()) {
            return;
        }

        const model = modelResult.value;
        await this.updateEntry.execute(model, state.targetRevisionId, {
            state: values
        });
    }
}

export const UpdateEntryOnWorkflowStateAfterUpdate =
    WorkflowStateAfterUpdateHandler.createImplementation({
        implementation: UpdateEntryOnWorkflowStateAfterUpdateImpl,
        dependencies: [GetModelUseCase, UpdateEntryUseCase]
    });
