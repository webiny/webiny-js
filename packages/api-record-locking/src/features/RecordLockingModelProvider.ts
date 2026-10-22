import type { CmsModel } from "@webiny/api-headless-cms/types";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { RecordLockingModelProvider as Abstraction } from "~/domain/abstractions.js";
import { RECORD_LOCKING_MODEL_ID } from "~/domain/RecordLockingModel.js";

/**
 * Resolves the lock record model on demand.
 *
 * No memoization: `ModelsFetcher` already caches the model list per request. No
 * `withoutAuthorization` either: the model is private, so access control lets every identity read it.
 */
class RecordLockingModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(RECORD_LOCKING_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const RecordLockingModelProvider = Abstraction.createImplementation({
    implementation: RecordLockingModelProviderImpl,
    dependencies: [GetModelUseCase]
});
