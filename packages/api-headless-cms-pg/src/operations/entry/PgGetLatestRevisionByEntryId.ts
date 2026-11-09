import { KnexClient } from "@webiny/api-core-sql";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import type {
    CmsEntryStorageOperationsGetLatestRevisionParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { parseIdentifier } from "@webiny/utils";
import { modelRows } from "~/features/entries/entryQueries.js";
import { rowToEntry } from "~/features/entries/entryRow.js";

class PgGetLatestRevisionByEntryIdImpl
    implements GetLatestRevisionByEntryIdStorageOperation.Interface
{
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) {
        await this.schema.ensure();
        const { id: entryId } = parseIdentifier(params.id);
        const row = await modelRows(this.knex.client, this.schema.getTables().entries, model)
            .andWhere({ entry_id: entryId, is_latest: true })
            .first();
        return row ? rowToEntry<T>(row, this.storageModelProvider.getModel(model)) : null;
    }
}

export const PgGetLatestRevisionByEntryId =
    GetLatestRevisionByEntryIdStorageOperation.createImplementation({
        implementation: PgGetLatestRevisionByEntryIdImpl,
        dependencies: [KnexClient, PgSchema, CmsStorageModelProvider]
    });
