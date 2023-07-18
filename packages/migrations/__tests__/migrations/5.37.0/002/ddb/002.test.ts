import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    groupMigrations,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { CmsEntriesRootFolder_5_37_0_002 } from "~/migrations/5.37.0/002/ddb";
import {
    getTotalItems,
    insertTestEntries
} from "~tests/migrations/5.37.0/002/ddb/insertTestEntries";

jest.retryTimes(0);
jest.setTimeout(9000000);

describe("5.37.0-002", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if no cms records found", async () => {
        const handler = createDdbMigrationHandler({
            table,
            migrations: [CmsEntriesRootFolder_5_37_0_002]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestEntries(table);

        const handler = createDdbMigrationHandler({
            table,
            migrations: [CmsEntriesRootFolder_5_37_0_002]
        });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const entries = await scanTable(table, {
            index: "GSI1",
            filters: [
                {
                    attr: "_et",
                    beginsWith: "CmsEntries"
                }
            ],
            select: "specific_attributes",
            attributes: ["location"],
            limit: 10000000
        });
        /**
         * Must be total items inserted.
         * This is calculated from the tenant / locale combination, max items and amount of pushes for a single item.
         */
        expect(entries.length).toBe(getTotalItems());
        for (const entry of entries) {
            expect(entry.location?.folderId).toBe("root");
        }
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestEntries(table, {
            maxItems: 10
        });
        const handler = createDdbMigrationHandler({
            table,
            migrations: [CmsEntriesRootFolder_5_37_0_002]
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
