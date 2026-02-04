import { WorkflowBeforeCreateHandler } from "@webiny/api-workflows/features/workflow/CreateWorkflow/events.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";

class DisallowUnpublishableModelsOnBeforeCreateImpl
    implements WorkflowBeforeCreateHandler.Interface
{
    public constructor(private getModelUseCase: GetModelUseCase.Interface) {}

    public async handle(event: WorkflowBeforeCreateHandler.Event): Promise<void> {
        const { workflow } = event.payload;
        const modelId = getModelIdFromAppName(workflow.app);
        if (!modelId) {
            return;
        }
        const model = await this.getModelUseCase.execute(modelId);
        if (model.isFail()) {
            return;
        }
        const tags = model.value.tags || [];
        if (tags.includes("$publishing:false") === false) {
            return;
        }
        throw new Error(
            `Cannot create a workflow for the model "${modelId}" because it is marked as unpublishable.`
        );
    }
}

export const DisallowUnpublishableModelsOnBeforeCreate =
    WorkflowBeforeCreateHandler.createImplementation({
        implementation: DisallowUnpublishableModelsOnBeforeCreateImpl,
        dependencies: [GetModelUseCase]
    });
