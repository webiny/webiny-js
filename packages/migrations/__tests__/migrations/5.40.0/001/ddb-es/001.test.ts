import sortBy from "lodash/sortBy";
import {
    assertNotError,
    createDdbEsMigrationHandler,
    getDynamoToEsTable,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { FormBuilder_5_40_0_001 } from "~/migrations/5.40.0/001/ddb-es";
import { insertElasticsearchTestData } from "~tests/utils/insertElasticsearchTestData";
import { esGetIndexName } from "~/utils";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import {
    createLocalesData,
    createTenantsData,
    createFormsData
} from "~tests/migrations/5.40.0/001/ddb-es/001.ddb";
import { createEsFormsData } from "~tests/migrations/5.40.0/001/ddb-es/001.es";
import { migratedDdbFormData } from "~tests/migrations/5.40.0/001/ddb-es/001.migrated.ddb";
import { migratedDdbEsFormData } from "~tests/migrations/5.40.0/001/ddb-es/001.migrated.ddbEs";
import { getDecompressedData } from "~tests/migrations/5.40.0/001/ddb-es/helpers";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.40.0-001", () => {
    const primaryTable = getPrimaryDynamoDbTable();
    const dynamoToEsTable = getDynamoToEsTable();
    const elasticsearchClient = createElasticsearchClient();

    beforeAll(async () => {
        process.env.ELASTIC_SEARCH_INDEX_PREFIX =
            new Date().toISOString().replace(/\.|\:/g, "-").toLowerCase() + "-";

        await elasticsearchClient.indices.deleteAll();
    });

    afterEach(async () => {
        await elasticsearchClient.indices.deleteAll();
    });

    logTestNameBeforeEachTest();

    it("should not run if no tenant found", async () => {
        const handler = createDdbEsMigrationHandler({
            primaryTable,
            dynamoToEsTable,
            elasticsearchClient,
            migrations: [FormBuilder_5_40_0_001]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no locale found", async () => {
        await insertTestData(primaryTable, [...createTenantsData()]);

        const handler = createDdbEsMigrationHandler({
            primaryTable,
            dynamoToEsTable,
            elasticsearchClient,
            migrations: [FormBuilder_5_40_0_001]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should not run if no forms found", async () => {
        await insertTestData(primaryTable, [...createTenantsData(), ...createLocalesData()]);

        const handler = createDdbEsMigrationHandler({
            primaryTable,
            dynamoToEsTable,
            elasticsearchClient,
            migrations: [FormBuilder_5_40_0_001]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(primaryTable, [
            ...createFormsData(),
            ...createTenantsData(),
            ...createLocalesData()
        ]);

        await insertElasticsearchTestData(elasticsearchClient, createEsFormsData(), item => {
            return esGetIndexName({
                tenant: item.tenant,
                locale: item.locale,
                isHeadlessCmsModel: false,
                type: "form-builder"
            });
        });

        await elasticsearchClient.indices.refreshAll();

        const handler = createDdbEsMigrationHandler({
            primaryTable,
            dynamoToEsTable,
            elasticsearchClient,
            migrations: [FormBuilder_5_40_0_001]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        // Check DDB Form entries
        const ddbEntries = await scanTable(primaryTable, {
            filters: [
                {
                    attr: "modelId",
                    eq: "fbForm"
                }
            ]
        });

        expect(sortBy(ddbEntries, ["PK", "SK"])).toEqual(
            sortBy(migratedDdbFormData, ["PK", "SK"]).map(data => {
                return {
                    ...data,
                    entity: "CmsEntries",
                    created: expect.any(String),
                    modified: expect.any(String)
                };
            })
        );

        // Check DDB + ES Form entries
        const ddbEsTableRecordsCompressed = await scanTable(dynamoToEsTable, {
            limit: 1_000_000
        });

        const ddbEsTableRecordsDecompressed = await Promise.all(
            ddbEsTableRecordsCompressed.map(async item => {
                if (!item.PK.includes("#CMS#CME#")) {
                    return item;
                }

                const decompressed = await getDecompressedData(item.data);
                return {
                    ...item,
                    data: decompressed
                };
            })
        );

        expect(ddbEsTableRecordsDecompressed).toEqual(
            sortBy(migratedDdbEsFormData, ["PK", "SK"]).map(data => {
                return {
                    ...data,
                    entity: "CmsEntriesElasticsearch",
                    index: expect.any(String),
                    created: expect.any(String),
                    modified: expect.any(String)
                };
            })
        );
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(primaryTable, [
            ...createFormsData(),
            ...createTenantsData(),
            ...createLocalesData()
        ]);

        await insertElasticsearchTestData(elasticsearchClient, createEsFormsData(), item => {
            return esGetIndexName({
                tenant: item.tenant,
                locale: item.locale,
                isHeadlessCmsModel: false,
                type: "form-builder"
            });
        });

        await elasticsearchClient.indices.refreshAll();

        const handler = createDdbEsMigrationHandler({
            primaryTable,
            dynamoToEsTable,
            elasticsearchClient,
            migrations: [FormBuilder_5_40_0_001]
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
