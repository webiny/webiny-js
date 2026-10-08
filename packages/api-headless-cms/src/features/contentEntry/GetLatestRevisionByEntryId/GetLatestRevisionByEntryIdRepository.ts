import { Result } from "@webiny/feature/api";
import { GetLatestRevisionByEntryIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryNotFoundError, EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsGetLatestRevisionParams
} from "~/types/index.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";
import { RuntimeTenant } from "~/features/runtimeTenant/abstractions.js";

/**
 * GetLatestRevisionByEntryIdRepository - Fetches latest revision by entry ID from storage.
 * Returns the latest revision for a given entry (includes deleted entries).
 */
class GetLatestRevisionByEntryIdRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private getLatestRevisionByEntryIdStorage: GetLatestRevisionByEntryIdStorageOperation.Interface,
        private runtimeTenant: RuntimeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ): Promise<Result<CmsEntry<T>, RepositoryAbstraction.Error>> {
        const model = this.runtimeTenant.assign(initialModel);

        try {
            const entry = await this.getLatestRevisionByEntryIdStorage.execute<T>(model, params);

            if (!entry) {
                return Result.fail(new EntryNotFoundError(params.id));
            }

            // Transform storage entry to domain entry
            const transformedEntry = await this.entryFromStorageTransform(model, entry);

            return Result.ok(transformedEntry);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const GetLatestRevisionByEntryIdRepository = RepositoryAbstraction.createImplementation({
    implementation: GetLatestRevisionByEntryIdRepositoryImpl,
    dependencies: [
        EntryFromStorageTransform,
        GetLatestRevisionByEntryIdStorageOperation,
        RuntimeTenant
    ]
});
