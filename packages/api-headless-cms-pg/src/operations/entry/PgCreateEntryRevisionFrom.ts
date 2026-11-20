import { KnexClient } from "@webiny/api-core-sql";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { CreateEntryRevisionFromStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import { SearchIndexer } from "~/features/search/abstractions.js";
import type {
    CmsEntryStorageOperationsCreateRevisionFromParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { entryToRow } from "~/features/entries/entryRow.js";
import { modelRows, patchAllEntryRevisions } from "~/features/entries/entryQueries.js";

class PgCreateEntryRevisionFromImpl implements CreateEntryRevisionFromStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly indexer: SearchIndexer.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateRevisionFromParams<T>
    ) {
        await this.schema.ensure();
        const { entries } = this.schema.getTables();
        const entryId = params.entry.entryId;
        const isPublished = params.entry.status === "published";

        await this.knex.client.transaction(async trx => {
            const latestRows = await modelRows(trx, entries, model).andWhere({
                entry_id: entryId,
                is_latest: true
            });
            for (const row of latestRows) {
                const data = row.data;
                data.isLatest = false;
                await modelRows(trx, entries, model)
                    .andWhere("id", row.id)
                    .update({
                        is_latest: false,
                        data: JSON.stringify(data) as unknown as CmsStorageEntry
                    });
            }
            if (isPublished) {
                await patchAllEntryRevisions(
                    trx,
                    entries,
                    model,
                    entryId,
                    data => {
                        if (data.isPublished) {
                            data.isPublished = false;
                            data.status = "unpublished";
                        }
                    },
                    { is_published: false }
                );
            }

            const storageEntry = params.storageEntry as CmsStorageEntry;
            storageEntry.isLatest = true;
            storageEntry.isPublished = isPublished;
            await trx(entries).insert(
                entryToRow(storageEntry, this.storageModelProvider.getModel(model))
            );
            await this.indexer.syncEntries(trx, model, [entryId]);
        });

        return params.entry;
    }
}

export const PgCreateEntryRevisionFrom =
    CreateEntryRevisionFromStorageOperation.createImplementation({
        implementation: PgCreateEntryRevisionFromImpl,
        dependencies: [KnexClient, PgSchema, SearchIndexer, CmsStorageModelProvider]
    });
