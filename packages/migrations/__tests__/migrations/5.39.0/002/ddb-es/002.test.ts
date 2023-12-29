import {
    assertNotError,
    createDdbEsMigrationHandler,
    getDynamoToEsTable,
    importElasticsearchTestData,
    getPrimaryDynamoDbTable,
    groupMigrations,
    insertDynamoDbTestData as insertTestData,
    logTestNameBeforeEachTest,
    scanTable
} from "~tests/utils";
import { CmsEntriesInitNewMetaFields_5_39_0_002 } from "~/migrations/5.39.0/002/ddb-es";

import { transferDynamoDbToElasticsearch } from "~tests/utils/insertElasticsearchTestData";
import { esGetIndexSettings } from "~/utils";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { getRecordIndexName } from "~tests/migrations/5.37.0/002/ddb-es/helpers";
import { listElasticsearchItems } from "~tests/utils/listElasticsearchItems";
import { getDecompressedData } from "~tests/migrations/5.37.0/003/ddb-es/getDecompressedData";

// Test data.
import { ddbPrimaryTableData } from "./002.ddbPrimaryTableData";
import { ddbEsTableData } from "./002.ddbEsTableData";
import { headlessCmsAcoSearchRecordPbPage } from "./002.es-index-root-headless-cms-en-us-acosearchrecord-pbpage";
import { headlessCmsFmFile } from "./002.es-index-root-headless-cms-en-us-fmfile";
import { headlessCmsModelA } from "./002.es-index-root-headless-cms-en-us-modela";
import { headlessCmsModelB } from "./002.es-index-root-headless-cms-en-us-modelb";

// Migrated test data.
import { ddbPrimaryTableDataMigrated } from "./migrated/002.ddbPrimaryTableData";
import { ddbEsTableDataMigrated } from "./migrated/002.ddbEsTableData";
import { headlessCmsAcoSearchRecordPbPageMigrated } from "./migrated/002.es-index-root-headless-cms-en-us-acosearchrecord-pbpage";
import { headlessCmsFmFileMigrated } from "./migrated/002.es-index-root-headless-cms-en-us-fmfile";
import { headlessCmsModelAMigrated } from "./migrated/002.es-index-root-headless-cms-en-us-modela";
import { headlessCmsModelBMigrated } from "./migrated/002.es-index-root-headless-cms-en-us-modelb";

jest.retryTimes(0);
jest.setTimeout(900000);

describe("5.39.0-002", () => {
    const primaryTable = getPrimaryDynamoDbTable();
    const dynamoToEsTable = getDynamoToEsTable();
    const elasticsearchClient = createElasticsearchClient();

    const insertAllTestData = async () => {
        await insertTestData(primaryTable, ddbPrimaryTableData);
        await insertTestData(dynamoToEsTable, ddbEsTableData);

        const esIndexData = {
            "acosearchrecord-pbpage": headlessCmsAcoSearchRecordPbPage,
            fmfile: headlessCmsFmFile,
            modela: headlessCmsModelA,
            modelb: headlessCmsModelB
        };

        for (const indexName in esIndexData) {
            await importElasticsearchTestData(
                elasticsearchClient,
                esIndexData[indexName as keyof typeof esIndexData]
            );
        }

        await elasticsearchClient.indices.refreshAll();
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
        await insertAllTestData();

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

        const ddbEsTableRecords = await scanTable(dynamoToEsTable, {
            limit: 1_000_000
        });

        expect(ddbEsTableRecords).toEqual(ddbEsTableDataMigrated);

        // In the following lines, we're going to check if the data in Elasticsearch is correct.
        await transferDynamoDbToElasticsearch(
            elasticsearchClient,
            dynamoToEsTable,
            getRecordIndexName
        );

        const indexes = new Set<string>();
        for (const record of ddbEsTableData) {
            const entry = await getDecompressedData(record.data);
            if (entry && entry.modelId) {
                indexes.add(getRecordIndexName(entry));
            }
        }

        expect(indexes.size).toBe(4);

        const [
            headlessCmsAcoSearchRecordPbPageIndexName,
            headlessCmsFmFileIndexName,
            headlessCmsModelAIndexName,
            headlessCmsModelBIndexName
        ] = indexes;

        // Ensure correct data ended up in Elasticsearch.
        // 1. Check ACO Search Record PB Page index.
        const migratedHeadlessCmsAcoSearchRecordPbPageRecords = await listElasticsearchItems({
            client: elasticsearchClient,
            index: headlessCmsAcoSearchRecordPbPageIndexName
        });

        expect(migratedHeadlessCmsAcoSearchRecordPbPageRecords).toBeArrayOfSize(2);
        expect(migratedHeadlessCmsAcoSearchRecordPbPageRecords).toEqual(
            headlessCmsAcoSearchRecordPbPageMigrated
        );

        // 2. Check FM File index.
        const migratedHeadlessCmsFmFileRecords = await listElasticsearchItems({
            client: elasticsearchClient,
            index: headlessCmsFmFileIndexName
        });

        expect(migratedHeadlessCmsFmFileRecords).toBeArrayOfSize(21);
        expect(migratedHeadlessCmsFmFileRecords).toEqual(headlessCmsFmFileMigrated);

        // 3. Check Model A index.
        const migratedHeadlessCmsModelARecords = await listElasticsearchItems({
            client: elasticsearchClient,
            index: headlessCmsModelAIndexName
        });

        expect(migratedHeadlessCmsModelARecords).toBeArrayOfSize(7);
        expect(migratedHeadlessCmsModelARecords).toEqual(headlessCmsModelAMigrated);

        // 3. Check Model A index.
        const migratedHeadlessCmsModelBRecords = await listElasticsearchItems({
            client: elasticsearchClient,
            index: headlessCmsModelBIndexName
        });

        expect(migratedHeadlessCmsModelBRecords).toBeArrayOfSize(3);
        expect(migratedHeadlessCmsModelBRecords).toEqual(headlessCmsModelBMigrated);

        /**
         * Test that all indexes have the expected settings after the migration.
         */
        for (const index of indexes) {
            const settings = await esGetIndexSettings({
                elasticsearchClient,
                index,
                fields: ["number_of_replicas", "refresh_interval"]
            });
            expect(Number(settings?.number_of_replicas)).toBeGreaterThanOrEqual(1);
            expect(settings?.refresh_interval).not.toBe(-1);
            const interval = parseInt((settings?.refresh_interval as string).replace("s", ""));
            expect(interval).toBeGreaterThanOrEqual(1);
        }
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertAllTestData();

        const handler = createDdbEsMigrationHandler({
            primaryTable,
            dynamoToEsTable,
            elasticsearchClient,
            migrations: [CmsEntriesInitNewMetaFields_5_39_0_002]
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
