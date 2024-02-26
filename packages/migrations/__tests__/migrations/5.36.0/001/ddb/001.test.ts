import {
    assertNotError,
    createDdbMigrationHandler,
    createId,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";

import { AcoRecords_5_36_0_001 } from "~/migrations/5.36.0/001/ddb";
import { ACO_SEARCH_MODEL_ID, FM_FILE_TYPE, ROOT_FOLDER } from "~/migrations/5.36.0/001/constants";

import { createdBy, createLocalesData, createTenantsData } from "./001.data";

jest.retryTimes(0);
jest.setTimeout(900000);

/**
 * Reduced number of records because it is not necessary anymore to run tests with large amount of records.
 */
const NUMBER_OF_FILES = 50;
let numberOfGeneratedFiles = 0;

describe("5.36.0-001", () => {
    const table = getPrimaryDynamoDbTable();

    const ddbFiles: Record<string, any>[] = [];

    logTestNameBeforeEachTest();

    const insertTestFiles = async (
        numberOfFiles = NUMBER_OF_FILES,
        privateFile = false,
        skipLocales = 0
    ) => {
        ddbFiles.length = 0;
        numberOfGeneratedFiles = 0;

        const tenants = createTenantsData().map(tenant => tenant.data.id);
        const testLocales = createLocalesData();

        for (const tenant of tenants) {
            const locales = testLocales
                .slice(0, testLocales.length - skipLocales) // In case we don't want to insert files into one or more locales
                .filter(item => item.PK === `T#${tenant}#I18N#L`)
                .map(locale => locale.code) as string[];

            for (const locale of locales) {
                for (let index = 0; index < numberOfFiles; index++) {
                    const id = createId();

                    ddbFiles.push({
                        PK: `T#${tenant}#L#${locale}#FM#FILE#${id}`,
                        SK: "A",
                        GSI1_PK: `T#${tenant}#L#${locale}#FM#FILES`,
                        GSI1_SK: id,
                        TYPE: "fm.file",
                        data: {
                            aliases: [],
                            createdBy,
                            createdOn: new Date().toISOString(),
                            id,
                            key: `${id}/demo-image-${id}.png`,
                            locale,
                            meta: {
                                private: privateFile
                            },
                            name: `demo-image-${id}.png`,
                            size: 10000,
                            tags: [`tag-a-${id}`, `tag-b-${id}`],
                            tenant,
                            type: "image/png",
                            webinyVersion: "0.0.0"
                        },
                        _ct: new Date().toISOString(),
                        _et: "FM.File",
                        _md: new Date().toISOString()
                    });
                }

                // Track generated files
                numberOfGeneratedFiles += numberOfFiles;
            }
        }
        // Inserting useful data: file record
        await insertDynamoDbTestData(table, ddbFiles);
    };

    it("should not run if no tenant found", async () => {
        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_36_0_001] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no locale found", async () => {
        await insertTestData(table, [...createTenantsData()]);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_36_0_001] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no files found", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_36_0_001] });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);
        await insertTestFiles();

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_36_0_001] });
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

        expect(searchRecords.length).toBe(numberOfGeneratedFiles * 2);

        for (const file of ddbFiles) {
            const {
                aliases,
                createdBy,
                createdOn,
                id,
                key,
                locale,
                meta,
                name,
                size,
                tags,
                tenant,
                type
            } = file.data;

            const latestSearchRecord = searchRecords.find(
                record => record.id === `wby-aco-${id}#0001` && record.SK === "L"
            );
            const revisionSearchRecord = searchRecords.find(
                record => record.id === `wby-aco-${id}#0001` && record.SK === "REV#0001"
            );

            const values = {
                "text@title": name,
                "text@type": FM_FILE_TYPE,
                "object@location": {
                    "text@folderId": ROOT_FOLDER
                },
                "text@tags": [...tags, "mime:image/png"],
                "wby-aco-json@data": {
                    id,
                    key,
                    size,
                    type,
                    name,
                    createdOn,
                    createdBy,
                    aliases,
                    meta
                }
            };

            // Checking latest ACO search record
            expect(latestSearchRecord).toMatchObject({
                PK: `T#${tenant}#L#${locale}#CMS#CME#CME#wby-aco-${id}`,
                SK: "L",
                id: `wby-aco-${id}#0001`,
                entryId: `wby-aco-${id}`,
                GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#L`,
                GSI1_SK: `wby-aco-${id}#0001`,
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
                PK: `T#${tenant}#L#${locale}#CMS#CME#CME#wby-aco-${id}`,
                SK: "REV#0001",
                id: `wby-aco-${id}#0001`,
                entryId: `wby-aco-${id}`,
                GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#A`,
                GSI1_SK: `wby-aco-${id}#0001`,
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

    it("should not migrate file records is marked as private", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);
        await insertTestFiles(5, true);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_36_0_001] });
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

        expect(searchRecords.length).toBe(0);
    });

    it("should run migration successfully even in case of locale without file entries", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);
        await insertTestFiles(5, false, 1);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_36_0_001] });
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

        expect(searchRecords.length).toBe(numberOfGeneratedFiles * 2);
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);
        await insertTestFiles(1);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_36_0_001] });

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

    it("should run the migration if forced via an ENV variable", async () => {
        await insertTestData(table, [...createTenantsData(), ...createLocalesData()]);
        await insertTestFiles(1);

        const handler = createDdbMigrationHandler({ table, migrations: [AcoRecords_5_36_0_001] });

        // Should run the migration
        {
            process.stdout.write("[First run]\n");
            const { data, error } = await handler();
            assertNotError(error);
            const grouped = groupMigrations(data.migrations);
            expect(grouped.executed.length).toBe(1);
        }

        // Should force-run the migration
        {
            process.env["WEBINY_MIGRATION_FORCE_EXECUTE_5_36_0_001"] = "true";
            process.stdout.write("[Second run]\n");
            const { data, error } = await handler();
            assertNotError(error);
            const grouped = groupMigrations(data.migrations);
            expect(grouped.executed.length).toBe(1);
            expect(grouped.skipped.length).toBe(0);
            expect(grouped.notApplicable.length).toBe(0);
        }
    });
});
