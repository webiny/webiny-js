import { KnexClient } from "@webiny/api-core-sql";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { DeleteEntryRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryRevisionStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import { SearchIndexer } from "~/features/search/abstractions.js";
import type {
    CmsEntryStorageOperationsDeleteRevisionParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { entryToRow } from "~/features/entries/entryRow.js";
import { modelRef, modelRows, patchAllEntryRevisions } from "~/features/entries/entryQueries.js";

class PgDeleteEntryRevisionImpl implements DeleteEntryRevisionStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly indexer: SearchIndexer.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface,
        private readonly scopeTenant: ScopeTenant.Interface
    ) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams<T>
    ) {
        const tenant = this.scopeTenant.getId(
            model.tenant,
            params.entry?.tenant,
            params.storageEntry?.tenant,
            params.latestEntry?.tenant,
            params.latestStorageEntry?.tenant
        );
        const ref = modelRef(tenant, model);
        await this.schema.ensure();
        const { entries } = this.schema.getTables();
        const storageEntry = params.storageEntry;
        const wasPublished = storageEntry.status === "published";

        await this.knex.client.transaction(async trx => {
            await modelRows(trx, entries, ref).andWhere("id", storageEntry.id).delete();
            if (wasPublished) {
                await patchAllEntryRevisions(trx, entries, ref, storageEntry.entryId, data => {
                    data.live = null;
                });
            }
            if (params.latestStorageEntry) {
                const latest = structuredClone(params.latestStorageEntry) as CmsStorageEntry;
                latest.isLatest = true;
                if (wasPublished) {
                    latest.live = null;
                }
                await modelRows(trx, entries, ref)
                    .andWhere("id", params.latestStorageEntry.id)
                    .update(entryToRow(latest, this.storageModelProvider.getModel(model), tenant));
            }
            await this.indexer.syncEntries(trx, model, [storageEntry.entryId]);
        });
    }
}

export const PgDeleteEntryRevision = DeleteEntryRevisionStorageOperation.createImplementation({
    implementation: PgDeleteEntryRevisionImpl,
    dependencies: [KnexClient, PgSchema, SearchIndexer, CmsStorageModelProvider, ScopeTenant]
});
