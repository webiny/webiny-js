import { Result } from "@webiny/feature/api";
import { UpdateEntryStorageOperation } from "~/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";
import { assertSimpleModel } from "~/features/simpleContentEntries/domain/assertSimpleModel.js";
import { assertSimpleEntryInvariants } from "~/features/simpleContentEntries/domain/assertSimpleEntryInvariants.js";
import { SimpleEntryPersistenceError } from "~/features/simpleContentEntries/domain/errors/index.js";
import type { ISimpleCmsEntry } from "~/features/simpleContentEntries/types.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { UpdateSimpleEntryRepository as RepositoryAbstraction } from "./abstractions/index.js";

class UpdateSimpleEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private readonly entryToStorageTransform: EntryToStorageTransform.Interface,
        private readonly updateEntryStorage: UpdateEntryStorageOperation.Interface
    ) {}

    public async execute<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entry: ISimpleCmsEntry<TValues>
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        assertSimpleModel(model);
        assertSimpleEntryInvariants(entry);

        try {
            const cmsEntry = entry as unknown as CmsEntry<TValues>;
            const storageEntry = await this.entryToStorageTransform<TValues>(model, cmsEntry);

            await this.updateEntryStorage.execute<TValues>(model, {
                entry: cmsEntry,
                storageEntry
            });

            return Result.ok();
        } catch (error) {
            return Result.fail(new SimpleEntryPersistenceError(error as Error));
        }
    }
}

export const UpdateSimpleEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateSimpleEntryRepositoryImpl,
    dependencies: [EntryToStorageTransform, UpdateEntryStorageOperation]
});
