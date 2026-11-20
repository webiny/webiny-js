import type { CmsModel } from "@webiny/api-headless-cms/types";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { LayoutModelProvider as Abstraction } from "~/domain/layout/abstractions.js";
import { LAYOUT_MODEL_ID } from "~/domain/layout/layout.model.js";

/**
 * Resolves the tenant's layout model on demand, like `PageModelProvider`. The model is private, so no
 * `withoutAuthorization` is needed, and `ModelsFetcher` already caches the model list per request.
 */
class LayoutModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(LAYOUT_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const LayoutModelProvider = Abstraction.createImplementation({
    implementation: LayoutModelProviderImpl,
    dependencies: [GetModelUseCase]
});
