import { KnexClient } from "@webiny/api-core-sql";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetRevisionsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionsStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import type {
    CmsEntryStorageOperationsGetRevisionsParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { parseIdentifier } from "@webiny/utils";
import { modelRows } from "~/features/entries/entryQueries.js";
import { type IEntryRow, rowToEntry } from "~/features/entries/entryRow.js";

class PgGetRevisionsImpl implements GetRevisionsStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionsParams
    ) {
        await this.schema.ensure();
        const { id: entryId } = parseIdentifier(params.id);
        const rows = await modelRows(this.knex.client, this.schema.getTables().entries, model)
            .andWhere("entry_id", entryId)
            .orderBy("version", "desc");
        return rows.map((row: IEntryRow) =>
            rowToEntry<T>(row, this.storageModelProvider.getModel(model))
        );
    }
}

export const PgGetRevisions = GetRevisionsStorageOperation.createImplementation({
    implementation: PgGetRevisionsImpl,
    dependencies: [KnexClient, PgSchema, CmsStorageModelProvider]
});
