import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { RunModelProvider as Abstraction } from "~/domain/abstractions.js";
import { RUN_MODEL_ID } from "~/constants.js";

/**
 * Resolves the `wbyExtractionRun` model on demand, replacing the per-request initializer that used to
 * deposit it in the container. See {@link JobModelProvider} for why there is no
 * `withoutAuthorization` wrapper and no memoization.
 */
class RunModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(RUN_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const RunModelProvider = Abstraction.createImplementation({
    implementation: RunModelProviderImpl,
    dependencies: [GetModelUseCase]
});
