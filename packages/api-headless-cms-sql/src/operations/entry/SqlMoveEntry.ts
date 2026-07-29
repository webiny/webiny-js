import type { Knex } from "knex";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { MoveEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/MoveEntryStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { parseIdentifier } from "@webiny/utils";
import { patchAllEntryRevisions } from "./queryHelpers.js";

class SqlMoveEntryImpl implements MoveEntryStorageOperation.Interface {
    private readonly knex: Knex;

    public constructor(
        knexClient: KnexClient.Interface,
        private readonly entryTableManager: EntryTableManager.Interface
    ) {
        this.knex = knexClient.client;
    }

    async execute(model: CmsModel, id: string, folderId: string) {
        await this.entryTableManager.ensureTable();

        const { id: entryId } = parseIdentifier(id);

        await patchAllEntryRevisions(
            this.knex,
            this.entryTableManager.getTableName(),
            entryId,
            model.tenant,
            parsed => {
                parsed.location = { folderId };
            }
        );
    }
}

export const SqlMoveEntry = MoveEntryStorageOperation.createImplementation({
    implementation: SqlMoveEntryImpl,
    dependencies: [KnexClient, EntryTableManager]
});
