import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { OverrideModelProvider as Abstraction } from "~/domain/abstractions.js";
import { OVERRIDE_MODEL_ID } from "~/constants.js";

/**
 * Resolves the `wbyExtractionOverride` model on demand, replacing the per-request initializer that used to
 * deposit it in the container. See {@link JobModelProvider} for why there is no
 * `withoutAuthorization` wrapper and no memoization.
 */
class OverrideModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(OVERRIDE_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const OverrideModelProvider = Abstraction.createImplementation({
    implementation: OverrideModelProviderImpl,
    dependencies: [GetModelUseCase]
});
