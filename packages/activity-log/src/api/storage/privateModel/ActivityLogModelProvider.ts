import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ActivityLogModelProvider as Abstraction } from "./abstractions.js";
import { ACTIVITY_LOG_MODEL_ID } from "./ActivityRecordModel.js";

/**
 * Resolves the tenant's activity log model on demand.
 *
 * No memoization, following `ScheduledActionModelProvider`: the CMS model cache is a per-request
 * `createMemoryCache()`, so resolving the model again inside one request is cheap, and not caching
 * it here is what keeps the provider correct across tenants.
 *
 * No `withoutAuthorization` wrapper either. `PrivateModelBuilder` sets `authorization: false` on
 * every model built with `builder.private(...)`, and `AccessControl.modelAuthorizationDisabled()`
 * short-circuits access checks to true for such a model. That matters for capture: the recorder
 * writes a record while an editor is saving, and the editor's own permissions never enter into it,
 * so a save by a narrowly-permissioned user cannot silently produce no record.
 *
 * The flip side belongs to the read API: the model grants no protection whatsoever, so read
 * authorisation has to be enforced by the feature and cannot be inherited from storage.
 *
 * `GetModelUseCase` is an ordinary constructor dependency because this provider is only
 * constructed when a consumer first awaits `get()`, during request handling, by which point the
 * CMS has registered everything the use case needs.
 */
class ActivityLogModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(ACTIVITY_LOG_MODEL_ID);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }
}

export const ActivityLogModelProvider = Abstraction.createImplementation({
    implementation: ActivityLogModelProviderImpl,
    dependencies: [GetModelUseCase]
});
