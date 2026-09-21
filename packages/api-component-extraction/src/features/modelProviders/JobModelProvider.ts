import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { JobModelProvider as Abstraction } from "~/domain/abstractions.js";
import { JOB_MODEL_ID } from "~/constants.js";

/**
 * Resolves the `wbyExtractionJob` model on demand, replacing the per-request initializer that used
 * to deposit it in the container.
 *
 * No `withoutAuthorization` wrapper, which the initializer had: the model is private
 * (`builder.private`) and `PrivateModelBuilder` sets `authorization: false`, which short-circuits
 * `canAccessModel()` to true for every identity — so the wrapper changed nothing. No memoization
 * either: `ModelsFetcher` already caches the model list per request.
 */
class JobModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(JOB_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const JobModelProvider = Abstraction.createImplementation({
    implementation: JobModelProviderImpl,
    dependencies: [GetModelUseCase]
});
