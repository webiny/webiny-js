import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/client";

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

import {
    createTenantsData,
    createLocalesData,
    createDdbEsPagesData,
    createDdbPagesData
} from "./006.data";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.35.0-006", () => {
    const ddbTable = getPrimaryDynamoDbTable();
    const ddbToEsTable = getDynamoToEsTable();
    const elasticsearchClient = createElasticsearchClient();

    beforeAll(() => {
        process.env.ELASTIC_SEARCH_INDEX_PREFIX =
            new Date().toISOString().replace(/\.|\:/g, "-").toLowerCase() + "-";
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
        await insertTestData(ddbTable, [
            ...createTenantsData(),
            ...createLocalesData(),
            ...createDdbPagesData()
        ]);

        await insertTestData(ddbToEsTable, [...createDdbEsPagesData()]);

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

        expect(ddbSearchRecords.length).toBe(4);

        // Test result with snapshots - for some fields we need to use property matchers
        ddbSearchRecords.forEach(record => {
            expect(record).toMatchSnapshot({
                created: expect.any(String),
                modified: expect.any(String),
                webinyVersion: expect.any(String)
            });
        });

        const ddbEsSearchRecords = await scanTable(ddbToEsTable, {
            entity: "CmsEntries",
            filters: [
                {
                    attr: "index",
                    contains: "acosearchrecord"
                }
            ]
        });

        expect(ddbEsSearchRecords.length).toBe(2);

        ddbEsSearchRecords.forEach(record => {
            expect(record).toMatchSnapshot({
                created: expect.any(String),
                modified: expect.any(String)
            });
        });
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(ddbTable, [
            ...createTenantsData(),
            ...createLocalesData(),
            ...createDdbPagesData()
        ]);

        await insertTestData(ddbToEsTable, [...createDdbEsPagesData()]);

        await delay(3000);

        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            dynamoToEsTable: ddbToEsTable,
            elasticsearchClient,
            migrations: [AcoRecords_5_35_0_006]
        });

        // Should run the migration
        process.stdout.write("[First run]\n");
        const firstRun = await handler();
        assertNotError(firstRun.error);
        const firstData = groupMigrations(firstRun.data.migrations);
        expect(firstData.executed.length).toBe(1);

        // Should skip the migration
        process.stdout.write("[Second run]\n");
        const secondRun = await handler();
        assertNotError(secondRun.error);
        const secondData = groupMigrations(secondRun.data.migrations);
        expect(secondData.executed.length).toBe(0);
        expect(secondData.skipped.length).toBe(1);
        expect(secondData.notApplicable.length).toBe(0);
    });
});
