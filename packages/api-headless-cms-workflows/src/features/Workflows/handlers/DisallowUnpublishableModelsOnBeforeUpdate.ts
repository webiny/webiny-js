import { WorkflowBeforeUpdateEventHandler } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { assertModelsBindable } from "../assertModelsBindable.js";

class DisallowUnpublishableModelsOnBeforeUpdateImpl
    implements WorkflowBeforeUpdateEventHandler.Interface
{
    public constructor(private getModel: GetModelUseCase.Interface) {}

    public async handle(event: WorkflowBeforeUpdateEventHandler.Event): Promise<void> {
        await assertModelsBindable(this.getModel, event.payload.workflow.models);
    }
}

export const DisallowUnpublishableModelsOnBeforeUpdate =
    WorkflowBeforeUpdateEventHandler.createImplementation({
        implementation: DisallowUnpublishableModelsOnBeforeUpdateImpl,
        dependencies: [GetModelUseCase]
    });
