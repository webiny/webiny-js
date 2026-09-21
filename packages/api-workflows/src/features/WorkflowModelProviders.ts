import type { CmsModel } from "@webiny/api-headless-cms/types";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowModelProvider } from "~/domain/workflow/abstractions.js";
import { WorkflowStateModelProvider } from "~/domain/workflowState/abstractions.js";
import { WORKFLOW_MODEL_ID } from "~/constants.js";
import { WORKFLOW_STATE_MODEL_ID } from "~/domain/workflowState/stateModel.js";

/**
 * Resolve the tenant's workflow models on demand, replacing the per-request hook
 * (`WorkflowsInitializer`) that used to push already-resolved models into the container.
 *
 * No memoization: `ModelsFetcher` already caches the model list per request (`ModelCache` is a
 * per-request `createMemoryCache()`). No `withoutAuthorization` either — both models are private,
 * and `PrivateModelBuilder` sets `authorization: false`, which short-circuits `canAccessModel()` to
 * true for every identity, so the wrapper the initializer used changed nothing.
 *
 * `GetModelUseCase` is an ordinary constructor dependency: a provider is only constructed when a
 * consumer first awaits `get()`, during request handling — after the CMS has registered everything
 * the use case needs. That timing is what forced the initializer's lazy `container.resolve()`.
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

class WorkflowStateModelProviderImplementation implements WorkflowStateModelProvider.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(WORKFLOW_STATE_MODEL_ID);
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

export const WorkflowStateModelProviderImpl = WorkflowStateModelProvider.createImplementation({
    implementation: WorkflowStateModelProviderImplementation,
    dependencies: [GetModelUseCase]
});
