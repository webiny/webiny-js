import { KnexClient } from "@webiny/api-core-sql";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { DeleteMultipleEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteMultipleEntriesStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import { SearchIndexer } from "~/features/search/abstractions.js";
import type {
    CmsEntryStorageOperationsDeleteEntriesParams,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { parseIdentifier } from "@webiny/utils";
import { modelRef, modelRows, whereTextIn } from "~/features/entries/entryQueries.js";

class PgDeleteMultipleEntriesImpl implements DeleteMultipleEntriesStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly indexer: SearchIndexer.Interface,
        private readonly scopeTenant: ScopeTenant.Interface
    ) {}

    public async execute(model: CmsModel, params: CmsEntryStorageOperationsDeleteEntriesParams) {
        const tenant = this.scopeTenant.getId();
        await this.schema.ensure();
        const { entries } = this.schema.getTables();
        const entryIds = params.entries.map(id => parseIdentifier(id).id);

        await this.knex.client.transaction(async trx => {
            await whereTextIn(
                modelRows(trx, entries, modelRef(tenant, model)),
                "entry_id",
                entryIds
            ).delete();
            await this.indexer.syncEntries(trx, model, entryIds);
        });
    }
}

export const PgDeleteMultipleEntries = DeleteMultipleEntriesStorageOperation.createImplementation({
    implementation: PgDeleteMultipleEntriesImpl,
    dependencies: [KnexClient, PgSchema, SearchIndexer, ScopeTenant]
});
