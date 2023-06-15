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
import { AcoRecords_5_37_0_001 } from "~/migrations/5.37.0/001/ddb-es";
import {
    PB_ACO_SEARCH_MODEL_ID,
    PB_PAGE_TYPE,
    ROOT_FOLDER
} from "~/migrations/5.37.0/001/constants";
/**
 * We are using the original 5.35.0 006 migration data and migration to set up the test data.
 */
import { AcoRecords_5_35_0_006 } from "~/migrations/5.35.0/006/ddb-es";
import { insertTestPages } from "~tests/migrations/5.35.0/006/ddb-es/insertTestPages";
import { createLocalesData, createTenantsData } from "~tests/migrations/5.35.0/006/ddb-es/006.data";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.37.0-001", () => {
    const ddbTable = getPrimaryDynamoDbTable();
    const ddbToEsTable = getDynamoToEsTable();
    const elasticsearchClient = createElasticsearchClient();

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
            migrations: [AcoRecords_5_37_0_001]
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
            migrations: [AcoRecords_5_37_0_001]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no pages found", async () => {
        await insertTestData(ddbTable, [...createTenantsData(), ...createLocalesData()]);

        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [AcoRecords_5_37_0_001]
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
        const { ddbPages } = await insertTestPages({
            ddbTable,
            esTable: ddbToEsTable,
            elasticsearchClient
        });

        const searchRecordsBeforeMigrations = await scanTable(ddbTable, {
            filters: [
                {
                    attr: "_et",
                    eq: "CmsEntries"
                }
            ]
        });

        expect(searchRecordsBeforeMigrations).toHaveLength(0);
        /**
         * First we are executing the 5.35.0_006 migration as it creates the original ACO Search Records.
         */
        const handlerPrepare = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [AcoRecords_5_35_0_006]
        });
        const { data: dataPrepare, error: errorPrepare } = await handlerPrepare();

        assertNotError(errorPrepare);
        const groupedPrepare = groupMigrations(dataPrepare.migrations);
        expect(groupedPrepare.executed.length).toBe(1);
        expect(groupedPrepare.skipped.length).toBe(0);
        expect(groupedPrepare.notApplicable.length).toBe(0);

        const ddbSearchRecordsPrepare = await scanTable(ddbTable, {
            entity: "CmsEntries",
            filters: [
                {
                    attr: "modelId",
                    eq: "acoSearchRecord"
                }
            ]
        });

        const ddbEsSearchRecordsPrepare = await scanTable(ddbToEsTable, {
            entity: "CmsEntriesElasticsearch",
            filters: [
                {
                    attr: "index",
                    contains: "acosearchrecord"
                }
            ]
        });

        expect(ddbSearchRecordsPrepare.length).toBe(ddbPages.length * 2);
        expect(ddbEsSearchRecordsPrepare.length).toBe(ddbPages.length);
        /**
         * And then we execute current the 5.37.0_001 migration.
         */
        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [AcoRecords_5_37_0_001]
        });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBeGreaterThanOrEqual(1);
        expect(grouped.skipped.length).toBeGreaterThanOrEqual(0);
        expect(grouped.notApplicable.length).toBe(0);

        const searchRecordsAfterMigrations = await scanTable(ddbTable, {
            filters: [
                {
                    attr: "_et",
                    eq: "CmsEntries"
                }
            ]
        });
        const cmsEntries = searchRecordsAfterMigrations.filter(r => {
            return r.modelId === PB_ACO_SEARCH_MODEL_ID;
        });

        expect(searchRecordsAfterMigrations).toHaveLength(ddbPages.length * 2);
        expect(cmsEntries).toHaveLength(ddbPages.length * 2);
        /**
         * We are expecting that the AcoRecords_5_37_0_001 will be executed.
         * For the AcoRecords_5_35_0_006 it is possible that it is a second iteration of the migration runs and at that point it is not executed.
         * Because of that, we are checking for skipped to be 1 or less and executed to be 1 or 2.
         */
        expect(grouped.executed.length).toBeGreaterThanOrEqual(1);
        expect(grouped.executed.length).toBeLessThanOrEqual(2);
        expect(grouped.skipped.length).toBeGreaterThanOrEqual(0);
        expect(grouped.skipped.length).toBeLessThanOrEqual(1);
        expect(grouped.notApplicable.length).toBe(0);

        const searchRecords = await scanTable(ddbTable, {
            filters: [
                {
                    attr: "modelId",
                    eq: PB_ACO_SEARCH_MODEL_ID
                }
            ]
        });

        expect(searchRecords.length).toBe(ddbPages.length * 2);

        for (const page of ddbPages) {
            const {
                createdBy,
                createdOn,
                id,
                locale,
                locked,
                path,
                pid,
                savedOn,
                status,
                tenant,
                title,
                version
            } = page;

            const latestSearchRecord = searchRecords.find(
                record => record.id === `wby-aco-${pid}#0001` && record.SK === "L"
            );
            const revisionSearchRecord = searchRecords.find(
                record => record.id === `wby-aco-${pid}#0001` && record.SK === "REV#0001"
            );

            const values = {
                "text@title": title,
                "text@content": `${title} Heading ${pid} Lorem ipsum dolor sit amet.`,
                "text@type": PB_PAGE_TYPE,
                "object@location": {
                    "text@folderId": ROOT_FOLDER
                },
                "text@tags": [`tag-${pid}-1`, `tag-${pid}-2`],
                "object@data": {
                    ["object@createdBy"]: {
                        ["text@id"]: createdBy.id,
                        ["text@type"]: createdBy.type,
                        ["text@displayName"]: createdBy.displayName
                    },
                    ["datetime@createdOn"]: createdOn,
                    ["text@id"]: id,
                    ["boolean@locked"]: locked,
                    ["text@path"]: path,
                    ["text@pid"]: pid,
                    ["datetime@savedOn"]: savedOn,
                    ["text@status"]: status,
                    ["text@title"]: title,
                    ["number@version"]: version
                }
            };

            // Checking latest ACO search record
            expect(latestSearchRecord).toMatchObject({
                PK: `T#${tenant}#L#${locale}#CMS#CME#wby-aco-${pid}`,
                SK: "L",
                id: `wby-aco-${pid}#0001`,
                entryId: `wby-aco-${pid}`,
                locale,
                locked: false,
                modelId: PB_ACO_SEARCH_MODEL_ID,
                status: "draft",
                tenant,
                TYPE: "cms.entry.l",
                values
            });

            // Checking revision 1 ACO search record
            expect(revisionSearchRecord).toMatchObject({
                PK: `T#${tenant}#L#${locale}#CMS#CME#wby-aco-${pid}`,
                SK: "REV#0001",
                id: `wby-aco-${pid}#0001`,
                entryId: `wby-aco-${pid}`,
                locale,
                locked: false,
                modelId: PB_ACO_SEARCH_MODEL_ID,
                status: "draft",
                tenant,
                TYPE: "cms.entry",
                values
            });
        }
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(ddbTable, [...createTenantsData(), ...createLocalesData()]);
        await insertTestPages({
            ddbTable,
            esTable: ddbToEsTable,
            elasticsearchClient,
            numberOfPages: 1
        });

        /**
         * First we are executing the 5.35.0_006 migration as it creates the original ACO Search Records.
         */
        const handlerPrepare = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [AcoRecords_5_35_0_006]
        });
        /**
         * We do not need to check values in the response as those are tested already.
         */
        await handlerPrepare();
        /**
         * And then we execute current the 5.37.0_001 migration.
         */
        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [AcoRecords_5_37_0_001]
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
