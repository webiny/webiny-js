import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { DashboardModelProvider as Abstraction } from "./abstractions.js";
import { DASHBOARD_MODEL_ID } from "./DashboardModel.js";

/**
 * Resolves the dashboard model on demand.
 *
 * No memoization: `ModelsFetcher` already caches the model list per request. No
 * `withoutAuthorization` either: the model is private, so access control lets every identity read it.
 */
class DashboardModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(DASHBOARD_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const DashboardModelProvider = Abstraction.createImplementation({
    implementation: DashboardModelProviderImpl,
    dependencies: [GetModelUseCase]
});
