import { KnexClient } from "@webiny/api-core-sql";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { DeleteEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import { SearchIndexer } from "~/features/search/abstractions.js";
import type {
    CmsEntryStorageOperationsDeleteParams,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { parseIdentifier } from "@webiny/utils";
import { modelRef, modelRows } from "~/features/entries/entryQueries.js";

class PgDeleteEntryImpl implements DeleteEntryStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly indexer: SearchIndexer.Interface,
        private readonly scopeTenant: ScopeTenant.Interface
    ) {}

    public async execute(model: CmsModel, params: CmsEntryStorageOperationsDeleteParams) {
        const tenant = this.scopeTenant.getId();
        await this.schema.ensure();
        const { entries } = this.schema.getTables();
        const { id: entryId } = parseIdentifier(params.entry.id);

        await this.knex.client.transaction(async trx => {
            await modelRows(trx, entries, modelRef(tenant, model))
                .andWhere("entry_id", entryId)
                .delete();
            await this.indexer.syncEntries(trx, model, [entryId]);
        });
    }
}

export const PgDeleteEntry = DeleteEntryStorageOperation.createImplementation({
    implementation: PgDeleteEntryImpl,
    dependencies: [KnexClient, PgSchema, SearchIndexer, ScopeTenant]
});
