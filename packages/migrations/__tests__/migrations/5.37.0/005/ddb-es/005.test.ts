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
import { FileManager_5_37_0_005 } from "~/migrations/5.37.0/005/ddb-es";
import { createLocalesData, createTenantsData } from "~tests/migrations/5.35.0/006/ddb-es/006.data";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { createSourceFileRecords } from "./primaryTable.data";
import { createSourceEsTableRecords } from "./esTable.data";
import { transferDynamoDbToElasticsearch } from "~tests/utils/insertElasticsearchTestData";
import { esGetIndexName } from "~/utils";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.37.0-005", () => {
    const documentClient = getDocumentClient();
    const ddbTable = getPrimaryDynamoDbTable();
    const ddbToEsTable = getDynamoToEsTable({
        documentClient
    });
    const elasticsearchClient = createElasticsearchClient();

    const transferDataToEs = () => {
        return transferDynamoDbToElasticsearch(elasticsearchClient, ddbToEsTable, item => {
            const isHeadlessCmsModel = item.TYPE && item.TYPE.startsWith("cms.entry");
            const type = isHeadlessCmsModel ? item.modelId.toLowerCase() : "file-manager";

            return esGetIndexName({
                tenant: item.tenant ?? item.data.tenant,
                locale: item.locale ?? item.data.locale,
                isHeadlessCmsModel,
                type
            });
        });
    };

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
            migrations: [FileManager_5_37_0_005]
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
            migrations: [FileManager_5_37_0_005]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no files were found", async () => {
        await insertTestData(ddbTable, [...createTenantsData(), ...createLocalesData()]);

        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [FileManager_5_37_0_005]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        const AMOUNT_OF_RECORDS = 100;

        await insertTestData(ddbTable, [
            ...createTenantsData(),
            ...createLocalesData(),
            ...createSourceFileRecords(AMOUNT_OF_RECORDS)
        ]);

        await insertTestData(ddbToEsTable, [
            ...(await createSourceEsTableRecords(AMOUNT_OF_RECORDS))
        ]);

        await transferDataToEs();

        // Assert
        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [FileManager_5_37_0_005]
        });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBeGreaterThanOrEqual(1);
        expect(grouped.skipped.length).toBeGreaterThanOrEqual(0);
        expect(grouped.notApplicable.length).toBe(0);

        await transferDataToEs();

        const cmsRecords = await scanTable(ddbTable, {
            filters: [
                {
                    attr: "TYPE",
                    eq: "cms.entry"
                },
                {
                    attr: "modelId",
                    eq: "fmFile"
                }
            ]
        });

        expect(cmsRecords.length).toBe(AMOUNT_OF_RECORDS);
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(ddbTable, [
            ...createTenantsData(),
            ...createLocalesData(),
            ...createSourceFileRecords(10)
        ]);

        await insertTestData(ddbToEsTable, [...(await createSourceEsTableRecords(10))]);

        await transferDataToEs();

        // Assert
        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [FileManager_5_37_0_005]
        });

        // Should run the migration
        {
            process.stdout.write("[First run]\n");
            const { data, error } = await handler();
            assertNotError(error);
            const grouped = groupMigrations(data.migrations);
            expect(grouped.executed.length).toBe(1);
        }

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
