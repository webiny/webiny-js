import { WorkflowBeforeCreateEventHandler } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { assertModelsBindable } from "../assertModelsBindable.js";

class DisallowUnpublishableModelsOnBeforeCreateImpl
    implements WorkflowBeforeCreateEventHandler.Interface
{
    public constructor(private getModel: GetModelUseCase.Interface) {}

    public async handle(event: WorkflowBeforeCreateEventHandler.Event): Promise<void> {
        await assertModelsBindable(this.getModel, event.payload.workflow.models);
    }
}

export const DisallowUnpublishableModelsOnBeforeCreate =
    WorkflowBeforeCreateEventHandler.createImplementation({
        implementation: DisallowUnpublishableModelsOnBeforeCreateImpl,
        dependencies: [GetModelUseCase]
    });
