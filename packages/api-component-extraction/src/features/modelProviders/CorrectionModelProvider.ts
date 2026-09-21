import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CorrectionModelProvider as Abstraction } from "~/domain/abstractions.js";
import { CORRECTION_MODEL_ID } from "~/constants.js";

/**
 * Resolves the `wbyExtractionCorrection` model on demand, replacing the per-request initializer that used to
 * deposit it in the container. See {@link JobModelProvider} for why there is no
 * `withoutAuthorization` wrapper and no memoization.
 */
class CorrectionModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(CORRECTION_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const CorrectionModelProvider = Abstraction.createImplementation({
    implementation: CorrectionModelProviderImpl,
    dependencies: [GetModelUseCase]
});
