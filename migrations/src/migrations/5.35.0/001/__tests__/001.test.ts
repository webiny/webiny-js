import { FileManager_5_35_0_001 } from "~/migrations/5.35.0/001";
import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    insertTestData,
    scanTable,
    logTestNameBeforeEachTest
} from "~/testUtils";
import { testData } from "./001.data";

jest.retryTimes(0);

describe("5.35.0-001", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if system is not installed", async () => {
        const handler = createDdbMigrationHandler({ table, migration: FileManager_5_35_0_001 });

        const { data, error } = await handler();

        assertNotError(error);

        expect(data.executed.length).toBe(0);
        expect(data.skipped.length).toBe(1);
        expect(data.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, testData);

        const handler = createDdbMigrationHandler({ table, migration: FileManager_5_35_0_001 });
        const { data, error } = await handler();

        assertNotError(error);

        expect(data.executed.length).toBe(1);
        expect(data.skipped.length).toBe(0);
        expect(data.notApplicable.length).toBe(0);

        // Let's make sure that the number of migrated records corresponds to the number of the original records.
        const allNewFiles = (
            await scanTable(table, {
                entity: "File",
                filters: [
                    { attr: "TYPE", eq: "fm.file" },
                    { attr: "data", exists: true }
                ]
            })
        ).sort((a, b) => a.GSI1_SK > b.GSI1_SK ? 1 : -1);

        const allOldFiles = (
            await scanTable(table, {
                entity: "Files",
                filters: [
                    { attr: "TYPE", eq: "fm.file" },
                    { attr: "GSI1_PK", exists: false },
                    { attr: "GSI1_SK", exists: false }
                ]
            })
        ).sort((a, b) => a.id > b.id ? 1 : -1);

        expect(allNewFiles.length).toEqual(5000);
        expect(allOldFiles.length).toEqual(5000);

        expect(allNewFiles[0].GSI1_PK.endsWith("#FM#FILES")).toBe(true);
        expect(allNewFiles[0].data.id).toEqual(allOldFiles[0].id);
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, testData);
        const handler = createDdbMigrationHandler({ table, migration: FileManager_5_35_0_001 });

        // Should run the migration
        process.stdout.write("[First run]\n");
        const firstRun = await handler();
        assertNotError(firstRun.error);
        expect(firstRun.data.executed.length).toBe(1);

        // Should skip the migration
        process.stdout.write("[Second run]\n");
        const secondRun = await handler();
        assertNotError(secondRun.error);
        expect(secondRun.data.executed.length).toBe(0);
        expect(secondRun.data.skipped.length).toBe(1);
        expect(secondRun.data.notApplicable.length).toBe(0);
    });
});
