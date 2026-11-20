import { KnexClient } from "@webiny/api-core-sql";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetPublishedRevisionByEntryIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPublishedRevisionByEntryIdStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import type {
    CmsEntryStorageOperationsGetPublishedRevisionParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { parseIdentifier } from "@webiny/utils";
import { modelRows } from "~/features/entries/entryQueries.js";
import { rowToEntry } from "~/features/entries/entryRow.js";

class PgGetPublishedRevisionByEntryIdImpl
    implements GetPublishedRevisionByEntryIdStorageOperation.Interface
{
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedRevisionParams
    ) {
        await this.schema.ensure();
        const { id: entryId } = parseIdentifier(params.id);
        const row = await modelRows(this.knex.client, this.schema.getTables().entries, model)
            .andWhere({ entry_id: entryId, is_published: true })
            .first();
        return row ? rowToEntry<T>(row, this.storageModelProvider.getModel(model)) : null;
    }
}

export const PgGetPublishedRevisionByEntryId =
    GetPublishedRevisionByEntryIdStorageOperation.createImplementation({
        implementation: PgGetPublishedRevisionByEntryIdImpl,
        dependencies: [KnexClient, PgSchema, CmsStorageModelProvider]
    });
