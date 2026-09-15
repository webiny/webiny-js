import type { CmsModel } from "@webiny/api-headless-cms/types";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ExperimentModelProvider as Abstraction } from "~/domain/experiment/abstractions.js";
import { EXPERIMENT_MODEL_ID } from "~/domain/experiment/experiment.model.js";

/**
 * Resolves the tenant's experiment model on demand, replacing the two paths that used to push an
 * already-resolved model into the container — the inline `RequestContextInitializer` (GraphQL) and
 * `setupWebsiteBuilderModels()` (all transports, run pre-routing).
 *
 * No memoization: `ModelsFetcher` already caches the model list per request (`ModelCache` is a
 * per-request `createMemoryCache()`). No `withoutAuthorization`: the experiment model is private,
 * so `PrivateModelBuilder`'s `authorization: false` short-circuits `canAccessModel()` for every
 * identity.
 */
class ExperimentModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(EXPERIMENT_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const ExperimentModelProvider = Abstraction.createImplementation({
    implementation: ExperimentModelProviderImpl,
    dependencies: [GetModelUseCase]
});
