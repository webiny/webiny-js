import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowModelProvider as Abstraction } from "~/domain/workflow/abstractions/WorkflowModelProvider.js";
import { WORKFLOW_MODEL_ID } from "~/constants.js";

/**
 * No memoization (`ModelsFetcher` caches the model list per request) and no
 * `withoutAuthorization` (private models skip model authorization). Same as `FileModelProvider`
 * in api-file-manager.
 */
class WorkflowModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(WORKFLOW_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const WorkflowModelProvider = Abstraction.createImplementation({
    implementation: WorkflowModelProviderImpl,
    dependencies: [GetModelUseCase]
});
