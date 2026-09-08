import { Result } from "@webiny/feature/api";
import { UpdateRevisionRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { UpdateRevisionStorageOperation } from "~/features/shared/storageOperations/entry/UpdateRevisionStorageOperation.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";
import { RuntimeTenant } from "~/features/runtimeTenant/abstractions.js";

class UpdateRevisionRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryToStorageTransform: EntryToStorageTransform.Interface,
        private updateRevisionStorage: UpdateRevisionStorageOperation.Interface,
        private runtimeTenant: RuntimeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        initialEntry: CmsEntry<T>
    ): Promise<Result<void, EntryPersistenceError>> {
        const model = this.runtimeTenant.assign(initialModel);
        const entry = this.runtimeTenant.assign(initialEntry);

        try {
            const storageEntry = await this.entryToStorageTransform<T>(model, entry);

            await this.updateRevisionStorage.execute<T>(model, {
                entry,
                storageEntry
            });

            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const UpdateRevisionRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateRevisionRepositoryImpl,
    dependencies: [EntryToStorageTransform, UpdateRevisionStorageOperation, RuntimeTenant]
});
