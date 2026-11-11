import { KnexClient } from "@webiny/api-core-sql";
import { RestoreFromBinStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/RestoreFromBinStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import { SearchIndexer } from "~/features/search/abstractions.js";
import type {
    CmsEntryStorageOperationsRestoreFromBinParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { copyEntryLevelMeta, patchAllEntryRevisions } from "~/features/entries/entryQueries.js";

class PgRestoreFromBinImpl implements RestoreFromBinStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly indexer: SearchIndexer.Interface
    ) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsRestoreFromBinParams<T>
    ) {
        await this.schema.ensure();
        const { entries } = this.schema.getTables();

        await this.knex.client.transaction(async trx => {
            await patchAllEntryRevisions(
                trx,
                entries,
                model,
                params.entry.entryId,
                data => {
                    const target = data as unknown as Record<string, unknown>;
                    target["wbyDeleted"] = false;
                    target["binOriginalFolderId"] = null;
                    target["location"] = params.storageEntry.location ?? null;
                    copyEntryLevelMeta(
                        params.storageEntry as unknown as Record<string, unknown>,
                        target
                    );
                },
                { wby_deleted: false }
            );
            await this.indexer.syncEntries(trx, model, [params.entry.entryId]);
        });

        return params.entry;
    }
}

export const PgRestoreFromBin = RestoreFromBinStorageOperation.createImplementation({
    implementation: PgRestoreFromBinImpl,
    dependencies: [KnexClient, PgSchema, SearchIndexer]
});
