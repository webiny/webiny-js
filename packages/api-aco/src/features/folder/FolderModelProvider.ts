import type { CmsModel } from "@webiny/api-headless-cms/types";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { FolderModelProvider as Abstraction } from "~/domain/folder/abstractions.js";
import { FOLDER_MODEL_ID } from "~/domain/folder/folder.model.js";

/**
 * Resolves the tenant's ACO folder model on demand, replacing the per-request hook
 * (`AcoInitializer`) that used to push an already-resolved model into the container.
 *
 * No memoization: `ModelsFetcher` already caches the model list per request (`ModelCache` is a
 * per-request `createMemoryCache()`). No `withoutAuthorization` either — the folder model is
 * private, and `PrivateModelBuilder` sets `authorization: false`, which short-circuits
 * `canAccessModel()` to true for every identity, so the wrapper the initializer used changed
 * nothing.
 *
 * `GetModelUseCase` is an ordinary constructor dependency: this provider is only constructed when a
 * consumer first awaits `get()`, during request handling — after the CMS has registered everything
 * the use case needs. That timing is what forced the initializer's lazy `container.resolve()`.
 */
class FolderModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(FOLDER_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const FolderModelProvider = Abstraction.createImplementation({
    implementation: FolderModelProviderImpl,
    dependencies: [GetModelUseCase]
});
