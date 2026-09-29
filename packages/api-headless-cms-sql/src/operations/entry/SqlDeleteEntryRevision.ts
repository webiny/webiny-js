import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsDeleteRevisionParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { DeleteEntryRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryRevisionStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import type { IEntryRow } from "./types.js";
import { entryToRow } from "./mappers.js";
import { createModelEntryQuery, patchAllEntryRevisions } from "./queryHelpers.js";

class SqlDeleteEntryRevisionImpl implements DeleteEntryRevisionStorageOperation.Interface {
    private readonly knex: Knex;

    public constructor(
        knexClient: KnexClient.Interface,
        private readonly entryTableManager: EntryTableManager.Interface
    ) {
        this.knex = knexClient.client;
    }

    private modelQuery(model: CmsModel): Knex.QueryBuilder<IEntryRow> {
        return createModelEntryQuery(this.knex, this.entryTableManager.getTableName(), model);
    }

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams<T>
    ) {
        await this.entryTableManager.ensureTable();

        const wasPublished = params.storageEntry.status === "published";

        await this.modelQuery(model).andWhere("id", params.storageEntry.id).delete();

        if (wasPublished) {
            await patchAllEntryRevisions(
                this.knex,
                this.entryTableManager.getTableName(),
                model,
                params.storageEntry.entryId,
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

            await this.modelQuery(model)
                .andWhere("id", params.latestStorageEntry.id)
                .update(latestRow);
        }
    }
}

export const SqlDeleteEntryRevision = DeleteEntryRevisionStorageOperation.createImplementation({
    implementation: SqlDeleteEntryRevisionImpl,
    dependencies: [KnexClient, EntryTableManager]
});
