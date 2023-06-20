import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { AcoRecords_5_35_0_006 } from "~/migrations/5.35.0/006/ddb";
import { createLocalesData, createTenantsData } from "./006.data";
import { ACO_SEARCH_MODEL_ID, PB_PAGE_TYPE, ROOT_FOLDER } from "~/migrations/5.35.0/006/constants";
import { insertTestPages } from "./insertTestPages";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.35.0-006", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if no tenant found", async () => {
        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no locale found", async () => {
        await insertTestData(table, [...createTenantsData()]);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no pages found", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);
        const ddbPages = await insertTestPages(table);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const searchRecords = await scanTable(table, {
            filters: [
                {
                    attr: "modelId",
                    eq: "acoSearchRecord"
                }
            ]
        });

        expect(searchRecords.length).toBe(ddbPages.length * 2);

        for (const page of ddbPages) {
            const {
                createdBy,
                createdOn,
                id,
                locale,
                locked,
                path,
                pid,
                savedOn,
                status,
                tenant,
                title,
                version
            } = page;

            const latestSearchRecord = searchRecords.find(
                record => record.id === `wby-aco-${pid}#0001` && record.SK === "L"
            );
            const revisionSearchRecord = searchRecords.find(
                record => record.id === `wby-aco-${pid}#0001` && record.SK === "REV#0001"
            );

            const values = {
                "text@title": title,
                "text@content": `${title} Heading ${pid} Lorem ipsum dolor sit amet.`,
                "text@type": PB_PAGE_TYPE,
                "object@location": {
                    "text@folderId": ROOT_FOLDER
                },
                "text@tags": [`tag-${pid}`],
                "wby-aco-json@data": {
                    createdBy,
                    createdOn,
                    id,
                    locked,
                    path,
                    pid,
                    savedOn,
                    status,
                    title,
                    version
                }
            };

            // Checking latest ACO search record
            expect(latestSearchRecord).toMatchObject({
                PK: `T#${tenant}#L#${locale}#CMS#CME#CME#wby-aco-${pid}`,
                SK: "L",
                id: `wby-aco-${pid}#0001`,
                entryId: `wby-aco-${pid}`,
                GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#L`,
                GSI1_SK: `wby-aco-${pid}#0001`,
                locale,
                locked: false,
                modelId: ACO_SEARCH_MODEL_ID,
                status: "draft",
                tenant,
                TYPE: "cms.entry.l",
                values
            });

            // Checking revision 1 ACO search record
            expect(revisionSearchRecord).toMatchObject({
                PK: `T#${tenant}#L#${locale}#CMS#CME#CME#wby-aco-${pid}`,
                SK: "REV#0001",
                id: `wby-aco-${pid}#0001`,
                entryId: `wby-aco-${pid}`,
                GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#A`,
                GSI1_SK: `wby-aco-${pid}#0001`,
                locale,
                locked: false,
                modelId: ACO_SEARCH_MODEL_ID,
                status: "draft",
                tenant,
                TYPE: "cms.entry",
                values
            });
        }
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);
        await insertTestPages(table, 1);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_35_0_006] });

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
