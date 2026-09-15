import type { CmsModel } from "@webiny/api-headless-cms/types";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ScheduledActionModelProvider as Abstraction } from "~/shared/abstractions.js";
import { SCHEDULE_MODEL_ID } from "~/constants.js";

/**
 * Resolves the tenant's `wbySchedule` model on demand, replacing the per-request hook that used to
 * push an already-resolved model into the container.
 *
 * No memoization: `ModelsFetcher` already caches the model list per request (`ModelCache` is a
 * per-request `createMemoryCache()`). No `withoutAuthorization` either — `wbySchedule` is a private
 * model, and `PrivateModelBuilder` sets `authorization: false`, which short-circuits
 * `canAccessModel()` to true for every identity, so the wrapper the initializer used changed
 * nothing.
 *
 * `GetModelUseCase` is an ordinary constructor dependency: this provider is only constructed when a
 * consumer first awaits `get()`, during request handling — after the CMS has registered everything
 * the use case needs. That timing is what forced the initializer's lazy `container.resolve()`.
 */
class ScheduledActionModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(SCHEDULE_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const ScheduledActionModelProvider = Abstraction.createImplementation({
    implementation: ScheduledActionModelProviderImpl,
    dependencies: [GetModelUseCase]
});
