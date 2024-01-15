import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { CmsEntriesInitNewMetaFields_5_39_0_001 } from "~/migrations/5.39.0/001/ddb";
import { ddbPrimaryTableData } from "./001.ddbPrimaryTableData";
import { ddbPrimaryTableDataMigrated } from "./migrated/001.ddbPrimaryTableData";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.39.0-001", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if no entries without new meta fields were found", async () => {
        const handler = createDdbMigrationHandler({
            table,
            migrations: [CmsEntriesInitNewMetaFields_5_39_0_001]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed).toBeArrayOfSize(0);
        expect(grouped.skipped).toBeArrayOfSize(1);
        expect(grouped.notApplicable).toBeArrayOfSize(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, ddbPrimaryTableData);

        const handler = createDdbMigrationHandler({
            table,
            migrations: [CmsEntriesInitNewMetaFields_5_39_0_001]
        });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed).toBeArrayOfSize(1);
        expect(grouped.skipped).toBeArrayOfSize(0);
        expect(grouped.notApplicable).toBeArrayOfSize(0);

        await expect(
            scanTable(table, {
                filters: [
                    {
                        attr: "TYPE",
                        beginsWith: "cms.entry"
                    }
                ]
            })
        ).resolves.toEqual(ddbPrimaryTableDataMigrated);
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, ddbPrimaryTableData);

        const handler = createDdbMigrationHandler({
            table,
            migrations: [CmsEntriesInitNewMetaFields_5_39_0_001]
        });

        // Should run the migration
        {
            process.stdout.write("[First run]\n");
            const { data, error } = await handler();
            assertNotError(error);
            const grouped = groupMigrations(data.migrations);
            expect(grouped.executed).toBeArrayOfSize(1);
        }

        // Should skip the migration
        {
            process.stdout.write("[Second run]\n");
            const { data, error } = await handler();
            assertNotError(error);
            const grouped = groupMigrations(data.migrations);
            expect(grouped.executed).toBeArrayOfSize(0);
            expect(grouped.skipped).toBeArrayOfSize(1);
            expect(grouped.notApplicable).toBeArrayOfSize(0);
        }
    });
});
