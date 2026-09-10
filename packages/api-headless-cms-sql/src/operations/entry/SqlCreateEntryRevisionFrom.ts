import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsCreateRevisionFromParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryRevisionFromStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import type { IEntryRow } from "./types.js";
import { entryToRow } from "./mappers.js";
import { createEntryQuery } from "./queryHelpers.js";

class SqlCreateEntryRevisionFromImpl implements CreateEntryRevisionFromStorageOperation.Interface {
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
        params: CmsEntryStorageOperationsCreateRevisionFromParams<T>
    ) {
        await this.entryTableManager.ensureTable();

        const isPublished = params.entry.status === "published";

        const oldLatestRows = await this.query()
            .where("tenant", model.tenant)
            .andWhere("entryId", params.entry.entryId)
            .andWhere("isLatest", true);

        for (const row of oldLatestRows) {
            const parsed = JSON.parse(row.data);
            parsed.isLatest = false;

            await this.query()
                .where("id", row.id)
                .update({ isLatest: false, data: JSON.stringify(parsed) });
        }

        if (isPublished) {
            const oldPublishedRows = await this.query()
                .where("tenant", model.tenant)
                .andWhere("entryId", params.entry.entryId)
                .andWhere("isPublished", true);

            for (const row of oldPublishedRows) {
                const parsed = JSON.parse(row.data);
                parsed.isPublished = false;
                parsed.status = "unpublished";

                await this.query()
                    .where("id", row.id)
                    .update({ isPublished: false, data: JSON.stringify(parsed) });
            }
        }

        const se = params.storageEntry as CmsStorageEntry;
        se.isLatest = true;
        se.isPublished = isPublished;

        const row = entryToRow(se);
        await this.query().insert(row);

        return params.entry;
    }
}

export const SqlCreateEntryRevisionFrom =
    CreateEntryRevisionFromStorageOperation.createImplementation({
        implementation: SqlCreateEntryRevisionFromImpl,
        dependencies: [KnexClient, EntryTableManager]
    });
