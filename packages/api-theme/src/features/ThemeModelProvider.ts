import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ThemeModelProvider as Abstraction } from "~/domain/theme/abstractions.js";
import { THEME_MODEL_ID } from "~/domain/theme/theme.model.js";

/**
 * Resolves the tenant's `wbyTheme` model on demand, replacing the per-request initializer that used
 * to deposit it in the container.
 *
 * No `withoutAuthorization` wrapper: `wbyTheme` is a private model (`builder.private`), and
 * `PrivateModelBuilder` sets `authorization: false`, which short-circuits `canAccessModel()` to true
 * for every identity — so the wrapper the initializer used changed nothing. No memoization either:
 * `ModelsFetcher` already caches the model list per request.
 */
class ThemeModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(THEME_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const ThemeModelProvider = Abstraction.createImplementation({
    implementation: ThemeModelProviderImpl,
    dependencies: [GetModelUseCase]
});
