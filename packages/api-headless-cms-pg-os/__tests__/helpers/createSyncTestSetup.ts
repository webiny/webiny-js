import knexLib from "knex";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Container } from "@webiny/feature/api";
import { KnexClient } from "@webiny/api-core-sql";
import { TableNameResolverConfig } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "@webiny/api-headless-cms-sql/features/tableNameResolver/feature.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { CmsEntryOpenSearchFieldIndexFeature } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
import { CmsModelOpenSearchIndexFeature } from "@webiny/api-headless-cms-utils-os/features/CmsModelOpenSearchIndex/feature.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { SyncTableManagerFeature } from "../../src/features/syncTableManager/feature.js";
import { SyncTableManager } from "../../src/features/syncTableManager/abstractions.js";
import { SyncEventHandlerFeature } from "../../src/features/syncEventHandler/feature.js";
import { SyncEventHandler } from "../../src/features/syncEventHandler/abstractions.js";
import { SyncWriterFeature } from "../../src/features/SyncWriter/feature.js";
import { WriteEntry } from "../../src/features/SyncWriter/abstractions/WriteEntry.js";
import { WriteLatest } from "../../src/features/SyncWriter/abstractions/WriteLatest.js";
import { RemoveLatest } from "../../src/features/SyncWriter/abstractions/RemoveLatest.js";
import { SynchronizationBuilderFeature } from "@webiny/api-sync-to-opensearch";
import { ExecuteSyncFeature } from "@webiny/api-sync-to-opensearch";
import { ExecuteSyncWithRetryFeature } from "@webiny/api-sync-to-opensearch";
import { OperationsFactoryFeature } from "@webiny/api-sync-to-opensearch";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { Timer } from "@webiny/utils/features/Timer/abstraction.js";
import { Env } from "@webiny/stdlib";
import { simulatePgStream } from "../../src/testing/simulatePgStream.js";
import type { SyncEvent } from "../../src/types.js";
import type { TestOpenSearchClient } from "@webiny/api-opensearch/testing";

export const createSyncTestSetup = async () => {
    const db = await PGlite.create();
    const server = new PGLiteSocketServer({ db, port: 0, host: "127.0.0.1" });
    await server.start();

    const knex = knexLib({
        client: "pg",
        connection: {
            host: "127.0.0.1",
            // @ts-expect-error
            port: server.port,
            database: "postgres"
        },
        pool: {
            min: 1,
            max: 2
        }
    });

    const osClient: TestOpenSearchClient = createTestOpenSearchClient();

    const container = new Container();

    container.registerInstance(KnexClient, { client: knex });
    container.registerInstance(TableNameResolverConfig, { sharedTables: false });
    container.registerInstance(CmsModelFieldToGraphQLRegistry, {
        get: () => undefined,
        getAll: () => []
    });
    container.registerInstance(OpenSearchClient, { use: () => osClient });
    container.registerInstance(Timer, {
        getRemainingMilliseconds: () => 300000,
        getRemainingSeconds: () => 300
    });
    container.registerInstance(Env, {
        getString: (_key: string, fallback?: string) => fallback ?? "",
        getStringOrThrow: (key: string) => {
            throw new Error(`Env ${key} not set`);
        },
        getNumber: (key: string, fallback?: number) => {
            if (key === "MAX_ES_PROCESSOR") {
                return 100;
            }
            if (key === "MAX_ES_RETRIES") {
                return 1;
            }
            if (key === "MAX_ES_RETRY_TIME") {
                return 5000;
            }
            if (key === "MAX_ES_TIMEOUT") {
                return 5000;
            }
            return fallback ?? 0;
        },
        getNumberOrThrow: (key: string) => {
            throw new Error(`Env ${key} not set`);
        },
        getBoolean: (key: string, fallback?: boolean) => {
            if (key === "TESTING") {
                return true;
            }
            return fallback ?? false;
        },
        getBooleanOrThrow: (key: string) => {
            throw new Error(`Env ${key} not set`);
        }
    });

    TableNameResolverFeature.register(container);
    CompressionFeature.register(container);
    CmsEntryOpenSearchFieldIndexFeature.register(container);
    CmsModelOpenSearchIndexFeature.register(container);
    SyncTableManagerFeature.register(container);
    SyncWriterFeature.register(container);
    OperationsFactoryFeature.register(container);
    ExecuteSyncFeature.register(container);
    ExecuteSyncWithRetryFeature.register(container);
    SynchronizationBuilderFeature.register(container);
    SyncEventHandlerFeature.register(container);

    const syncTableManager = container.resolve(SyncTableManager);
    const writeEntry = container.resolve(WriteEntry);
    const writeLatest = container.resolve(WriteLatest);
    const removeLatest = container.resolve(RemoveLatest);

    await syncTableManager.ensureTable();

    const capturedEvents: SyncEvent[] = [];

    simulatePgStream({
        knex,
        tableName: syncTableManager.getTableName(),
        handler: async events => {
            capturedEvents.push(...events);
        }
    });

    const resolveSyncEventHandler = (): SyncEventHandler.Interface => {
        return container.resolve(SyncEventHandler);
    };

    const resetState = async (): Promise<void> => {
        capturedEvents.length = 0;
        await knex(syncTableManager.getTableName()).truncate();
        await osClient.indices.deleteAll();
    };

    const cleanup = async () => {
        await osClient.indices.deleteAll();
        await knex.destroy();
        await server.stop();
        await db.close();
    };

    return {
        knex,
        osClient,
        container,
        syncTableManager,
        writeEntry,
        writeLatest,
        removeLatest,
        capturedEvents,
        resolveSyncEventHandler,
        resetState,
        cleanup
    };
};

export const createModel = (overrides = {}) => ({
    modelId: "testModel",
    tenant: "root",
    locale: "en-US",
    name: "Test Model",
    fields: [],
    layout: [],
    group: { id: "group1", name: "Group 1", slug: "group-1" },
    convertValueKeyToStorage: ({ values }: any) => values,
    convertValueKeyFromStorage: ({ values }: any) => values,
    ...overrides
});

export const createEntry = (overrides = {}) => ({
    id: "entry1#0001",
    entryId: "entry1",
    modelId: "testModel",
    tenant: "root",
    locale: "en-US",
    version: 1,
    status: "draft" as const,
    locked: false,
    isLatest: true,
    isPublished: false,
    values: { title: "Test Entry" },
    ...overrides
});
