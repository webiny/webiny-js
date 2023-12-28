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
import { CmsEntriesInitNewMetaFields_5_39_0_002 } from "~/migrations/5.39.0/002/ddb-es";

// Test data.
import { ddbPrimaryTableData } from "./002.ddbPrimaryTableData";
import { ddbEsTableData } from "./002.ddbEsTableData";
import { rootHeadlessCmsEnUsAcosearchrecordPbpage } from "./002.es-index-root-headless-cms-en-us-acosearchrecord-pbpage";
import { esIndexRootHeadlessCmsEnUsFmfile } from "./002.es-index-root-headless-cms-en-us-fmfile";
import { esIndexRootHeadlessCmsEnUsModelA } from "./002.es-index-root-headless-cms-en-us-modela";
import { esIndexRootHeadlessCmsEnUsModelB } from "./002.es-index-root-headless-cms-en-us-modelb";

// Migrated test data.
import { ddbPrimaryTableDataMigrated } from "./migrated/002.ddbPrimaryTableData.migrated";
import { ddbEsTableDataMigrated } from "./migrated/002.ddbEsTableData.migrated";
import { rootHeadlessCmsEnUsAcosearchrecordPbpageMigrated } from "./migrated/002.es-index-root-headless-cms-en-us-acosearchrecord-pbpage.migrated";
import { esIndexRootHeadlessCmsEnUsFmfileMigrated } from "./migrated/002.es-index-root-headless-cms-en-us-fmfile.migrated";
import { esIndexRootHeadlessCmsEnUsModelAMigrated } from "./migrated/002.es-index-root-headless-cms-en-us-modela.migrated";
import { esIndexRootHeadlessCmsEnUsModelBMigrated } from "./migrated/002.es-index-root-headless-cms-en-us-modelb.migrated";

import { insertElasticsearchTestData } from "~tests/utils/insertElasticsearchTestData";
import { esGetIndexName } from "~/utils";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { createMigratedEsData } from "~tests/migrations/5.38.0/002/ddb-es/002.migratedEsData";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.39.0-002", () => {
    const primaryTable = getPrimaryDynamoDbTable();
    const dynamoToEsTable = getDynamoToEsTable();
    const elasticsearchClient = createElasticsearchClient();

    const esIndexData = {
        acosearchrecordPpPpage: rootHeadlessCmsEnUsAcosearchrecordPbpage,
        fmFile: esIndexRootHeadlessCmsEnUsFmfile,
        modelA: esIndexRootHeadlessCmsEnUsModelA,
        modelB: esIndexRootHeadlessCmsEnUsModelB
    };

    beforeAll(async () => {
        process.env.ELASTIC_SEARCH_INDEX_PREFIX =
            new Date().toISOString().replace(/\.|\:/g, "-").toLowerCase() + "-";

        await elasticsearchClient.indices.deleteAll();
    });
    afterEach(async () => {
        await elasticsearchClient.indices.deleteAll();
    });

    logTestNameBeforeEachTest();

    it("should not run if no entries without new meta fields were found", async () => {
        const handler = createDdbEsMigrationHandler({
            primaryTable,
            dynamoToEsTable,
            elasticsearchClient,
            migrations: [CmsEntriesInitNewMetaFields_5_39_0_002]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(primaryTable, ddbPrimaryTableData);
        await insertTestData(dynamoToEsTable, ddbEsTableData);

        for (const indexName in esIndexData) {
            await insertElasticsearchTestData(
                elasticsearchClient,
                rootHeadlessCmsEnUsAcosearchrecordPbpage,
                item => {
                    return esGetIndexName({
                        tenant: item._source.tenant,
                        locale: item._source.locale,
                        isHeadlessCmsModel: true,
                        type: indexName
                    });
                }
            );
        }

        await elasticsearchClient.indices.refreshAll();

        const handler = createDdbEsMigrationHandler({
            primaryTable,
            dynamoToEsTable,
            elasticsearchClient,
            migrations: [CmsEntriesInitNewMetaFields_5_39_0_002]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const primaryTableData = await scanTable(primaryTable, {
            limit: 1_000_000
        });

        // Primary DynamoDB table test data has migration-related items
        // filtered out. We need to do the same here.
        expect(primaryTableData.filter(item => !item.TYPE?.startsWith("migration"))).toEqual(
            ddbPrimaryTableDataMigrated
        );

        await expect(
            scanTable(dynamoToEsTable, {
                limit: 1_000_000
            })
        ).resolves.toEqual(ddbEsTableDataMigrated);
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(primaryTable, ddbPrimaryTableData);
        await insertTestData(dynamoToEsTable, ddbEsTableData);

        for (const indexName in esIndexData) {
            await insertElasticsearchTestData(
                elasticsearchClient,
                rootHeadlessCmsEnUsAcosearchrecordPbpage,
                item => {
                    return esGetIndexName({
                        tenant: item._source.tenant,
                        locale: item._source.locale,
                        isHeadlessCmsModel: true,
                        type: indexName
                    });
                }
            );
        }

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
