import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { WorkflowStateAfterCreateHandler } from "@webiny/api-workflows/features/workflowState/CreateWorkflowState/events.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { getStateValues } from "~/utils/state.js";

class UpdateEntryOnWorkflowStateAfterCreateImpl
    implements WorkflowStateAfterCreateHandler.Interface
{
    constructor(
        private getModel: GetModelUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface
    ) {}

    async handle(event: WorkflowStateAfterCreateHandler.Event): Promise<void> {
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

export const UpdateEntryOnWorkflowStateAfterCreate =
    WorkflowStateAfterCreateHandler.createImplementation({
        implementation: UpdateEntryOnWorkflowStateAfterCreateImpl,
        dependencies: [GetModelUseCase, UpdateEntryUseCase]
    });
