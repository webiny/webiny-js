import {
    assertNotError,
    createDdbEsMigrationHandler,
    getDynamoToEsTable,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { AcoFolders_5_37_0_003, CmsEntryAcoFolder } from "~/migrations/5.37.0/003/ddb-es";
import {
    ACO_FOLDER_MODEL_ID,
    ROOT_FOLDER,
    UPPERCASE_ROOT_FOLDER
} from "~/migrations/5.37.0/003/constants";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import {
    createElasticsearchClient,
    ElasticsearchClient
} from "@webiny/project-utils/testing/elasticsearch/createClient";
import { createLocalesData, createTenantsData } from "../common";
import { insertEmptyIndexes, insertTestFolders } from "./insertTestFolders";
import {
    FolderDdbToElasticsearchWriteItem,
    FolderDdbWriteItem
} from "~tests/migrations/5.37.0/003/types";
import { getDecompressedData } from "./getDecompressedData";
import { esGetIndexName } from "~/utils";
import { transferDynamoDbToElasticsearch } from "~tests/utils/insertElasticsearchTestData";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.37.0-003", () => {
    const documentClient = getDocumentClient();
    const ddbTable = getPrimaryDynamoDbTable({
        documentClient
    });
    const ddbToEsTable = getDynamoToEsTable({
        documentClient
    });
    let elasticsearchClient: ElasticsearchClient;

    beforeAll(async () => {
        elasticsearchClient = await createElasticsearchClient();
    });

    beforeEach(async () => {
        process.env.ELASTIC_SEARCH_INDEX_PREFIX =
            new Date().toISOString().replace(/\.|\:/g, "-").toLowerCase() + "-";

        await elasticsearchClient.indices.deleteAll();
    });
    afterEach(async () => {
        await elasticsearchClient.indices.deleteAll();
    });

    logTestNameBeforeEachTest();

    it("should not run if no tenant found", async () => {
        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [AcoFolders_5_37_0_003]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no locale found", async () => {
        await insertTestData(ddbTable, [...createTenantsData()]);

        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [AcoFolders_5_37_0_003]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no folders found", async () => {
        await insertTestData(ddbTable, [...createTenantsData(), ...createLocalesData()]);

        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [AcoFolders_5_37_0_003]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no folders found - empty index", async () => {
        await insertTestData(ddbTable, [...createTenantsData(), ...createLocalesData()]);
        await insertEmptyIndexes(elasticsearchClient);

        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [AcoFolders_5_37_0_003]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(ddbTable, [...createTenantsData(), ...createLocalesData()]);
        const { ddbFolders, tenants } = await insertTestFolders({
            table: ddbTable,
            esTable: ddbToEsTable,
            elasticsearchClient
        });

        const ddbFolderRecordsPrepare = (await scanTable(ddbTable)).filter(
            record => record.modelId === ACO_FOLDER_MODEL_ID
        );

        const ddbEsFolderRecordsPrepare = (await scanTable(ddbToEsTable)).filter(record => {
            return (record.index || "").includes(ACO_FOLDER_MODEL_ID.toLowerCase());
        });

        expect(ddbFolderRecordsPrepare.length).toBe(ddbFolders.length * 2);
        expect(ddbEsFolderRecordsPrepare.length).toBe(ddbFolders.length);
        /**
         * And then we execute current the 5.37.0_001 migration.
         */
        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [AcoFolders_5_37_0_003]
        });
        const { data, error } = await handler();

        await elasticsearchClient.indices.refreshAll();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const searchRecordsAfterMigrations = await scanTable(ddbTable, {
            filters: [
                {
                    attr: "modelId",
                    eq: ACO_FOLDER_MODEL_ID
                }
            ]
        });
        const cmsEntries = searchRecordsAfterMigrations.filter(r => {
            return r.modelId === ACO_FOLDER_MODEL_ID;
        });

        expect(searchRecordsAfterMigrations).toHaveLength(ddbFolders.length * 2);
        expect(cmsEntries).toHaveLength(ddbFolders.length * 2);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        /**
         * First we check the DDB records.
         */
        const folderDdbRecords: FolderDdbWriteItem[] = await scanTable(ddbTable, {
            filters: [
                {
                    attr: "modelId",
                    eq: ACO_FOLDER_MODEL_ID
                }
            ]
        });

        expect(folderDdbRecords.length).toBe(ddbFolders.length * 2);

        for (const folder of folderDdbRecords) {
            /**
             * We just need to make sure that no folder has "root" or "ROOT" as parent
             */
            const parent = (folder.values.parentId || "").toLowerCase();
            if (parent?.toLowerCase() === "root") {
                console.log("we have a bogus!");
            }

            expect(parent).not.toBe(ROOT_FOLDER);
            expect(parent).not.toBe(UPPERCASE_ROOT_FOLDER);
        }
        /**
         * Then we check the DDB -> ES records.
         */
        const folderEsRecords: FolderDdbToElasticsearchWriteItem[] = await scanTable(ddbToEsTable, {
            filters: [
                {
                    attr: "index",
                    contains: ACO_FOLDER_MODEL_ID.toLowerCase()
                }
            ]
        });
        for (const folder of folderEsRecords) {
            const data = await getDecompressedData<CmsEntryAcoFolder>(folder.data);

            const parent = (data.values.parentId || "").toLowerCase();

            expect(parent).not.toBe(ROOT_FOLDER);
            expect(parent).not.toBe(UPPERCASE_ROOT_FOLDER);
        }
        /**
         * And in the end, we check the Elasticsearch data.
         */
        for (const item of tenants) {
            const tenant = item.tenant;
            for (const locale of item.locales) {
                const response = await elasticsearchClient.search({
                    index: esGetIndexName({
                        tenant,
                        locale,
                        type: ACO_FOLDER_MODEL_ID,
                        isHeadlessCmsModel: true
                    }),
                    body: {
                        size: 10000
                    }
                });
                const folders = response.body.hits.hits.map((item: any) => item._source);
                expect(folders).toHaveLength(14);
            }
        }
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(ddbTable, [...createTenantsData(), ...createLocalesData()]);
        await insertTestFolders({
            table: ddbTable,
            esTable: ddbToEsTable,
            elasticsearchClient
        });

        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [AcoFolders_5_37_0_003]
        });

        // Should run the migration
        {
            process.stdout.write("[First run]\n");
            const { data, error } = await handler();
            await elasticsearchClient.indices.refreshAll();
            assertNotError(error);
            const grouped = groupMigrations(data.migrations);
            expect(grouped.executed.length).toBe(1);
            expect(grouped.skipped.length).toBe(0);
            expect(grouped.notApplicable.length).toBe(0);
        }
        /**
         * We need to transfer the Elasticsearch data from the DDB-ES table to the Elasticsearch because the migration does not insert into the Elasticsearch directly.
         */
        await transferDynamoDbToElasticsearch(elasticsearchClient, ddbToEsTable, item => {
            return esGetIndexName({
                tenant: item.tenant,
                locale: item.locale,
                isHeadlessCmsModel: true,
                type: ACO_FOLDER_MODEL_ID
            });
        });

        // Should skip the migration
        {
            process.stdout.write("[Second run]\n");
            const { data, error } = await handler();
            assertNotError(error);
            const grouped = groupMigrations(data.migrations);
            expect(grouped.executed.length).toBe(0);
            expect(grouped.skipped.length).toBe(1);
            expect(grouped.notApplicable.length).toBe(0);
        }
    });
});
