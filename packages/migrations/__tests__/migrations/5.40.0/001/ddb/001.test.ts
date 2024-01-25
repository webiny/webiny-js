import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { FormBuilder_5_40_0_001 } from "~/migrations/5.40.0/001/ddb";
import { createFormsData, createLocalesData, createTenantsData } from "./001.data";
import { migratedFormData } from "./001.migratedData";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.40.0-001", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if no tenant found", async () => {
        const handler = createDdbMigrationHandler({
            table,
            migrations: [FormBuilder_5_40_0_001]
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

        const handler = createDdbMigrationHandler({ table, migrations: [FormBuilder_5_40_0_001] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no forms found", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);

        const handler = createDdbMigrationHandler({
            table,
            migrations: [FormBuilder_5_40_0_001]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, [
            ...createFormsData(),
            ...createTenantsData(),
            ...createLocalesData()
        ]);

        const handler = createDdbMigrationHandler({
            table,
            migrations: [FormBuilder_5_40_0_001]
        });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const cmsFormEntries = await scanTable(table, {
            filters: [
                {
                    attr: "modelId",
                    beginsWith: "fbForm"
                }
            ]
        });

        expect(cmsFormEntries).toEqual(
            migratedFormData.map(data => {
                return {
                    ...data,
                    entity: "CmsEntries",
                    created: expect.any(String),
                    modified: expect.any(String)
                };
            })
        );
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, [
            ...createFormsData(),
            ...createTenantsData(),
            ...createLocalesData()
        ]);

        const handler = createDdbMigrationHandler({
            table,
            migrations: [FormBuilder_5_40_0_001]
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
