import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { FileManager_5_35_0_001, File } from "~/migrations/5.35.0/001/ddb-es";
import {
    assertNotError,
    getPrimaryDynamoDbTable,
    insertDynamoDbTestData,
    scanTable,
    logTestNameBeforeEachTest,
    createDdbEsMigrationHandler,
    createId,
    delay,
    groupMigrations
} from "~tests/utils";
import { testData } from "./001.data";
import {
    createLegacySettingsEntity,
    createSettingsEntity
} from "~/migrations/5.35.0/001/entities/createSettingsEntity";
import { insertElasticsearchTestData } from "~tests/utils/insertElasticsearchTestData";
import { esGetIndexName } from "~/utils";

jest.retryTimes(0);
jest.setTimeout(1200000);

/**
 * Reduced number of records because it is not necessary anymore to run tests with large amount of records.
 */
const NUMBER_OF_FILES = 10;
const INDEX_TYPE = "file-manager";
let numberOfGeneratedFiles = 0;

describe("5.35.0-001", () => {
    const table = getPrimaryDynamoDbTable();
    const elasticsearchClient = createElasticsearchClient();

    beforeAll(async () => {
        process.env.ELASTIC_SEARCH_INDEX_PREFIX =
            new Date().toISOString().replace(/\.|\:/g, "-").toLowerCase() + "-";

        await elasticsearchClient.indices.deleteAll();
    });
    afterEach(async () => {
        await elasticsearchClient.indices.deleteAll();
    });

    const insertTestFiles = async (numberOfFiles = NUMBER_OF_FILES) => {
        const tenants = testData
            .filter(item => item.TYPE === "tenancy.tenant")
            .map(tenant => tenant.id) as string[];

        for (const tenant of tenants) {
            const locales = testData
                .filter(item => item.PK === `T#${tenant}#I18N#L`)
                .map(locale => locale.code) as string[];

            for (const locale of locales) {
                let batch = [];
                const allFiles = [];
                for (let index = 0; index < numberOfFiles; index++) {
                    if (index % 25 === 0) {
                        await insertDynamoDbTestData(table, batch);
                        batch = [];
                    }

                    const id = createId();

                    const file = {
                        id,
                        createdOn: "2023-01-25T09:38:41.943Z",
                        key: id + "welcome-to-webiny-page-8ldbh4sq4-hero-block-bg.svg",
                        locale,
                        meta: {
                            private: true
                        },
                        name: "welcome-to-webiny-page-8ldbh4sq4-hero-block-bg.svg",
                        size: 1864,
                        tags: [],
                        tenant,
                        createdBy: {
                            displayName: "Pavel Denisjuk",
                            id: "e6ea2871-ba36-4494-87ac-afb73d4e7eb2",
                            type: "admin"
                        },
                        type: "image/svg+xml",
                        webinyVersion: "0.0.0"
                    };

                    batch.push({
                        PK: `T#${tenant}#L#${locale}#FM#F${id}`,
                        SK: "A",
                        TYPE: "fm.file",
                        _ct: "2023-01-25T09:38:41.961Z",
                        _et: "Files",
                        _md: "2023-01-25T09:38:41.961Z",
                        ...file
                    });

                    allFiles.push(file);

                    if (allFiles.length > 3000) {
                        await insertElasticsearchTestData<File>(
                            elasticsearchClient,
                            allFiles,
                            item => {
                                return esGetIndexName({
                                    tenant: item.tenant,
                                    locale: item.locale,
                                    type: INDEX_TYPE
                                });
                            }
                        );
                        allFiles.length = 0;
                    }
                }
                await insertDynamoDbTestData(table, batch);
                await insertElasticsearchTestData<File>(elasticsearchClient, allFiles, item => {
                    return esGetIndexName({
                        tenant: item.tenant,
                        locale: item.locale,
                        type: INDEX_TYPE
                    });
                });

                // Track generated files
                numberOfGeneratedFiles += NUMBER_OF_FILES;
            }
        }
    };

    logTestNameBeforeEachTest();

    it("should not run if system is not installed", async () => {
        const handler = createDdbEsMigrationHandler({
            primaryTable: table,
            dynamoToEsTable: table,
            elasticsearchClient,
            migrations: [FileManager_5_35_0_001]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        process.stdout.write("Inserting test data...\n");
        await insertDynamoDbTestData(table, testData);
        await insertTestFiles();
        await delay(3000);

        process.stdout.write("Running migration...\n");
        const handler = createDdbEsMigrationHandler({
            primaryTable: table,
            dynamoToEsTable: table,
            elasticsearchClient,
            migrations: [FileManager_5_35_0_001]
        });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        // ASSERT FILE MANAGER FILE CHANGES
        const allFiles = await scanTable(table, {
            entity: "File",
            filters: [
                { attr: "TYPE", eq: "fm.file" },
                { attr: "data", exists: true }
            ]
        });

        expect(allFiles.length).toEqual(numberOfGeneratedFiles);
        for (const file of allFiles) {
            expect(file.GSI1_PK.endsWith("#FM#FILES")).toBe(true);
            expect(file.GSI1_SK).toBe(file.id);
            // We still have the original `id` attribute, so compare with that.
            expect(file.data.id).toEqual(file.id);
            expect(file.TYPE).toEqual("fm.file");
            expect(file.entity).toEqual("File");
        }

        // ASSERT FILE MANAGER SETTINGS CHANGES
        const legacySettings = createLegacySettingsEntity(table);
        const { Item: legacyRecord } = await legacySettings.get({
            PK: `T#root#FM#SETTINGS`,
            SK: "default"
        });

        expect(legacyRecord).toBeTruthy();
        expect(legacyRecord.SK).toEqual("default");
        expect(legacyRecord.uploadMaxFileSize).toEqual(26214401);
        expect(legacyRecord.srcPrefix).toEqual("https://d30lvz3v210qz3.cloudfront.net/files/");

        const newSettings = createSettingsEntity(table);
        const { Item: newRecord } = await newSettings.get({
            PK: `T#root#FM#SETTINGS`,
            SK: "A"
        });

        expect(newRecord).toBeTruthy();
        expect(newRecord.SK).toEqual("A");
        expect(newRecord.data.uploadMaxFileSize).toEqual(26214401);
        expect(newRecord.data.srcPrefix).toEqual("https://d30lvz3v210qz3.cloudfront.net/files/");
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertDynamoDbTestData(table, testData);
        await insertTestFiles(25);
        const handler = createDdbEsMigrationHandler({
            primaryTable: table,
            dynamoToEsTable: table,
            elasticsearchClient,
            migrations: [FileManager_5_35_0_001]
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
