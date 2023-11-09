import {
    createElasticsearchClient,
    ElasticsearchClient
} from "@webiny/project-utils/testing/elasticsearch/createClient";
import {
    assertNotError,
    createDdbEsMigrationHandler,
    delay,
    getDynamoToEsTable,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { AcoRecords_5_35_0_006 } from "~/migrations/5.35.0/006/ddb-es";
import { createLocalesData, createTenantsData } from "./006.data";
import { esGetIndexName } from "~/utils";
import { getCompressedData } from "~/migrations/5.35.0/006/utils/getCompressedData";
import { ACO_SEARCH_MODEL_ID, PB_PAGE_TYPE, ROOT_FOLDER } from "~/migrations/5.35.0/006/constants";
import { insertTestPages } from "./insertTestPages";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.35.0-006", () => {
    const ddbTable = getPrimaryDynamoDbTable();
    const ddbToEsTable = getDynamoToEsTable();
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
            dynamoToEsTable: ddbToEsTable,
            elasticsearchClient,
            migrations: [AcoRecords_5_35_0_006]
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
            dynamoToEsTable: ddbToEsTable,
            elasticsearchClient,
            migrations: [AcoRecords_5_35_0_006]
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
            dynamoToEsTable: ddbToEsTable,
            elasticsearchClient,
            migrations: [AcoRecords_5_35_0_006]
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
            elasticsearchClient,
            ddbTable,
            esTable: ddbToEsTable
        });
        await delay(3000);

        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            dynamoToEsTable: ddbToEsTable,
            elasticsearchClient,
            migrations: [AcoRecords_5_35_0_006]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const ddbSearchRecords = await scanTable(ddbTable, {
            entity: "CmsEntries",
            filters: [
                {
                    attr: "modelId",
                    eq: "acoSearchRecord"
                }
            ]
        });

        const ddbEsSearchRecords = await scanTable(ddbToEsTable, {
            entity: "CmsEntriesElasticsearch",
            filters: [
                {
                    attr: "index",
                    contains: "acosearchrecord"
                }
            ]
        });

        expect(ddbSearchRecords.length).toBe(ddbPages.length * 2);
        expect(ddbEsSearchRecords.length).toBe(ddbPages.length);

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
                version,
                webinyVersion
            } = page;

            const ddbSearchRecord = ddbSearchRecords.find(
                record => record.id === `wby-aco-${pid}#0001`
            );
            const ddbEsSearchRecord = ddbEsSearchRecords.find(
                record => record.PK === `T#${tenant}#L#${locale}#CMS#CME#wby-aco-${pid}`
            );

            // Checking DDB ACO search record
            expect(ddbSearchRecord).toMatchObject({
                PK: `T#${tenant}#L#${locale}#CMS#CME#wby-aco-${pid}`,
                SK: "L",
                TYPE: "L",
                entryId: `wby-aco-${pid}`,
                id: `wby-aco-${pid}#0001`,
                locale,
                tenant,
                version: 1,
                webinyVersion,
                values: {
                    "text@title": title,
                    "text@content": `${title} Heading ${pid} Lorem ipsum dolor sit amet.`,
                    "text@type": PB_PAGE_TYPE,
                    "object@location": {
                        "text@folderId": ROOT_FOLDER
                    },
                    "text@tags": [`tag-${pid}-1`, `tag-${pid}-2`],
                    "wby-aco-json@data": {
                        createdBy,
                        createdOn,
                        id,
                        locked,
                        path,
                        pid,
                        savedOn,
                        status,
                        title,
                        version
                    }
                }
            });

            const data = await getCompressedData({
                modelId: ACO_SEARCH_MODEL_ID,
                version: 1,
                savedOn,
                locale,
                status: "draft",
                values: {
                    "text@type": PB_PAGE_TYPE,
                    "text@title": title,
                    "text@content": `${title} Heading ${pid} Lorem ipsum dolor sit amet.`,
                    "text@tags": [`tag-${pid}-1`, `tag-${pid}-2`],
                    "object@location": {
                        "text@folderId": ROOT_FOLDER
                    },
                    "wby-aco-json@data": {
                        id: `${pid}#0001`,
                        pid,
                        title,
                        createdBy,
                        createdOn,
                        savedOn,
                        status,
                        version,
                        locked,
                        path
                    }
                },
                createdBy,
                entryId: `wby-aco-${pid}`,
                tenant,
                createdOn,
                locked: false,
                ownedBy: createdBy,
                webinyVersion: process.env.WEBINY_VERSION,
                id: `wby-aco-${pid}#0001`,
                modifiedBy: createdBy,
                latest: true,
                TYPE: "cms.entry.l",
                __type: "cms.entry.l",
                rawValues: {
                    "object@location": {}
                }
            });

            // Checking DDB + ES ACO search record
            expect(ddbEsSearchRecord).toMatchObject({
                PK: `T#${tenant}#L#${locale}#CMS#CME#wby-aco-${pid}`,
                SK: "L",
                index: esGetIndexName({
                    tenant,
                    locale,
                    type: "acosearchrecord",
                    isHeadlessCmsModel: true
                }),
                data
            });
        }
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(ddbTable, [...createTenantsData(), ...createLocalesData()]);
        await insertTestPages({
            esTable: ddbToEsTable,
            elasticsearchClient,
            ddbTable,
            numberOfPages: 1
        });

        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            dynamoToEsTable: ddbToEsTable,
            elasticsearchClient,
            migrations: [AcoRecords_5_35_0_006]
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
