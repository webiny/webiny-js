import { KnexClient } from "@webiny/api-core-sql";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetRevisionByIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import type {
    CmsEntryStorageOperationsGetRevisionParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { modelRows } from "~/features/entries/entryQueries.js";
import { rowToEntry } from "~/features/entries/entryRow.js";

class PgGetRevisionByIdImpl implements GetRevisionByIdStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionParams
    ) {
        await this.schema.ensure();
        const row = await modelRows(this.knex.client, this.schema.getTables().entries, model)
            .andWhere("id", params.id)
            .first();
        return row ? rowToEntry<T>(row, this.storageModelProvider.getModel(model)) : null;
    }
}

export const PgGetRevisionById = GetRevisionByIdStorageOperation.createImplementation({
    implementation: PgGetRevisionByIdImpl,
    dependencies: [KnexClient, PgSchema, CmsStorageModelProvider]
});
