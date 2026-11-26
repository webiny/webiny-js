import { KnexClient } from "@webiny/api-core-sql";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntriesByIdsStorageOperation.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import type {
    CmsEntry,
    CmsEntryStorageOperationsGetByIdsParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { modelRef, modelRows, whereTextIn } from "~/features/entries/entryQueries.js";
import { type IEntryRow, rowToEntry } from "~/features/entries/entryRow.js";

class PgGetEntriesByIdsImpl implements GetEntriesByIdsStorageOperation.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface,
        private readonly scopeTenant: ScopeTenant.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetByIdsParams
    ) {
        const tenant = this.scopeTenant.getId();
        await this.schema.ensure();
        const ids = params.ids as string[];
        const keys = ids;
        const rows = await whereTextIn(
            modelRows(this.knex.client, this.schema.getTables().entries, modelRef(tenant, model)),
            "id",
            keys
        );
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
    dependencies: [KnexClient, PgSchema, CmsStorageModelProvider, ScopeTenant]
});
