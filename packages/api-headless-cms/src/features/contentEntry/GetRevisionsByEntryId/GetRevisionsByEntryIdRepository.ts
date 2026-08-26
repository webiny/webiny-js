import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetRevisionsByEntryIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";
import { RuntimeTenant } from "~/features/runtimeTenant/abstractions.js";

/**
 * GetRevisionsByEntryIdRepository - Fetches all revisions for an entry from storage.
 * Returns array of entry revisions.
 */
class GetRevisionsByEntryIdRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface,
        private runtimeTenant: RuntimeTenant.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry<T>[], RepositoryAbstraction.Error>> {
        try {
            const model = this.runtimeTenant.assign(initialModel);
            const result = await this.storageOperations.entries.getRevisions<T>(model, {
                id: entryId
            });

            // Transform storage entries to domain entries
            const items = await Promise.all(
                result.map(async entry => {
                    return this.entryFromStorageTransform<T>(model, entry);
                })
            );

            return Result.ok(items);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const GetRevisionsByEntryIdRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: GetRevisionsByEntryIdRepositoryImpl,
    dependencies: [EntryFromStorageTransform, StorageOperations, RuntimeTenant]
});
