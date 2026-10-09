import type { CmsModel } from "@webiny/api-headless-cms/types";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowModelProvider } from "~/domain/workflow/abstractions.js";
import { WORKFLOW_MODEL_ID } from "~/constants.js";

/**
 * Resolve the tenant's workflow model on demand. No memoization (`ModelsFetcher` caches per
 * request) and no `withoutAuthorization` (private models skip model authorization).
 */
class WorkflowModelProviderImplementation implements WorkflowModelProvider.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(WORKFLOW_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const WorkflowModelProviderImpl = WorkflowModelProvider.createImplementation({
    implementation: WorkflowModelProviderImplementation,
    dependencies: [GetModelUseCase]
});
