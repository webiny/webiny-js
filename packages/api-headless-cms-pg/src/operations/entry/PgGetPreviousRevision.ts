import { KnexClient } from "@webiny/api-core-sql";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetPreviousRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPreviousRevisionStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import type {
    CmsEntryStorageOperationsGetPreviousRevisionParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { modelRows } from "~/features/entries/entryQueries.js";
import { rowToEntry } from "~/features/entries/entryRow.js";

class PgGetPreviousRevisionImpl implements GetPreviousRevisionStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ) {
        await this.schema.ensure();
        const row = await modelRows(this.knex.client, this.schema.getTables().entries, model)
            .andWhere("entry_id", params.entryId)
            .andWhere("version", "<", params.version)
            .orderBy("version", "desc")
            .first();
        return row ? rowToEntry<T>(row, this.storageModelProvider.getModel(model)) : null;
    }
}

export const PgGetPreviousRevision = GetPreviousRevisionStorageOperation.createImplementation({
    implementation: PgGetPreviousRevisionImpl,
    dependencies: [KnexClient, PgSchema, CmsStorageModelProvider]
});
