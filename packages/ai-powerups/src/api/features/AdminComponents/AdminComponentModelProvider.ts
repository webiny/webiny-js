import type { CmsModel } from "@webiny/api-headless-cms/types";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AdminComponentModelProvider as Abstraction } from "./abstractions.js";
import { ADMIN_COMPONENT_MODEL_ID } from "./adminComponent.model.js";

/**
 * Resolves the tenant's admin component model on demand. Same shape as the website builder's
 * providers: no memoization, because `ModelsFetcher` already caches per request, and no
 * `withoutAuthorization`, because a private model short-circuits `canAccessModel()` anyway.
 */
class AdminComponentModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(ADMIN_COMPONENT_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const AdminComponentModelProvider = Abstraction.createImplementation({
    implementation: AdminComponentModelProviderImpl,
    dependencies: [GetModelUseCase]
});
