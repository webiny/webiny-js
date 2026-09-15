import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import {
    GetUniqueFieldValuesRepository as RepositoryAbstraction,
    GetUniqueFieldValuesParams
} from "./abstractions.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsModel, CmsEntryUniqueValue } from "~/types/index.js";
import { RuntimeTenant } from "~/features/runtimeTenant/abstractions.js";

class GetUniqueFieldValuesRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private storageOperations: StorageOperations.Interface,
        private runtimeTenant: RuntimeTenant.Interface
    ) {}

    async execute(
        initialModel: CmsModel,
        params: GetUniqueFieldValuesParams
    ): Promise<Result<CmsEntryUniqueValue[], RepositoryAbstraction.Error>> {
        const model = this.runtimeTenant.assign(initialModel);
        const { where, fieldId } = params;

        try {
            const values = await this.storageOperations.entries.getUniqueFieldValues(model, {
                where,
                fieldId
            });

            return Result.ok(values);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const GetUniqueFieldValuesRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: GetUniqueFieldValuesRepositoryImpl,
    dependencies: [StorageOperations, RuntimeTenant]
});
