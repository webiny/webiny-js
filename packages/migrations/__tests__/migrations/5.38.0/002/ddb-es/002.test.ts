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
import { createDdbPrimaryTableData } from "./002.ddbPrimaryTableData";
import { createDdbEsTableData } from "./002.ddbEsTableData";
import { createEsData } from "./002.esData";
import { migratedDdbPrimaryTableData } from "./002.migratedDdbPrimaryTableData";
import { migratedDdbEsTableData } from "./002.migratedDdbEsTableData";
import { insertElasticsearchTestData } from "~tests/utils/insertElasticsearchTestData";
import { esGetIndexName } from "~/utils";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { createMigratedEsData } from "~tests/migrations/5.38.0/002/ddb-es/002.migratedEsData";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.38.0-002", () => {
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
        await insertTestData(primaryTable, createDdbPrimaryTableData());
        await insertTestData(dynamoToEsTable, createDdbEsTableData());

        await insertElasticsearchTestData(elasticsearchClient, createEsData(), item => {
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
                        beginsWith: "fb.formSubmission"
                    }
                ]
            })
        ).resolves.toEqual(migratedDdbPrimaryTableData);

        await expect(
            scanTable(dynamoToEsTable, {
                filters: [
                    {
                        attr: "TYPE",
                        beginsWith: "fb.formSubmission"
                    }
                ]
            })
        ).resolves.toEqual(migratedDdbEsTableData);
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(primaryTable, createDdbPrimaryTableData());
        await insertTestData(dynamoToEsTable, createDdbEsTableData());

        await insertElasticsearchTestData(elasticsearchClient, createMigratedEsData(), item => {
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

        // Should skip the migration
        {
            process.stdout.write("[First run]\n");
            const { data, error } = await handler();
            assertNotError(error);
            const grouped = groupMigrations(data.migrations);
            expect(grouped.executed.length).toBe(0);
            expect(grouped.skipped.length).toBe(1);
            expect(grouped.notApplicable.length).toBe(0);
        }
    });
});
