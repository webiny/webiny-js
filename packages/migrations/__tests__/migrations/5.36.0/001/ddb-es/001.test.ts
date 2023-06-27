import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";

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
import { esCreateIndex, esGetIndexName } from "~/utils";
import { getCompressedData } from "~/migrations/5.36.0/001/utils/getCompressedData";
import { ACO_SEARCH_MODEL_ID, FM_FILE_TYPE, ROOT_FOLDER } from "~/migrations/5.36.0/001/constants";
import { addMimeTag } from "~/migrations/5.36.0/001/utils/createMimeTag";

jest.retryTimes(0);
jest.setTimeout(900000);

const NUMBER_OF_FILES = 3000;
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

    const insertTestFiles = async (numberOfFiles = NUMBER_OF_FILES, privateFile = false) => {
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
                // We need to add an ACO record index, in the real world this has been already created by 5.35.0 migration
                await esCreateIndex({
                    elasticsearchClient,
                    tenant,
                    locale,
                    type: "acosearchrecord",
                    isHeadlessCmsModel: true
                });

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
                            private: privateFile
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
                        data: file
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

                // Track generated files
                numberOfGeneratedFiles += numberOfFiles;
            }
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
        await elasticsearchClient.indices.refreshAll();
    };

    const insertEmptyFileIndexes = async () => {
        const tenants = createTenantsData().map(tenant => tenant.data.id);
        const testLocales = createLocalesData();

        for (const tenant of tenants) {
            const locales = testLocales
                .filter(item => item.PK === `T#${tenant}#I18N#L`)
                .map(locale => locale.code) as string[];

            for (const locale of locales) {
                await esCreateIndex({
                    elasticsearchClient: elasticsearchClient,
                    tenant,
                    locale,
                    type: INDEX_TYPE,
                    isHeadlessCmsModel: false
                });
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

    it("should not run if no files found - no index found", async () => {
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

    it("should not run if no files found - empty index", async () => {
        await insertTestData(ddbTable, [...createTenantsData(), ...createLocalesData()]);
        await insertEmptyFileIndexes();

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
                type,
                webinyVersion
            } = file.data;

            const ddbSearchRecord = ddbSearchRecords.find(
                record => record.id === `wby-aco-${id}#0001`
            );
            const ddbEsSearchRecord = ddbEsSearchRecords.find(
                record => record.PK === `T#${tenant}#L#${locale}#CMS#CME#wby-aco-${id}`
            );

            // Checking DDB ACO search record
            expect(ddbSearchRecord).toMatchObject({
                PK: `T#${tenant}#L#${locale}#CMS#CME#wby-aco-${id}`,
                SK: "L",
                TYPE: "L",
                entryId: `wby-aco-${id}`,
                id: `wby-aco-${id}#0001`,
                locale,
                tenant,
                version: 1,
                webinyVersion,
                values: {
                    "text@title": name,
                    "text@type": FM_FILE_TYPE,
                    "object@location": {
                        "text@folderId": ROOT_FOLDER
                    },
                    "text@tags": addMimeTag(tags, type),
                    "wby-aco-json@data": {
                        aliases,
                        createdBy,
                        createdOn,
                        id,
                        key,
                        meta,
                        name,
                        size,
                        type
                    }
                }
            });

            const data = await getCompressedData({
                modelId: ACO_SEARCH_MODEL_ID,
                version: 1,
                locale,
                status: "draft",
                values: {
                    "text@type": FM_FILE_TYPE,
                    "text@title": name,
                    "text@tags": addMimeTag(tags, type),
                    "object@location": {
                        "text@folderId": ROOT_FOLDER
                    },
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
                },
                createdBy,
                entryId: `wby-aco-${id}`,
                tenant,
                createdOn,
                savedOn: createdOn,
                locked: false,
                ownedBy: createdBy,
                webinyVersion: process.env.WEBINY_VERSION,
                id: `wby-aco-${id}#0001`,
                modifiedBy: createdBy,
                latest: true,
                TYPE: "cms.entry.l",
                __type: "cms.entry.l",
                rawValues: { "object@location": {} }
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

    it("should not migrate file records is marked as private", async () => {
        await insertTestData(ddbTable, [...createTenantsData(), ...createLocalesData()]);
        await insertTestFiles(5, true);

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

        expect(ddbSearchRecords.length).toBe(0);
        expect(ddbEsSearchRecords.length).toBe(0);
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
