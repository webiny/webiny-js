import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { FileManager_5_37_0_004 } from "~/migrations/5.37.0/004/ddb";
import { createTenantsData } from "./004.data";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.37.0-004", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if no tenant found", async () => {
        const handler = createDdbMigrationHandler({
            table,
            migrations: [FileManager_5_37_0_004]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, [...createTenantsData()]);

        const handler = createDdbMigrationHandler({
            table,
            migrations: [FileManager_5_37_0_004]
        });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const ddbItems = await scanTable(table, {
            filters: [
                {
                    attr: "GSI1_PK",
                    eq: "T#root#L#en-US#CMS#CME#M#fmFile#L"
                }
            ]
        });

        const sortedItems = ddbItems.sort((a, b) =>
            new Date(a.createdOn).getTime() > new Date(b.createdOn).getTime() ? 1 : -1
        );

        const privateFiles = sortedItems.filter(
            item => item.values["object@meta"]["boolean@private"] === true
        );

        const publicFiles = sortedItems.filter(
            item => item.values["object@meta"]["boolean@private"] === false
        );

        expect(ddbItems.length).toBe(26);
        expect(publicFiles.length).toBe(5);
        expect(privateFiles.length).toBe(21);

        expect(publicFiles[0]).toMatchObject({
            createdBy: {
                type: "admin",
                displayName: "Pavel Denisjuk",
                id: "64998c8b230aa40008c87c41"
            },
            createdOn: "2023-06-26T13:06:52.315Z",
            entryId: "64998d6b230aa40008c87c47",
            id: `64998d6b230aa40008c87c47#0001`,
            locked: false,
            locale: "en-US",
            location: {
                folderId: "root"
            },
            modelId: "fmFile",
            modifiedBy: {
                type: "admin",
                displayName: "Pavel Denisjuk",
                id: "64998c8b230aa40008c87c41"
            },
            ownedBy: {
                type: "admin",
                displayName: "Pavel Denisjuk",
                id: "64998c8b230aa40008c87c41"
            },
            savedOn: expect.stringMatching("2023-06-26T13:06:52"),
            status: "draft",
            tenant: "root",
            version: 1,
            webinyVersion: expect.any(String),
            values: {
                "number@size": 280166,
                "object@location": {
                    "text@folderId": "root"
                },
                "object@meta": {
                    "boolean@private": false
                },
                "text@aliases": [],
                "text@key": "64998d6b230aa40008c87c47/image-1.jpg",
                "text@name": "image-1.jpg",
                "text@tags": [],
                "text@type": "image/jpeg"
            }
        });
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, [...createTenantsData()]);

        const handler = createDdbMigrationHandler({
            table,
            migrations: [FileManager_5_37_0_004]
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
