import { Result } from "@webiny/feature/api";
import { CreateEntryStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";
import { assertSimpleModel } from "~/features/simpleContentEntries/domain/assertSimpleModel.js";
import { assertSimpleEntryInvariants } from "~/features/simpleContentEntries/domain/assertSimpleEntryInvariants.js";
import { SimpleEntryPersistenceError } from "~/features/simpleContentEntries/domain/errors/index.js";
import type { ISimpleCmsEntry } from "~/features/simpleContentEntries/types.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import { CreateSimpleEntryRepository as RepositoryAbstraction } from "./abstractions/index.js";

class CreateSimpleEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private readonly entryToStorageTransform: EntryToStorageTransform.Interface,
        private readonly createEntryStorage: CreateEntryStorageOperation.Interface
    ) {}

    public async execute(
        model: CmsModel,
        entry: ISimpleCmsEntry
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        assertSimpleModel(model);
        assertSimpleEntryInvariants(entry);

        try {
            /*
             * The storage operations are typed against the full entry and some of them write back
             * to the object they are handed. This cast is the single seam between the reduced
             * shape and the storage contract, and it belongs here and nowhere else.
             */
            const cmsEntry = entry as unknown as CmsEntry;
            const storageEntry = await this.entryToStorageTransform(model, cmsEntry);

            await this.createEntryStorage.execute(model, {
                entry: cmsEntry,
                storageEntry
            });

            return Result.ok();
        } catch (error) {
            return Result.fail(new SimpleEntryPersistenceError(error as Error));
        }
    }
}

export const CreateSimpleEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateSimpleEntryRepositoryImpl,
    dependencies: [EntryToStorageTransform, CreateEntryStorageOperation]
});
