import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/client";

import {
    assertNotError,
    createDdbEsMigrationHandler,
    createId,
    delay,
    getDynamoToEsTable,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";

import { AcoRecords_5_36_0_001, File } from "~/migrations/5.36.0/001/ddb-es";

import { createdBy, createLocalesData, createTenantsData } from "./001.data";
import { insertElasticsearchTestData } from "~tests/utils/insertElasticsearchTestData";
import { esGetIndexName } from "~/utils";
import { getCompressedData } from "~/migrations/5.36.0/001/utils/getCompressedData";
import { ACO_SEARCH_MODEL_ID, FM_FILE_TYPE, ROOT_FOLDER } from "~/migrations/5.36.0/001/constants";

jest.retryTimes(0);
jest.setTimeout(900000);

const NUMBER_OF_FILES = 50;
const INDEX_TYPE = "file-manager";
let numberOfGeneratedFiles = 0;

describe("5.36.0-001", () => {
    const ddbTable = getPrimaryDynamoDbTable();
    const ddbToEsTable = getDynamoToEsTable();
    const elasticsearchClient = createElasticsearchClient();

    const ddbFiles: Record<string, any>[] = [];
    const ddbEsFiles: Record<string, any>[] = [];
    const esFiles: any[] = [];

    beforeEach(async () => {
        process.env.ELASTIC_SEARCH_INDEX_PREFIX =
            new Date().toISOString().replace(/\.|\:/g, "-").toLowerCase() + "-";

        await elasticsearchClient.indices.deleteAll();
    });
    afterEach(async () => {
        await elasticsearchClient.indices.deleteAll();
    });

    const insertTestFiles = async (numberOfFiles = NUMBER_OF_FILES) => {
        ddbFiles.length = 0;
        ddbEsFiles.length = 0;
        esFiles.length = 0;

        const tenants = createTenantsData().map(tenant => tenant.data.id);
        const testLocales = createLocalesData();

        for (const tenant of tenants) {
            const locales = testLocales
                .filter(item => item.PK === `T#${tenant}#I18N#L`)
                .map(locale => locale.code) as string[];

            for (const locale of locales) {
                for (let index = 0; index < numberOfFiles; index++) {
                    const id = createId();

                    const file = {
                        aliases: [],
                        createdBy,
                        createdOn: new Date().toISOString(),
                        id,
                        key: `${id}/demo-image-${id}.png`,
                        locale,
                        meta: {
                            private: false
                        },
                        name: `demo-image-${id}.png`,
                        size: 10000,
                        tags: [`tag-a-${id}`, `tag-b-${id}`],
                        tenant,
                        type: "image/png",
                        webinyVersion: "0.0.0"
                    };

                    ddbFiles.push({
                        PK: `T#root#L#en-US#FM#F${id}`,
                        SK: "A",
                        GSI1_PK: "T#root#L#en-US#FM#FILES",
                        GSI1_SK: id,
                        TYPE: "fm.file",
                        _ct: new Date().toISOString(),
                        _et: "FM.File",
                        _md: new Date().toISOString(),
                        ...file
                    });

                    ddbEsFiles.push({
                        PK: `T#${tenant}#L#${locale}#FM#F${id}`,
                        SK: "A",
                        index: `${tenant.toLowerCase()}-${locale.toLowerCase()}-file-manager`,
                        _ct: new Date().toISOString(),
                        _et: "FilesElasticsearch",
                        _md: new Date().toISOString(),
                        data: getCompressedData(file)
                    });

                    esFiles.push(file);
                }

                // Inserting useful data: file records
                await insertDynamoDbTestData(ddbTable, ddbFiles);
                await insertDynamoDbTestData(ddbToEsTable, ddbFiles);
                await insertElasticsearchTestData<File>(elasticsearchClient, esFiles, item => {
                    return esGetIndexName({
                        tenant: item.tenant,
                        locale: item.locale,
                        type: INDEX_TYPE
                    });
                });

                // Track generated files
                numberOfGeneratedFiles += numberOfFiles;
            }
        }
    };

    logTestNameBeforeEachTest();

    it("should not run if no tenant found", async () => {
        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            dynamoToEsTable: ddbToEsTable,
            elasticsearchClient,
            migrations: [AcoRecords_5_36_0_001]
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
            migrations: [AcoRecords_5_36_0_001]
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
            migrations: [AcoRecords_5_36_0_001]
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
        await insertTestFiles();
        await delay(3000);

        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            dynamoToEsTable: ddbToEsTable,
            elasticsearchClient,
            migrations: [AcoRecords_5_36_0_001]
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

        expect(ddbSearchRecords.length).toBe(numberOfGeneratedFiles * 2);
        expect(ddbEsSearchRecords.length).toBe(numberOfGeneratedFiles);

        for (const file of ddbFiles) {
            const {
                aliases,
                createdBy,
                createdOn,
                id,
                key,
                locale,
                meta,
                name,
                size,
                tags,
                tenant,
                type
            } = file.data;

            const ddbSearchRecord = ddbSearchRecords.find(
                record => record.id === `wby-aco-${id}#0001`
            );
            const ddbEsSearchRecord = ddbEsSearchRecords.find(
                record => record.PK === `T#${tenant}#L#${locale}#CMS#CME#wby-aco-${id}`
            );

            const values = {
                "text@title": name,
                "text@type": FM_FILE_TYPE,
                "object@location": {
                    "text@folderId": ROOT_FOLDER
                },
                "text@tags": [...tags, "mime:image/png"],
                "wby-aco-json@data": {
                    id,
                    key,
                    size,
                    type,
                    name,
                    createdOn,
                    createdBy,
                    aliases,
                    meta
                }
            };

            // Checking DDB ACO search record
            expect(ddbSearchRecord).toMatchObject({
                PK: `T#${tenant}#L#${locale}#CMS#CME#wby-aco-${id}`,
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
                    "text@type": FM_FILE_TYPE,
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
                    "text@type": FM_FILE_TYPE,
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
                PK: `T#${tenant}#L#${locale}#CMS#CME#wby-aco-${id}`,
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
        await insertTestFiles(1);

        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            dynamoToEsTable: ddbToEsTable,
            elasticsearchClient,
            migrations: [AcoRecords_5_36_0_001]
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
