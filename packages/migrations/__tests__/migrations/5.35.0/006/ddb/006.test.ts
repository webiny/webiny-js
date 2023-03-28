import sortBy from "lodash/sortBy";

import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";

import { AcoRecords_5_35_0_006 } from "~/migrations/5.35.0/006/ddb";

import {
    createTenantsData,
    createLocalesData,
    createPagesData,
    createAcoSearchData
} from "./006.data";

jest.retryTimes(0);

describe("5.35.0-006", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if no tenant found", async () => {
        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });

        const { data, error } = await handler();

        assertNotError(error);

        expect(data.executed.length).toBe(0);
        expect(data.skipped.length).toBe(1);
        expect(data.notApplicable.length).toBe(0);
    });

    it("should not run if no locale found", async () => {
        await insertTestData(table, [...createTenantsData()]);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });

        const { data, error } = await handler();

        assertNotError(error);

        expect(data.executed.length).toBe(0);
        expect(data.skipped.length).toBe(1);
        expect(data.notApplicable.length).toBe(0);
    });

    it("should not run if no pages found", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });

        const { data, error } = await handler();

        assertNotError(error);

        expect(data.executed.length).toBe(0);
        expect(data.skipped.length).toBe(1);
        expect(data.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, [
            ...createTenantsData(),
            ...createLocalesData(),
            ...createPagesData()
        ]);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });
        const { data, error } = await handler();

        assertNotError(error);

        expect(data.executed.length).toBe(1);
        expect(data.skipped.length).toBe(0);
        expect(data.notApplicable.length).toBe(0);

        const searchRecords = await scanTable(table, {
            filters: [
                {
                    attr: "modelId",
                    eq: "acoSearchRecord"
                }
            ]
        });

        expect(searchRecords.length).toBe(4);
        expect(sortBy(searchRecords, ["id"])).toEqual(sortBy(createAcoSearchData(), ["id"]));
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, [
            ...createTenantsData(),
            ...createLocalesData(),
            ...createPagesData()
        ]);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });

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
