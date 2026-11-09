import { KnexClient } from "@webiny/api-core-sql";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntriesByIdsStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import type {
    CmsEntry,
    CmsEntryStorageOperationsGetByIdsParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { modelRows } from "~/features/entries/entryQueries.js";
import { type IEntryRow, rowToEntry } from "~/features/entries/entryRow.js";

class PgGetEntriesByIdsImpl implements GetEntriesByIdsStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetByIdsParams
    ) {
        await this.schema.ensure();
        const ids = params.ids as string[];
        const keys = ids;
        const rows = await modelRows(
            this.knex.client,
            this.schema.getTables().entries,
            model
        ).whereIn("id", keys);
        const byKey = new Map(
            rows.map((row: IEntryRow) => [
                row.id,
                rowToEntry<T>(row, this.storageModelProvider.getModel(model))
            ])
        );
        return keys.map(key => byKey.get(key)).filter((entry): entry is CmsEntry<T> => !!entry);
    }
}

export const PgGetEntriesByIds = GetEntriesByIdsStorageOperation.createImplementation({
    implementation: PgGetEntriesByIdsImpl,
    dependencies: [KnexClient, PgSchema, CmsStorageModelProvider]
});
