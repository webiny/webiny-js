import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsDeleteRevisionParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { DeleteEntryRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryRevisionStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import type { IEntryRow } from "./types.js";
import { entryToRow } from "./mappers.js";
import { createEntryQuery, patchAllEntryRevisions } from "./queryHelpers.js";

class SqlDeleteEntryRevisionImpl implements DeleteEntryRevisionStorageOperation.Interface {
    private readonly knex: Knex;

    public constructor(
        knexClient: KnexClient.Interface,
        private readonly entryTableManager: EntryTableManager.Interface
    ) {
        this.knex = knexClient.client;
    }

    private query(): Knex.QueryBuilder<IEntryRow> {
        return createEntryQuery(this.knex, this.entryTableManager.getTableName());
    }

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams<T>
    ) {
        await this.entryTableManager.ensureTable();

        const wasPublished = params.storageEntry.status === "published";

        await this.query()
            .where("tenant", model.tenant)
            .andWhere("id", params.storageEntry.id)
            .delete();

        if (wasPublished) {
            await patchAllEntryRevisions(
                this.knex,
                this.entryTableManager.getTableName(),
                params.storageEntry.entryId,
                model.tenant,
                parsed => {
                    parsed.live = null;
                }
            );
        }

        if (params.latestStorageEntry) {
            const latestParsed = structuredClone(params.latestStorageEntry);
            latestParsed.isLatest = true;

            if (wasPublished) {
                latestParsed.live = null;
            }

            const latestRow = entryToRow(latestParsed as CmsStorageEntry);

            await this.query()
                .where("tenant", model.tenant)
                .andWhere("id", params.latestStorageEntry.id)
                .update(latestRow);
        }
    }
}

export const SqlDeleteEntryRevision = createImplementation({
    abstraction: DeleteEntryRevisionStorageOperation,
    implementation: SqlDeleteEntryRevisionImpl,
    dependencies: [KnexClient, EntryTableManager]
});
