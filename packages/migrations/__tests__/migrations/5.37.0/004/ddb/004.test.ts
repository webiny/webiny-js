import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { AcoRecords_5_37_0_004 } from "~/migrations/5.37.0/004/ddb";
import {
    PB_ACO_SEARCH_MODEL_ID,
    PB_PAGE_TYPE,
    ROOT_FOLDER
} from "~/migrations/5.37.0/004/constants";
/**
 * We are using the original 5.35.0 006 migration data and migration to set up the test data.
 */
import { AcoRecords_5_35_0_006 } from "~/migrations/5.35.0/006/ddb";
import { insertTestPages } from "~tests/migrations/5.35.0/006/ddb/insertTestPages";
import { createLocalesData, createTenantsData } from "~tests/migrations/5.35.0/006/ddb/006.data";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.37.0-004", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if no tenant found", async () => {
        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_37_0_004] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no locale found", async () => {
        await insertTestData(table, [...createTenantsData()]);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_37_0_004] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no pages found", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_37_0_004] });

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

        /**
         * First we are executing the 5.35.0_006 migration as it creates the original ACO Search Records.
         */
        const handlerPrepare = createDdbMigrationHandler({
            table,
            migrations: [AcoRecords_5_35_0_006]
        });
        const { data: dataPrepare, error: errorPrepare } = await handlerPrepare();

        assertNotError(errorPrepare);
        const groupedPrepare = groupMigrations(dataPrepare.migrations);

        expect(groupedPrepare.executed.length).toBe(1);
        expect(groupedPrepare.skipped.length).toBe(0);
        expect(groupedPrepare.notApplicable.length).toBe(0);

        /**
         * And then we execute current the 5.37.0_004 migration.
         */
        const handler = createDdbMigrationHandler({
            table,
            migrations: [AcoRecords_5_37_0_004]
        });
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
                    eq: "acoSearchRecord-pbpage"
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
                "object@data": {
                    ["object@createdBy"]: {
                        ["text@id"]: createdBy.id,
                        ["text@type"]: createdBy.type,
                        ["text@displayName"]: createdBy.displayName
                    },
                    ["datetime@createdOn"]: createdOn,
                    ["text@id"]: id,
                    ["boolean@locked"]: locked,
                    ["text@path"]: path,
                    ["text@pid"]: pid,
                    ["datetime@savedOn"]: savedOn,
                    ["text@status"]: status,
                    ["text@title"]: title,
                    ["number@version"]: version
                }
            };

            // Checking latest ACO search record
            expect(latestSearchRecord).toMatchObject({
                PK: `T#${tenant}#L#${locale}#CMS#CME#CME#wby-aco-${pid}`,
                SK: "L",
                id: `wby-aco-${pid}#0001`,
                entryId: `wby-aco-${pid}`,
                GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#${PB_ACO_SEARCH_MODEL_ID}#L`,
                GSI1_SK: `wby-aco-${pid}#0001`,
                locale,
                locked: false,
                modelId: PB_ACO_SEARCH_MODEL_ID,
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
                GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#${PB_ACO_SEARCH_MODEL_ID}#A`,
                GSI1_SK: `wby-aco-${pid}#0001`,
                locale,
                locked: false,
                modelId: PB_ACO_SEARCH_MODEL_ID,
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

        /**
         * First we are executing the 5.35.0_006 migration as it creates the original ACO Search Records.
         */
        const handlerPrepare = createDdbMigrationHandler({
            table,
            migrations: [AcoRecords_5_35_0_006]
        });

        await handlerPrepare();

        /**
         * And then we execute current the 5.37.0_004 migration.
         */
        const handler = createDdbMigrationHandler({
            table,
            migrations: [AcoRecords_5_37_0_004]
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
