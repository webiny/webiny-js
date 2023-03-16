import { PageBuilder_5_35_0_002 } from "~/migrations/5.35.0/002";
import {
    assertNotError,
    createDdbMigrationHandler,
    getPrimaryDynamoDbTable,
    insertTestData,
    logTestNameBeforeEachTest
} from "~tests/utils";
import { testData } from "./002.data";
import {
    createLegacySettingsEntity,
    createSettingsEntity
} from "~/migrations/5.35.0/002/createSettingsEntity";

jest.retryTimes(0);

describe("5.35.0-002", () => {
    const table = getPrimaryDynamoDbTable();

    logTestNameBeforeEachTest();

    it("should not run if system is not installed", async () => {
        const handler = createDdbMigrationHandler({ table, migrations: [PageBuilder_5_35_0_002] });

        const { data, error } = await handler();

        assertNotError(error);

        expect(data.executed.length).toBe(0);
        expect(data.skipped.length).toBe(1);
        expect(data.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(table, testData);
        const handler = createDdbMigrationHandler({ table, migrations: [PageBuilder_5_35_0_002] });
        const { data, error } = await handler();

        assertNotError(error);

        expect(data.executed.length).toBe(1);
        expect(data.skipped.length).toBe(0);
        expect(data.notApplicable.length).toBe(0);

        // ASSERT PAGE BUILDER SETTINGS CHANGES
        const legacySettings = createLegacySettingsEntity(table);
        const { Item: legacyRecord } = await legacySettings.get({
            PK: "T#root#L#en-US#PB#SETTINGS",
            SK: "default"
        });

        expect(legacyRecord).toBeTruthy();
        expect(legacyRecord.SK).toEqual("default");
        expect(legacyRecord).toMatchObject({
            htmlTags: {
                footer: null,
                header: null
            },
            locale: "en-US",
            name: "Sandbox",
            pages: {
                home: "63d0f8a3ce8f180008bb606b",
                notFound: "63d0f8a3ce8f180008bb606a"
            },
            social: {
                facebook: null,
                image: null,
                instagram: null,
                twitter: null
            },
            tenant: "root",
            theme: "default",
            websitePreviewUrl: "http://localhost:3000",
            websiteUrl: null
        });

        const newSettings = createSettingsEntity(table);
        const { Item: newRecord } = await newSettings.get({
            PK: "T#root#L#en-US#PB#SETTINGS",
            SK: "A"
        });

        expect(newRecord).toBeTruthy();
        expect(newRecord.SK).toEqual("A");
        expect(newRecord.data).toEqual({
            htmlTags: {
                footer: null,
                header: null
            },
            locale: "en-US",
            name: "Sandbox",
            pages: {
                home: "63d0f8a3ce8f180008bb606b",
                notFound: "63d0f8a3ce8f180008bb606a"
            },
            social: {
                facebook: null,
                image: null,
                instagram: null,
                twitter: null
            },
            tenant: "root",
            theme: "default",
            websitePreviewUrl: "http://localhost:3000",
            websiteUrl: null
        });
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(table, testData);
        const handler = createDdbMigrationHandler({ table, migrations: [PageBuilder_5_35_0_002] });

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
