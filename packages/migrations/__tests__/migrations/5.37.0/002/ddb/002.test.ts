import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { AcoFolders_5_37_0_002 } from "~/migrations/5.37.0/002/ddb";
import { ACO_FOLDER_MODEL_ID, ROOT_FOLDER } from "~/migrations/5.37.0/002/constants";
import { createLocalesData, createTenantsData } from "./data";
import { insertTestFolders } from "./insertTestFolders";
import { FolderDdbWriteItem } from "./types";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.37.0-002", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if no tenant found", async () => {
        const handler = createDdbMigrationHandler({ table, migrations: [AcoFolders_5_37_0_002] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no locale found", async () => {
        await insertTestData(table, [...createTenantsData()]);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoFolders_5_37_0_002] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no pages found", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoFolders_5_37_0_002] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);
        const { folders, ddbFolders } = await insertTestFolders(table);

        const handler = createDdbMigrationHandler({
            table,
            migrations: [AcoFolders_5_37_0_002]
        });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const folderRecords: FolderDdbWriteItem[] = await scanTable(table, {
            filters: [
                {
                    attr: "modelId",
                    eq: ACO_FOLDER_MODEL_ID
                }
            ]
        });

        expect(folderRecords).toHaveLength(ddbFolders.length * 2);

        const numberOfFoldersInRoot = folderRecords.filter(folder => {
            return !folder.values.parentId || folder.values.parentId.toLowerCase() === ROOT_FOLDER;
        });
        // 15 folders but * 2 because of last / revision records
        expect(numberOfFoldersInRoot).toHaveLength(30);

        let numberOfValidatedRecords = 0;
        let numberOfValidatedRecordsWithNullParent = 0;
        let numberOfValidatedRecordsWithSomeParent = 0;

        for (const ddbFolder of ddbFolders) {
            const folder = folders.find(f => f.id === ddbFolder.id);
            if (!folder) {
                throw new Error(`Missing folder with ID "${ddbFolder.id}".`);
            }
            const { id, parent, title } = folder;
            const { tenant, locale } = ddbFolder;

            const latestSearchRecord = folderRecords.find(record => {
                return !(
                    record.tenant !== tenant ||
                    record.locale !== locale ||
                    record.entryId !== id ||
                    record.SK !== "L"
                );
            });
            const revisionSearchRecord = folderRecords.find(record => {
                return !(
                    record.tenant !== tenant ||
                    record.locale !== locale ||
                    record.entryId !== id ||
                    record.SK !== "REV#0001"
                );
            });

            const values: Record<string, string> = {
                title: title,
                slug: id,
                type: "cms"
            };
            if (!parent || parent?.toLowerCase() == ROOT_FOLDER) {
                numberOfValidatedRecordsWithNullParent++;
            } else {
                numberOfValidatedRecordsWithSomeParent++;
                values.parentId = parent;
            }

            const partitionKey = `T#${tenant}#L#${locale}#CMS#CME#CME#${id}`;

            // Checking latest ACO search record
            expect(latestSearchRecord).toMatchObject({
                PK: partitionKey,
                SK: "L",
                id: `${id}#0001`,
                entryId: `${id}`,
                GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#${ACO_FOLDER_MODEL_ID}#L`,
                GSI1_SK: `${id}#0001`,
                locale,
                locked: false,
                modelId: ACO_FOLDER_MODEL_ID,
                status: "draft",
                tenant,
                TYPE: "cms.entry.l",
                values
            });

            // Checking revision 1 ACO search record
            expect(revisionSearchRecord).toMatchObject({
                PK: partitionKey,
                SK: "REV#0001",
                id: `${id}#0001`,
                entryId: `${id}`,
                GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#${ACO_FOLDER_MODEL_ID}#A`,
                GSI1_SK: `${id}#0001`,
                locale,
                locked: false,
                modelId: ACO_FOLDER_MODEL_ID,
                status: "draft",
                tenant,
                TYPE: "cms.entry",
                values
            });

            numberOfValidatedRecords++;
        }
        expect(numberOfValidatedRecords).toEqual(ddbFolders.length);
        expect(numberOfValidatedRecordsWithSomeParent).toEqual(35);
        expect(numberOfValidatedRecordsWithNullParent).toEqual(15);
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);
        await insertTestFolders(table);

        const handler = createDdbMigrationHandler({
            table,
            migrations: [AcoFolders_5_37_0_002]
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
