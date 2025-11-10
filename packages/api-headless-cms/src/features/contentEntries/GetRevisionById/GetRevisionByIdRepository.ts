import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetRevisionByIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryStorageError, EntryNotFoundError } from "~/domains/contentEntries/errors.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";

/**
 * GetRevisionByIdRepository - Fetches entry revision from storage and transforms it.
 * Returns entry or fails with EntryNotFoundError if not found.
 */
class GetRevisionByIdRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry, RepositoryAbstraction.Error>> {
        try {
            // Fetch from storage
            const storageEntry = await this.storageOperations.entries.getRevisionById(model, {
                id
            });

            if (!storageEntry) {
                return Result.fail(new EntryNotFoundError(id));
            }

            // Transform storage entry to domain entry
            const entry = await this.entryFromStorageTransform(model, storageEntry);

            return Result.ok(entry);
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }
}

export const GetRevisionByIdRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: GetRevisionByIdRepositoryImpl,
    dependencies: [EntryFromStorageTransform, StorageOperations]
});
