import { KnexClient } from "@webiny/api-core-sql";
import { MoveToBinStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/MoveToBinStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import { SearchIndexer } from "~/features/search/abstractions.js";
import type {
    CmsEntryStorageOperationsMoveToBinParams,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { copyEntryLevelMeta, patchAllEntryRevisions } from "~/features/entries/entryQueries.js";

class PgMoveToBinImpl implements MoveToBinStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly indexer: SearchIndexer.Interface
    ) {}

    public async execute(model: CmsModel, params: CmsEntryStorageOperationsMoveToBinParams) {
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
                    target["wbyDeleted"] = true;
                    target["binOriginalFolderId"] = params.storageEntry.binOriginalFolderId ?? null;
                    target["location"] = params.storageEntry.location ?? null;
                    copyEntryLevelMeta(
                        params.storageEntry as unknown as Record<string, unknown>,
                        target
                    );
                },
                { wby_deleted: true }
            );
            await this.indexer.syncEntries(trx, model, [params.entry.entryId]);
        });
    }
}

export const PgMoveToBin = MoveToBinStorageOperation.createImplementation({
    implementation: PgMoveToBinImpl,
    dependencies: [KnexClient, PgSchema, SearchIndexer]
});
