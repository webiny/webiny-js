import { KnexClient } from "@webiny/api-core-sql";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetPublishedEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPublishedEntriesByIdsStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import type {
    CmsEntry,
    CmsEntryStorageOperationsGetPublishedByIdsParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { parseIdentifier } from "@webiny/utils";
import { modelRows, whereTextIn } from "~/features/entries/entryQueries.js";
import { type IEntryRow, rowToEntry } from "~/features/entries/entryRow.js";

class PgGetPublishedEntriesByIdsImpl implements GetPublishedEntriesByIdsStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedByIdsParams
    ) {
        await this.schema.ensure();
        const ids = params.ids as string[];
        const keys = ids.map(id => parseIdentifier(id).id);
        const rows = await whereTextIn(
            modelRows(this.knex.client, this.schema.getTables().entries, model),
            "entry_id",
            keys
        ).andWhere("is_published", true);
        const byKey = new Map(
            rows.map((row: IEntryRow) => [
                row.entry_id,
                rowToEntry<T>(row, this.storageModelProvider.getModel(model))
            ])
        );
        return keys.map(key => byKey.get(key)).filter((entry): entry is CmsEntry<T> => !!entry);
    }
}

export const PgGetPublishedEntriesByIds =
    GetPublishedEntriesByIdsStorageOperation.createImplementation({
        implementation: PgGetPublishedEntriesByIdsImpl,
        dependencies: [KnexClient, PgSchema, CmsStorageModelProvider]
    });
