import { AdminUsers_5_41_0_001 } from "~/migrations/5.41.0/001";
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

jest.retryTimes(0);

describe("5.41.0-001", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if system is not installed", async () => {
        const handler = createDdbMigrationHandler({ table, migrations: [AdminUsers_5_41_0_001] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertDynamoDbTestData(table, testData);
        const handler = createDdbMigrationHandler({ table, migrations: [AdminUsers_5_41_0_001] });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const allUsers = await scanTable(table, {
            index: "GSI1",
            filters: [{ attr: "GSI1_PK", eq: "T#root#ADMIN_USERS" }]
        });

        expect(allUsers.length).toEqual(3);
        expect(allUsers[0].data.groups).toEqual([allUsers[0].data.group]);
        expect(allUsers[0].data.teams).toEqual([]);
        expect(allUsers[1].data.groups).toEqual([allUsers[1].data.group]);
        expect(allUsers[1].data.teams).toEqual([]);
        expect(allUsers[2].data.groups).toEqual([allUsers[2].data.group]);
        expect(allUsers[2].data.teams).toEqual(["random-team-id"]);
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertDynamoDbTestData(table, testData);
        const handler = createDdbMigrationHandler({ table, migrations: [AdminUsers_5_41_0_001] });

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
