import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { UpdateRevisionRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";

class UpdateRevisionRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryToStorageTransform: EntryToStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entry: CmsEntry<T>
    ): Promise<Result<void, EntryPersistenceError>> {
        try {
            const storageEntry = await this.entryToStorageTransform<T>(model, entry);

            await this.storageOperations.entries.updateRevision<T>(model, {
                entry,
                storageEntry
            });

            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const UpdateRevisionRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: UpdateRevisionRepositoryImpl,
    dependencies: [EntryToStorageTransform, StorageOperations]
});
