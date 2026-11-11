import { KnexClient } from "@webiny/api-core-sql";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { CreateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import { SearchIndexer } from "~/features/search/abstractions.js";
import type {
    CmsEntryStorageOperationsCreateParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { entryToRow } from "~/features/entries/entryRow.js";

class PgCreateEntryImpl implements CreateEntryStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly indexer: SearchIndexer.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateParams<T>
    ) {
        await this.schema.ensure();
        const { entries } = this.schema.getTables();

        const storageEntry = structuredClone(params.storageEntry);
        storageEntry.isLatest = true;
        storageEntry.isPublished = storageEntry.status === "published";

        await this.knex.client.transaction(async trx => {
            await trx(entries).insert(
                entryToRow(storageEntry, this.storageModelProvider.getModel(model))
            );
            await this.indexer.syncEntries(trx, model, [storageEntry.entryId]);
        });

        delete storageEntry.isLatest;
        delete storageEntry.isPublished;
        return storageEntry;
    }
}

export const PgCreateEntry = CreateEntryStorageOperation.createImplementation({
    implementation: PgCreateEntryImpl,
    dependencies: [KnexClient, PgSchema, SearchIndexer, CmsStorageModelProvider]
});
