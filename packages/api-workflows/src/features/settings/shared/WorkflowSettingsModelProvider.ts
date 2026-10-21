import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowSettingsModelProvider as Abstraction } from "~/domain/settings/abstractions/WorkflowSettingsModelProvider.js";
import { WORKFLOW_SETTINGS_MODEL_ID } from "~/constants.js";

/** Same contract as `WorkflowModelProvider`: no memoization, no `withoutAuthorization`. */
class WorkflowSettingsModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(WORKFLOW_SETTINGS_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const WorkflowSettingsModelProvider = Abstraction.createImplementation({
    implementation: WorkflowSettingsModelProviderImpl,
    dependencies: [GetModelUseCase]
});
