import type { CmsModel } from "@webiny/api-headless-cms/types";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { RedirectModelProvider as Abstraction } from "~/domain/redirect/abstractions.js";
import { REDIRECT_MODEL_ID } from "~/domain/redirect/redirect.model.js";

/**
 * Resolves the tenant's redirect model on demand.
 *
 * Replaces two registration paths that both pushed an already-resolved model into the container:
 * the per-request `RequestContextInitializer` (GraphQL path) and `setupWebsiteBuilderModels()`
 * (all transports, run pre-routing — which is why it had to fall back to the `"root"` tenant).
 *
 * No memoization: `ModelsFetcher` already caches the model list per request (`ModelCache` is a
 * per-request `createMemoryCache()`). No `withoutAuthorization`: the redirect model is private, so
 * `PrivateModelBuilder`'s `authorization: false` short-circuits `canAccessModel()` for every
 * identity.
 */
class RedirectModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(REDIRECT_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const RedirectModelProvider = Abstraction.createImplementation({
    implementation: RedirectModelProviderImpl,
    dependencies: [GetModelUseCase]
});
