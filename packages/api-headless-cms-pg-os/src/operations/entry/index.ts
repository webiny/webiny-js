import type { Knex } from "knex";
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { Container } from "@webiny/feature/api";
import type { EntryTableManager } from "@webiny/api-headless-cms-sql/features/entryTableManager/abstractions.js";
import { createEntriesStorageOperations as createSqlEntriesStorageOperations } from "@webiny/api-headless-cms-sql/operations/entry/index.js";
import { EntryWriteOperations } from "./abstractions/EntryWriteOperations.js";
import { EntrySearchOperations } from "./abstractions/EntrySearchOperations.js";
import { SqlEntryOperations } from "./abstractions/SqlEntryOperations.js";

interface CreateEntriesStorageOperationsParams {
    knex: Knex;
    container: Container;
    entryTableManager: EntryTableManager.Interface;
}

export const createEntriesStorageOperations = (
    params: CreateEntriesStorageOperationsParams
): CmsEntryStorageOperations => {
    const { knex, container, entryTableManager } = params;

    const sqlOps = createSqlEntriesStorageOperations({
        knex: { client: knex },
        entryTableManager,
        container
    });

    container.registerInstance(SqlEntryOperations, sqlOps);

    const writeOps = container.resolve(EntryWriteOperations);
    const searchOps = container.resolve(EntrySearchOperations);

    return {
        ...writeOps,
        ...searchOps,
        getRevisions: sqlOps.getRevisions,
        getRevisionById: sqlOps.getRevisionById,
        getByIds: sqlOps.getByIds,
        getLatestByIds: sqlOps.getLatestByIds,
        getPublishedByIds: sqlOps.getPublishedByIds,
        getLatestRevisionByEntryId: sqlOps.getLatestRevisionByEntryId,
        getPublishedRevisionByEntryId: sqlOps.getPublishedRevisionByEntryId,
        getPreviousRevision: sqlOps.getPreviousRevision
    };
};
