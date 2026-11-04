import type { CmsModel } from "@webiny/api-headless-cms/types";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GlobalComponentModelProvider as Abstraction } from "~/domain/globals/abstractions.js";
import { GLOBAL_COMPONENT_MODEL_ID } from "~/domain/globals/globalComponent.model.js";

/**
 * Resolves the tenant's global component model on demand, like `PageModelProvider`. The model is private, so no
 * `withoutAuthorization` is needed, and `ModelsFetcher` already caches the model list per request.
 */
class GlobalComponentModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(GLOBAL_COMPONENT_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const GlobalComponentModelProvider = Abstraction.createImplementation({
    implementation: GlobalComponentModelProviderImpl,
    dependencies: [GetModelUseCase]
});
