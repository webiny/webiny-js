import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsRestoreFromBinParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { RestoreFromBinStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/RestoreFromBinStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { patchAllEntryRevisions } from "./queryHelpers.js";

class SqlRestoreFromBinImpl implements RestoreFromBinStorageOperation.Interface {
    private readonly knex: Knex;

    public constructor(
        knexClient: KnexClient.Interface,
        private readonly entryTableManager: EntryTableManager.Interface
    ) {
        this.knex = knexClient.client;
    }

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsRestoreFromBinParams<T>
    ) {
        await this.entryTableManager.ensureTable();

        await patchAllEntryRevisions(
            this.knex,
            this.entryTableManager.getTableName(),
            params.entry.entryId,
            model.tenant,
            parsed => {
                const p = parsed as unknown as Record<string, unknown>;
                p["wbyDeleted"] = false;
                p["binOriginalFolderId"] = null;
                p["location"] = params.storageEntry.location ?? null;

                const fields = Object.keys(params.storageEntry);
                for (const field of fields) {
                    if (field === "createdOn" || field === "createdBy") {
                        continue;
                    }
                    if (
                        (field.endsWith("On") || field.endsWith("By")) &&
                        !field.startsWith("revision")
                    ) {
                        p[field] = (params.storageEntry as Record<string, unknown>)[field];
                    }
                }
            },
            { wbyDeleted: false }
        );

        return params.entry;
    }
}

export const SqlRestoreFromBin = createImplementation({
    abstraction: RestoreFromBinStorageOperation,
    implementation: SqlRestoreFromBinImpl,
    dependencies: [KnexClient, EntryTableManager]
});
