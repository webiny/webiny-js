import { FileManager_5_35_0_001 } from "~/migrations/5.35.0/001";
import { createLegacyFileEntity } from "../createLegacyFileEntity";
import {
    assertNotError,
    createDdbMigrationHandler,
    getDocumentClient,
    getPrimaryDynamoDbTable,
    insertTestData
} from "~/testUtils";
import { testData } from "./001.data";

jest.retryTimes(0);

describe("5.35.0-001", () => {
    const documentClient = getDocumentClient();
    let table: ReturnType<typeof getPrimaryDynamoDbTable>;
    let legacyFileEntity: ReturnType<typeof createLegacyFileEntity>;

    beforeEach(async () => {
        table = getPrimaryDynamoDbTable({ documentClient });
        legacyFileEntity = createLegacyFileEntity(table);
        process.stdout.write(`\n===== ${expect.getState().currentTestName} =====\n`);
    });

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
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, testData);
        const handler = createDdbMigrationHandler({ table, migration: FileManager_5_35_0_001 });

        // Should run the migration
        process.stdout.write("[First run]\n")
        const firstRun = await handler();
        assertNotError(firstRun.error);
        expect(firstRun.data.executed.length).toBe(1);

        // Should skip the migration
        process.stdout.write("[Second run]\n")
        const secondRun = await handler();
        assertNotError(secondRun.error);
        expect(secondRun.data.executed.length).toBe(0);
        expect(secondRun.data.skipped.length).toBe(1);
        expect(secondRun.data.notApplicable.length).toBe(0);
    });
});
