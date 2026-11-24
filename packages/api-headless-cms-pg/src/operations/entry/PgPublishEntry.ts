import { KnexClient } from "@webiny/api-core-sql";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { PublishEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/PublishEntryStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import { SearchIndexer } from "~/features/search/abstractions.js";
import type {
    CmsEntryStorageOperationsPublishParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { entryToRow } from "~/features/entries/entryRow.js";
import {
    modelRows,
    patchAllEntryRevisions,
    syncEntryToLatest
} from "~/features/entries/entryQueries.js";

class PgPublishEntryImpl implements PublishEntryStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly indexer: SearchIndexer.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsPublishParams<T>
    ) {
        await this.schema.ensure();
        const { entries } = this.schema.getTables();
        const storageEntry = params.storageEntry as CmsStorageEntry;

        await this.knex.client.transaction(async trx => {
            // The previously published revision becomes "unpublished".
            await patchAllEntryRevisions(trx, entries, model, storageEntry.entryId, data => {
                if (data.isPublished && data.id !== storageEntry.id) {
                    data.isPublished = false;
                    data.status = "unpublished";
                }
            });
            await modelRows(trx, entries, model)
                .andWhere("entry_id", storageEntry.entryId)
                .andWhereNot("id", storageEntry.id)
                .update({ is_published: false });

            const existing = await modelRows(trx, entries, model)
                .andWhere("id", storageEntry.id)
                .first();
            storageEntry.isLatest = existing?.is_latest ?? storageEntry.isLatest;
            storageEntry.isPublished = true;
            const { is_latest: _latest, ...row } = entryToRow(
                storageEntry,
                this.storageModelProvider.getModel(model)
            );
            await modelRows(trx, entries, model).andWhere("id", storageEntry.id).update(row);

            const live = { version: params.entry.version };
            await syncEntryToLatest(trx, entries, model, storageEntry, latest => {
                latest.live = live;
            });
            await this.indexer.syncEntries(trx, model, [storageEntry.entryId]);
        });

        return params.entry;
    }
}

export const PgPublishEntry = PublishEntryStorageOperation.createImplementation({
    implementation: PgPublishEntryImpl,
    dependencies: [KnexClient, PgSchema, SearchIndexer, CmsStorageModelProvider]
});
