import type { CmsModel } from "@webiny/api-headless-cms/types";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { FileModelProvider as Abstraction } from "~/domain/file/abstractions.js";
import { FILE_MODEL_ID } from "~/domain/file/file.model.js";

/**
 * Resolves the tenant's `fmFile` model on demand.
 *
 * Two things this deliberately does NOT do, both of which the initializer it replaces did:
 *
 * - **No memoization.** `ModelsFetcher` already caches the model list per request (`ModelCache` is a
 *   per-request `createMemoryCache()`, see `ContentModelFeature`), so a second cache would buy only
 *   a repeat access-control check and an array lookup, at the cost of two lifetimes to reason about.
 * - **No `withoutAuthorization`.** `fmFile` is a private model and `PrivateModelBuilder` sets
 *   `authorization: false`, which makes `AccessControl.modelAuthorizationDisabled()` short-circuit
 *   `canAccessModel()` to true for every identity — so the wrapper changed nothing. Confirmed
 *   against `filesSecurity.test.ts`, which exercises `fm.file`-only identities holding no CMS
 *   content-model permissions.
 *
 * `GetModelUseCase` is an ordinary constructor dependency: this provider is only constructed when a
 * consumer first awaits `get()`, which happens during request handling — after the CMS has
 * registered everything the use case needs. That timing is what previously forced the lazy
 * `container.resolve()` inside the initializer.
 */
class FileModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(FILE_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const FileModelProvider = Abstraction.createImplementation({
    implementation: FileModelProviderImpl,
    dependencies: [GetModelUseCase]
});
