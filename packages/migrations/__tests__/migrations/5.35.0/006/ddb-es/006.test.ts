import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/client";

import {
    assertNotError,
    createDdbEsMigrationHandler,
    createId,
    delay,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";

import { AcoRecords_5_35_0_006, Page } from "~/migrations/5.35.0/006/ddb-es";

import { createTenantsData, createLocalesData, createPagesData } from "./006.data";
import { insertElasticsearchTestData } from "~tests/utils/insertElasticsearchTestData";
import { getIndexName } from "~/utils";

jest.retryTimes(0);
jest.setTimeout(900000);

const NUMBER_OF_PAGES = 100;
let numberOfGeneratedPages = 0;

describe("5.35.0-006", () => {
    const table = getPrimaryDynamoDbTable();
    const elasticsearchClient = createElasticsearchClient();

    beforeAll(() => {
        process.env.ELASTIC_SEARCH_INDEX_PREFIX =
            new Date().toISOString().replace(/\.|\:/g, "-").toLowerCase() + "-";
    });

    const createPagesData = async (numberOfPages = NUMBER_OF_PAGES) => {
        const tenants = createTenantsData();

        for (const tenant of tenants) {
            const locales = createLocalesData();

            for (const locale of locales) {
                let batch = [];
                const allPages = [];
                for (let index = 0; index < numberOfPages; index++) {
                    if (index % 25 === 0) {
                        await insertDynamoDbTestData(table, batch);
                        batch = [];
                    }

                    const id = createId();

                    const page = {
                        id: `${id}#0001`,
                        category: "static",
                        content: {
                            compression: "jsonpack",
                            content:
                                "id|iQZiPRF1kL|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
                        },
                        createdBy: {
                            displayName: "Leonardo Giacone",
                            id: "172d2b80-d554-439e-ad68-445b1486e60a",
                            type: "admin"
                        },
                        createdOn: "2023-03-29T10:00:33.958Z",
                        editor: "page-builder",
                        locale,
                        locked: false,
                        ownedBy: {
                            displayName: "Leonardo Giacone",
                            id: "172d2b80-d554-439e-ad68-445b1486e60a",
                            type: "admin"
                        },
                        path: `/untitled-${id}`,
                        pid: `${id}`,
                        savedOn: "2023-03-29T10:00:39.123Z",
                        settings: {
                            general: {
                                image: null,
                                layout: "static",
                                snippet: null,
                                tags: null
                            },
                            seo: {
                                description: null,
                                meta: [],
                                title: null
                            },
                            social: {
                                description: null,
                                image: null,
                                meta: [],
                                title: null
                            }
                        },
                        status: "draft",
                        tenant: tenant.data.id,
                        title: `Page ${id}`,
                        titleLC: `page ${id}`
                    };

                    batch.push({
                        PK: `T#${tenant.data.id}#L#${locale.code}#PB#${id}`,
                        SK: "1",
                        TYPE: "pb.page",
                        _ct: "2023-01-25T09:38:41.961Z",
                        _et: "PbPages",
                        _md: "2023-01-25T09:38:41.961Z",
                        ...page
                    });

                    batch.push({
                        PK: `T#${tenant.data.id}#L#${locale.code}#PB#L`,
                        SK: id,
                        TYPE: "pb.page",
                        _ct: "2023-01-25T09:38:41.961Z",
                        _et: "PbPages",
                        _md: "2023-01-25T09:38:41.961Z",
                        ...page
                    });

                    allPages.push(page);

                    if (allPages.length > 3000) {
                        await insertElasticsearchTestData<Page>(
                            elasticsearchClient,
                            allPages,
                            item => {
                                return getIndexName(item.tenant, item.locale);
                            }
                        );
                        allPages.length = 0;
                    }
                }
                await insertDynamoDbTestData(table, batch);
                await insertElasticsearchTestData<Page>(elasticsearchClient, allPages, item => {
                    return getIndexName(item.tenant, item.locale);
                });

                console.log("allPages", allPages);

                // Track generated files
                numberOfGeneratedPages += NUMBER_OF_PAGES;
            }
        }
    };

    logTestNameBeforeEachTest();

    it("should not run if no tenant found", async () => {
        const handler = createDdbEsMigrationHandler({
            primaryTable: table,
            dynamoToEsTable: table,
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
        await insertTestData(table, [...createTenantsData()]);

        const handler = createDdbEsMigrationHandler({
            primaryTable: table,
            dynamoToEsTable: table,
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
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);

        const handler = createDdbEsMigrationHandler({
            primaryTable: table,
            dynamoToEsTable: table,
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
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);

        await createPagesData();
        await delay(3000);

        const handler = createDdbEsMigrationHandler({
            primaryTable: table,
            dynamoToEsTable: table,
            elasticsearchClient,
            migrations: [AcoRecords_5_35_0_006]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const searchRecords = await scanTable(table, {
            filters: [
                {
                    attr: "modelId",
                    eq: "acoSearchRecord"
                }
            ]
        });

        expect(searchRecords.length).toBe(22);

        // Test result with snapshots - for some fields we need to use property matchers
        searchRecords.forEach(record => {
            expect(record).toMatchSnapshot({
                created: expect.any(String),
                modified: expect.any(String),
                webinyVersion: expect.any(String)
            });
        });
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, [
            ...createTenantsData(),
            ...createLocalesData(),
            ...createPagesData()
        ]);

        const handler = createDdbEsMigrationHandler({
            primaryTable: table,
            dynamoToEsTable: table,
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
