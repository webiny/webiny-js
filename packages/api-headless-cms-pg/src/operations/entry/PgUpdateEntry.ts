import { KnexClient } from "@webiny/api-core-sql";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { UpdateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import { SearchIndexer } from "~/features/search/abstractions.js";
import type {
    CmsEntryStorageOperationsUpdateParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { entryToRow } from "~/features/entries/entryRow.js";
import { modelRef, modelRows, syncEntryToLatest } from "~/features/entries/entryQueries.js";

class PgUpdateEntryImpl implements UpdateEntryStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly indexer: SearchIndexer.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface,
        private readonly scopeTenant: ScopeTenant.Interface
    ) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ) {
        const tenant = this.scopeTenant.getId();
        const ref = modelRef(tenant, model);
        await this.schema.ensure();
        const { entries } = this.schema.getTables();
        const storageEntry = params.storageEntry as CmsStorageEntry;

        await this.knex.client.transaction(async trx => {
            const existing = await modelRows(trx, entries, ref)
                .andWhere("id", storageEntry.id)
                .first();
            storageEntry.isLatest = existing?.is_latest ?? storageEntry.isLatest;
            storageEntry.isPublished = existing?.is_published ?? storageEntry.isPublished;

            const {
                is_latest: _latest,
                is_published: _published,
                ...row
            } = entryToRow(storageEntry, this.storageModelProvider.getModel(model), tenant);
            await modelRows(trx, entries, ref).andWhere("id", storageEntry.id).update(row);
            await syncEntryToLatest(trx, entries, ref, storageEntry);
            await this.indexer.syncEntries(trx, model, [storageEntry.entryId]);
        });

        return params.entry;
    }
}

export const PgUpdateEntry = UpdateEntryStorageOperation.createImplementation({
    implementation: PgUpdateEntryImpl,
    dependencies: [KnexClient, PgSchema, SearchIndexer, CmsStorageModelProvider, ScopeTenant]
});
