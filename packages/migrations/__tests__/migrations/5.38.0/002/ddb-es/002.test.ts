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
import { MultiStepForms_5_38_0_002 } from "~/migrations/5.38.0/002/ddb-es";
import { createFormsData, createEsFormsData } from "./002.data";
import { migratedData } from "./002.migratedTestData";
import { insertElasticsearchTestData } from "~tests/utils/insertElasticsearchTestData";
import { esGetIndexName } from "~/utils";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { createLocalesData, createTenantsData } from "~tests/migrations/5.38.0/002/ddb/002.data";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.38.0-002", () => {
    const primaryTable = getPrimaryDynamoDbTable();
    const dynamoToEsTable = getDynamoToEsTable();
    const elasticsearchClient = createElasticsearchClient();

    logTestNameBeforeEachTest();

    it("should not run if no forms found", async () => {
        const handler = createDdbEsMigrationHandler({
            primaryTable,
            dynamoToEsTable,
            elasticsearchClient,
            migrations: [MultiStepForms_5_38_0_002]
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
            migrations: [MultiStepForms_5_38_0_002]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        await expect(
            scanTable(primaryTable, {
                filters: [
                    {
                        attr: "TYPE",
                        beginsWith: "fb.form"
                    }
                ]
            })
        ).resolves.toEqual(migratedData);
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(primaryTable, [
            ...createFormsData(),
            ...createTenantsData(),
            ...createLocalesData()
        ]);

        const handler = createDdbEsMigrationHandler({
            primaryTable,
            dynamoToEsTable,
            elasticsearchClient,
            migrations: [MultiStepForms_5_38_0_002]
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
