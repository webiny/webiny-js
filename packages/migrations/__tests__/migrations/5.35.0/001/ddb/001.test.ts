import { FileManager_5_35_0_001 } from "~/migrations/5.35.0/001/ddb";
import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { testData } from "./001.data";
import {
    createLegacySettingsEntity,
    createSettingsEntity
} from "~/migrations/5.35.0/001/entities/createSettingsEntity";

jest.retryTimes(0);
jest.setTimeout(900000);

/**
 * Reduced number of records because it is not necessary anymore to run tests with large amount of records.
 */
const NUMBER_OF_FILES = 50;

describe("5.35.0-001", () => {
    const table = getPrimaryDynamoDbTable();

    const insertTestFiles = async (numberOfFiles = NUMBER_OF_FILES) => {
        let batch = [];
        for (let index = 0; index < numberOfFiles; index++) {
            if (index % 25 === 0) {
                await insertDynamoDbTestData(table, batch);
                batch = [];
            }

            batch.push({
                PK: "T#root#L#en-US#FM#F",
                SK: "63d0f8a1ce8f180008bb6054" + index,
                createdBy: {
                    displayName: "Pavel Denisjuk",
                    id: "e6ea2871-ba36-4494-87ac-afb73d4e7eb2",
                    type: "admin"
                },
                createdOn: "2023-01-25T09:38:41.943Z",
                id: "63d0f8a1ce8f180008bb6054" + index,
                key: index + "welcome-to-webiny-page-8ldbh4sq4-hero-block-bg.svg",
                locale: "en-US",
                meta: {
                    private: true
                },
                name: "welcome-to-webiny-page-8ldbh4sq4-hero-block-bg.svg",
                size: 1864,
                tags: [],
                tenant: "root",
                TYPE: "fm.file",
                type: "image/svg+xml",
                webinyVersion: "0.0.0",
                _ct: "2023-01-25T09:38:41.961Z",
                _et: "Files",
                _md: "2023-01-25T09:38:41.961Z"
            });
        }
        await insertDynamoDbTestData(table, batch);
    };

    logTestNameBeforeEachTest();

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    it("should not run if system is not installed", async () => {
        const handler = createDdbMigrationHandler({ table, migrations: [FileManager_5_35_0_001] });

        const spy = jest.spyOn(FileManager_5_35_0_001.prototype, "execute");

        const { data, error } = await handler();
        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(spy).toHaveBeenCalledTimes(0);
    });

    it("should execute migration", async () => {
        process.stdout.write("Inserting test data...\n");
        await insertDynamoDbTestData(table, testData);
        await insertTestFiles();

        process.stdout.write("Running migration...\n");
        const handler = createDdbMigrationHandler({ table, migrations: [FileManager_5_35_0_001] });
        const { data, error } = await handler();
        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);

        // ASSERT FILE CHANGES

        // Let's make sure that the number of migrated records corresponds to the number of the original records.
        const allNewFiles = (
            await scanTable(table, {
                entity: "File",
                filters: [
                    { attr: "TYPE", eq: "fm.file" },
                    { attr: "data", exists: true }
                ]
            })
        ).sort((a, b) => (a.GSI1_SK > b.GSI1_SK ? 1 : -1));

        const allOldFiles = (
            await scanTable(table, {
                entity: "Files",
                filters: [
                    { attr: "TYPE", eq: "fm.file" },
                    { attr: "GSI1_PK", exists: false },
                    { attr: "GSI1_SK", exists: false }
                ]
            })
        ).sort((a, b) => (a.id > b.id ? 1 : -1));

        expect(allNewFiles.length).toEqual(NUMBER_OF_FILES);
        expect(allOldFiles.length).toEqual(NUMBER_OF_FILES);

        expect(allNewFiles[0].GSI1_PK.endsWith("#FM#FILES")).toBe(true);
        expect(allNewFiles[0].data.id).toEqual(allOldFiles[0].id);

        // ASSERT FILE MANAGER SETTINGS CHANGES
        const legacySettings = createLegacySettingsEntity(table);
        const { Item: legacyRecord } = await legacySettings.get({
            PK: `T#root#FM#SETTINGS`,
            SK: "default"
        });

        expect(legacyRecord).toBeTruthy();
        expect(legacyRecord!.SK).toEqual("default");
        expect(legacyRecord!.uploadMaxFileSize).toEqual(26214401);
        expect(legacyRecord!.srcPrefix).toEqual("https://d30lvz3v210qz3.cloudfront.net/files/");

        const newSettings = createSettingsEntity(table);
        const { Item: newRecord } = await newSettings.get({
            PK: `T#root#FM#SETTINGS`,
            SK: "A"
        });

        expect(newRecord).toBeTruthy();
        expect(newRecord!.SK).toEqual("A");
        expect(newRecord!.data.uploadMaxFileSize).toEqual(26214401);
        expect(newRecord!.data.srcPrefix).toEqual("https://d30lvz3v210qz3.cloudfront.net/files/");
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertDynamoDbTestData(table, testData);
        await insertTestFiles(25);

        const handler = createDdbMigrationHandler({ table, migrations: [FileManager_5_35_0_001] });

        // Should run the migration
        process.stdout.write("[First run]\n");
        const firstRun = await handler();
        assertNotError(firstRun.error);
        const firstData = groupMigrations(firstRun.data.migrations);
        expect(firstData.executed.length).toBe(1);

        // Should skip the migration
        const spy = jest.spyOn(FileManager_5_35_0_001.prototype, "execute");
        process.stdout.write("[Second run]\n");
        const secondRun = await handler();
        assertNotError(secondRun.error);
        const secondData = groupMigrations(secondRun.data.migrations);
        expect(secondData.executed.length).toBe(0);
        expect(secondData.skipped.length).toBe(1);
        expect(spy).toHaveBeenCalledTimes(0);
    });
});
