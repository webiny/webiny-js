import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import {
    GetUniqueFieldValuesRepository as RepositoryAbstraction,
    GetUniqueFieldValuesParams
} from "./abstractions.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryStorageError } from "~/domains/contentEntries/errors.js";
import type { CmsModel, CmsEntryUniqueValue } from "~/types/index.js";

class GetUniqueFieldValuesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private storageOperations: StorageOperations.Interface) {}

    async execute(
        model: CmsModel,
        params: GetUniqueFieldValuesParams
    ): Promise<Result<CmsEntryUniqueValue[], RepositoryAbstraction.Error>> {
        const { where, fieldId } = params;

        try {
            const values = await this.storageOperations.entries.getUniqueFieldValues(model, {
                where,
                fieldId
            });

            return Result.ok(values);
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }
}

export const GetUniqueFieldValuesRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: GetUniqueFieldValuesRepositoryImpl,
    dependencies: [StorageOperations]
});
