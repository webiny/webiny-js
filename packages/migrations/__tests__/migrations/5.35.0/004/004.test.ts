import { Tenancy_5_35_0_004 } from "~/migrations/5.35.0/004";
import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { testData } from "./004.data";

jest.retryTimes(0);

describe("5.35.0-004", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if system is not installed", async () => {
        const handler = createDdbMigrationHandler({ table, migrations: [Tenancy_5_35_0_004] });

        const { data, error } = await handler();
        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertDynamoDbTestData(table, testData);
        const handler = createDdbMigrationHandler({ table, migrations: [Tenancy_5_35_0_004] });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const allTenants = await scanTable(table, {
            index: "GSI1",
            filters: [{ attr: "GSI1_PK", eq: "TENANTS" }]
        });

        expect(allTenants.length).toEqual(3);
        expect(allTenants[0].data).toBeTruthy();
        expect(allTenants[0].data.id).toEqual(allTenants[0].id);
        expect(allTenants[0].GSI1_SK).toEqual(testData[0].GSI1_SK);
        expect(allTenants[1].data).toBeTruthy();
        expect(allTenants[1].data.id).toEqual(allTenants[1].id);
        expect(allTenants[1].GSI1_SK).toEqual(testData[1].GSI1_SK);
        expect(allTenants[2].data).toBeTruthy();
        expect(allTenants[2].data.id).toEqual(allTenants[2].id);
        expect(allTenants[2].GSI1_SK).toEqual(testData[2].GSI1_SK);
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertDynamoDbTestData(table, testData);
        const handler = createDdbMigrationHandler({ table, migrations: [Tenancy_5_35_0_004] });

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
