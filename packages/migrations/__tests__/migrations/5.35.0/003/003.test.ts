import { AdminUsers_5_35_0_003 } from "~/migrations/5.35.0/003";
import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { testData } from "./003.data";

jest.retryTimes(0);

describe("5.35.0-003", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if system is not installed", async () => {
        const handler = createDdbMigrationHandler({ table, migrations: [AdminUsers_5_35_0_003] });

        const { data, error } = await handler();

        assertNotError(error);

        expect(data.executed.length).toBe(0);
        expect(data.skipped.length).toBe(1);
        expect(data.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, testData);
        const handler = createDdbMigrationHandler({ table, migrations: [AdminUsers_5_35_0_003] });
        const { data, error } = await handler();

        assertNotError(error);

        expect(data.executed.length).toBe(1);
        expect(data.skipped.length).toBe(0);
        expect(data.notApplicable.length).toBe(0);

        const allUsers = await scanTable(table, {
            index: "GSI1",
            filters: [{ attr: "GSI1_PK", eq: "T#root#ADMIN_USERS" }]
        });

        expect(allUsers.length).toEqual(3);
        expect(allUsers[0].data).toBeTruthy();
        expect(allUsers[0].data.id).toEqual(allUsers[0].id);
        expect(allUsers[1].data).toBeTruthy();
        expect(allUsers[1].data.id).toEqual(allUsers[1].id);
        expect(allUsers[2].data).toBeTruthy();
        expect(allUsers[2].data.id).toEqual(allUsers[2].id);
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, testData);
        const handler = createDdbMigrationHandler({ table, migrations: [AdminUsers_5_35_0_003] });

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
