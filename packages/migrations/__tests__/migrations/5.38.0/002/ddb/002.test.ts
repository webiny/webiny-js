import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { MultiStepForms_5_38_0_002 } from "~/migrations/5.38.0/002/ddb";
import { createFormsData } from "./002.data";
import { migratedData } from "./002.data.migrated";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.38.0-002", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if no form submissions found", async () => {
        const handler = createDdbMigrationHandler({
            table,
            migrations: [MultiStepForms_5_38_0_002]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, createFormsData());

        const handler = createDdbMigrationHandler({
            table,
            migrations: [MultiStepForms_5_38_0_002]
        });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        await expect(
            scanTable(table, {
                filters: [
                    {
                        attr: "TYPE",
                        beginsWith: "fb.formSubmission"
                    }
                ]
            })
        ).resolves.toEqual(migratedData);
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, createFormsData());

        const handler = createDdbMigrationHandler({
            table,
            migrations: [MultiStepForms_5_38_0_002]
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
