import { KnexClient } from "@webiny/api-core-sql";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetLatestEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetLatestEntriesByIdsStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import type {
    CmsEntry,
    CmsEntryStorageOperationsGetLatestByIdsParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { parseIdentifier } from "@webiny/utils";
import { modelRows } from "~/features/entries/entryQueries.js";
import { type IEntryRow, rowToEntry } from "~/features/entries/entryRow.js";

class PgGetLatestEntriesByIdsImpl implements GetLatestEntriesByIdsStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestByIdsParams
    ) {
        await this.schema.ensure();
        const ids = params.ids as string[];
        const keys = ids.map(id => parseIdentifier(id).id);
        const rows = await modelRows(this.knex.client, this.schema.getTables().entries, model)
            .whereIn("entry_id", keys)
            .andWhere("is_latest", true);
        const byKey = new Map(
            rows.map((row: IEntryRow) => [
                row.entry_id,
                rowToEntry<T>(row, this.storageModelProvider.getModel(model))
            ])
        );
        return keys.map(key => byKey.get(key)).filter((entry): entry is CmsEntry<T> => !!entry);
    }
}

export const PgGetLatestEntriesByIds = GetLatestEntriesByIdsStorageOperation.createImplementation({
    implementation: PgGetLatestEntriesByIdsImpl,
    dependencies: [KnexClient, PgSchema, CmsStorageModelProvider]
});
