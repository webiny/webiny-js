import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { PageBlocks_5_38_0_003 } from "~/migrations/5.38.0/003/ddb";
import { createBlocksData, rawContent } from "./003.data";
import { createMigratedData } from "./003.data.migrated";
import { PbPageBlock } from "~/migrations/5.38.0/003/types";
import { compressContent } from "~/migrations/5.38.0/003/ddb/compressContent";

jest.retryTimes(0);
jest.setTimeout(900000);

const NUMBER_OF_RECORDS = 1000;

const ascending = (a: PbPageBlock, b: PbPageBlock) => {
    if (a.id > b.id) {
        return 1;
    }

    if (a.id < b.id) {
        return -1;
    }

    return 0;
};

describe("5.38.0-003", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if blocks already migrated", async () => {
        const handler = createDdbMigrationHandler({
            table,
            migrations: [PageBlocks_5_38_0_003]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, createBlocksData(NUMBER_OF_RECORDS));

        const handler = createDdbMigrationHandler({
            table,
            migrations: [PageBlocks_5_38_0_003]
        });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const newData = await scanTable(table, {
            execute: true,
            parse: true,
            filters: [
                {
                    attr: "TYPE",
                    eq: "pb.pageBlock"
                },
                {
                    attr: "GSI1_PK",
                    exists: true
                }
            ]
        });

        const compressedContent = await compressContent(rawContent);

        expect(newData.sort(ascending)).toEqual(
            createMigratedData(compressedContent, NUMBER_OF_RECORDS)
        );
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, createBlocksData(NUMBER_OF_RECORDS));

        const handler = createDdbMigrationHandler({
            table,
            migrations: [PageBlocks_5_38_0_003]
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
