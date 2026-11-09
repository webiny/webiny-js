import { KnexClient } from "@webiny/api-core-sql";
import { MoveEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/MoveEntryStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import { SearchIndexer } from "~/features/search/abstractions.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { parseIdentifier } from "@webiny/utils";
import { patchAllEntryRevisions } from "~/features/entries/entryQueries.js";

class PgMoveEntryImpl implements MoveEntryStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly indexer: SearchIndexer.Interface
    ) {}

    public async execute(model: CmsModel, id: string, folderId: string) {
        await this.schema.ensure();
        const { entries } = this.schema.getTables();
        const { id: entryId } = parseIdentifier(id);

        await this.knex.client.transaction(async trx => {
            await patchAllEntryRevisions(trx, entries, model, entryId, data => {
                data.location = { folderId };
            });
            await this.indexer.syncEntries(trx, model, [entryId]);
        });
    }
}

export const PgMoveEntry = MoveEntryStorageOperation.createImplementation({
    implementation: PgMoveEntryImpl,
    dependencies: [KnexClient, PgSchema, SearchIndexer]
});
