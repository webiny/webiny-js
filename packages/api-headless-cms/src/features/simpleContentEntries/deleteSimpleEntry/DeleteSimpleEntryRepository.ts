import { Result } from "@webiny/feature/api";
import { DeleteEntryStorageOperation } from "~/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";
import { assertSimpleModel } from "~/features/simpleContentEntries/domain/assertSimpleModel.js";
import { SimpleEntryPersistenceError } from "~/features/simpleContentEntries/domain/errors/index.js";
import type { ISimpleCmsEntry } from "~/features/simpleContentEntries/types.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import { DeleteSimpleEntryRepository as RepositoryAbstraction } from "./abstractions/index.js";

class DeleteSimpleEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private readonly deleteEntryStorage: DeleteEntryStorageOperation.Interface
    ) {}

    public async execute(
        model: CmsModel,
        entry: ISimpleCmsEntry
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        assertSimpleModel(model);

        try {
            /*
             * The storage operation purges every item under the entry's partition, which for a
             * simple entry is the revision item and the latest item.
             */
            await this.deleteEntryStorage.execute(model, {
                entry: entry as unknown as CmsEntry
            });

            return Result.ok();
        } catch (error) {
            return Result.fail(new SimpleEntryPersistenceError(error as Error));
        }
    }
}

export const DeleteSimpleEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteSimpleEntryRepositoryImpl,
    dependencies: [DeleteEntryStorageOperation]
});
