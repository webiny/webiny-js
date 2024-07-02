import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { createBlocksData } from "./001.data";
import { decompress } from "~/migrations/5.40.0/001/ddb/compression";
import { PbUniqueBlockElementIds_5_40_0_001 } from "~/migrations/5.40.0/001/ddb";

jest.retryTimes(0);
jest.setTimeout(900000);

const NUMBER_OF_RECORDS = 1000;

describe("5.40.0-001", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if no blocks exist in the system", async () => {
        const handler = createDdbMigrationHandler({
            table,
            migrations: [PbUniqueBlockElementIds_5_40_0_001]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, await createBlocksData(NUMBER_OF_RECORDS));

        const handler = createDdbMigrationHandler({
            table,
            migrations: [PbUniqueBlockElementIds_5_40_0_001]
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
                }
            ]
        });

        const firstBlock = await decompress(newData[0]);
        const lastBlock = await decompress(newData[newData.length - 1]);

        expect(firstBlock.content.id).toBeString();
        expect(firstBlock.content.id).toHaveLength(10);

        expect(lastBlock.content.id).toBeString();
        expect(lastBlock.content.id).toHaveLength(10);
    });
});
