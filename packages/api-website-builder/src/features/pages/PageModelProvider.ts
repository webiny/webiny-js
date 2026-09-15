import type { CmsModel } from "@webiny/api-headless-cms/types";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { PageModelProvider as Abstraction } from "~/domain/page/abstractions.js";
import { PAGE_MODEL_ID } from "~/domain/page/page.model.js";

/**
 * Resolves the tenant's page model on demand.
 *
 * This is the last of the four Website Builder models to convert, so it also retires the two paths
 * that pushed already-resolved models into the container: the inline `RequestContextInitializer`
 * and `setupWebsiteBuilderModels()` (which ran pre-routing and therefore fell back to the `"root"`
 * tenant).
 *
 * No memoization: `ModelsFetcher` already caches the model list per request (`ModelCache` is a
 * per-request `createMemoryCache()`). No `withoutAuthorization`: the page model is private, so
 * `PrivateModelBuilder`'s `authorization: false` short-circuits `canAccessModel()` for every
 * identity.
 */
class PageModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(PAGE_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const PageModelProvider = Abstraction.createImplementation({
    implementation: PageModelProviderImpl,
    dependencies: [GetModelUseCase]
});
