import type { Knex } from "knex";
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { Container } from "@webiny/feature/api";
import type { Client as OpenSearchClient } from "@webiny/api-opensearch";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import type { EntryTableManager } from "@webiny/api-headless-cms-sql/features/entryTableManager/abstractions.js";
import { createEntriesStorageOperations as createSqlEntriesStorageOperations } from "@webiny/api-headless-cms-sql/operations/entry/index.js";
import type { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import { createEntryWriteOperations } from "./EntryWriteOperations.js";
import { createEntrySearchOperations } from "./EntrySearchOperations.js";

interface CreateEntriesStorageOperationsParams {
    knex: Knex;
    container: Container;
    elasticsearch: OpenSearchClient;
    entryTableManager: EntryTableManager.Interface;
    syncTableManager: SyncTableManager.Interface;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
}

export const createEntriesStorageOperations = (
    params: CreateEntriesStorageOperationsParams
): CmsEntryStorageOperations => {
    const {
        knex,
        container,
        elasticsearch,
        entryTableManager,
        syncTableManager,
        fieldRegistry,
        fieldIndexRegistry
    } = params;

    const sqlOps = createSqlEntriesStorageOperations({
        knex: { client: knex },
        entryTableManager,
        container
    });

    const writeOps = createEntryWriteOperations({
        container,
        sqlOps,
        syncTableManager
    });

    const searchOps = createEntrySearchOperations({
        container,
        elasticsearch,
        fieldRegistry,
        fieldIndexRegistry
    });

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
