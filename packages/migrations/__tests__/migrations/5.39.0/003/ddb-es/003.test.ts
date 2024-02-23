import { Sort as ElasticsearchSort } from "elastic-ts";
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
import { CmsEntriesInitNewMetaFields_5_39_0_003 } from "~/migrations/5.39.0/003/ddb-es";

import { transferDynamoDbToElasticsearch } from "~tests/utils/insertElasticsearchTestData";
import { esGetIndexSettings } from "~/utils";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { getRecordIndexName } from "~tests/migrations/5.37.0/002/ddb-es/helpers";
import { listElasticsearchItems } from "~tests/utils/listElasticsearchItems";
import { getDecompressedData } from "~tests/migrations/5.37.0/003/ddb-es/getDecompressedData";

// Test data.
import { ddbPrimaryTableData } from "./003.ddbPrimaryTableData";
import { ddbEsTableData } from "./003.ddbEsTableData";
import { headlessCmsAcoSearchRecordPbPage } from "./003.es-index-root-headless-cms-en-us-acosearchrecord-pbpage";
import { headlessCmsFmFile } from "./003.es-index-root-headless-cms-en-us-fmfile";
import { headlessCmsModelA } from "./003.es-index-root-headless-cms-en-us-modela";
import { headlessCmsModelB } from "./003.es-index-root-headless-cms-en-us-modelb";

// Migrated test data.
import { ddbPrimaryTableDataMigrated } from "./migrated/003.ddbPrimaryTableData";
import { ddbEsTableDataMigrated } from "./migrated/003.ddbEsTableData";
import { headlessCmsAcoSearchRecordPbPageMigrated } from "./migrated/003.es-index-root-headless-cms-en-us-acosearchrecord-pbpage";
import { headlessCmsFmFileMigrated } from "./migrated/003.es-index-root-headless-cms-en-us-fmfile";
import { headlessCmsModelAMigrated } from "./migrated/003.es-index-root-headless-cms-en-us-modela";
import { headlessCmsModelBMigrated } from "./migrated/003.es-index-root-headless-cms-en-us-modelb";

jest.retryTimes(0);
jest.setTimeout(900000);

// Ensures that either both modifiedOn and modifiedBy fields are set or none is set.
const expectModifiedFieldsAreSynced = (entry: Record<string, unknown>) => {
    const hasRevisionModifiedOn = !!entry.revisionModifiedOn;
    const hasRevisionModifiedBy = !!entry.revisionModifiedBy;
    expect(hasRevisionModifiedBy).toBe(hasRevisionModifiedOn);

    const hasEntryModifiedOn = !!entry.entryModifiedOn;
    const hasEntryModifiedBy = !!entry.entryModifiedBy;
    expect(hasEntryModifiedOn).toBe(hasEntryModifiedBy);
};

describe("5.39.0-003", () => {
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
            migrations: [CmsEntriesInitNewMetaFields_5_39_0_003]
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
            migrations: [CmsEntriesInitNewMetaFields_5_39_0_003]
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

        expect(ddbEsTableRecordsDecompressed).toEqual(ddbEsTableDataMigrated);

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
        const sort = [
            {
                "id.keyword": { order: "desc", unmapped_type: "keyword" },
                "TYPE.keyword": { order: "asc", unmapped_type: "keyword" }
            }
        ] as ElasticsearchSort;

        // 1. Check ACO Search Record PB Page index.
        const migratedHeadlessCmsAcoSearchRecordPbPageRecords = await listElasticsearchItems({
            client: elasticsearchClient,
            index: headlessCmsAcoSearchRecordPbPageIndexName,
            body: { sort }
        });

        expect(migratedHeadlessCmsAcoSearchRecordPbPageRecords).toBeArrayOfSize(2);
        expect(migratedHeadlessCmsAcoSearchRecordPbPageRecords).toEqual(
            headlessCmsAcoSearchRecordPbPageMigrated
        );

        headlessCmsAcoSearchRecordPbPageMigrated.forEach(expectModifiedFieldsAreSynced);

        // 2. Check FM File index.
        const migratedHeadlessCmsFmFileRecords = await listElasticsearchItems({
            client: elasticsearchClient,
            index: headlessCmsFmFileIndexName,
            body: { sort }
        });

        expect(migratedHeadlessCmsFmFileRecords).toBeArrayOfSize(21);
        expect(migratedHeadlessCmsFmFileRecords).toEqual(headlessCmsFmFileMigrated);

        headlessCmsFmFileMigrated.forEach(expectModifiedFieldsAreSynced);

        // 3. Check Model A index.
        const migratedHeadlessCmsModelARecords = await listElasticsearchItems({
            client: elasticsearchClient,
            index: headlessCmsModelAIndexName,
            body: { sort }
        });

        expect(migratedHeadlessCmsModelARecords).toBeArrayOfSize(7);
        expect(migratedHeadlessCmsModelARecords).toEqual(headlessCmsModelAMigrated);

        headlessCmsModelAMigrated.forEach(expectModifiedFieldsAreSynced);

        // 4. Check Model B index.
        const migratedHeadlessCmsModelBRecords = await listElasticsearchItems({
            client: elasticsearchClient,
            index: headlessCmsModelBIndexName,
            body: { sort }
        });

        expect(migratedHeadlessCmsModelBRecords).toBeArrayOfSize(3);
        expect(migratedHeadlessCmsModelBRecords).toEqual(headlessCmsModelBMigrated);

        headlessCmsModelBMigrated.forEach(expectModifiedFieldsAreSynced);

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
            migrations: [CmsEntriesInitNewMetaFields_5_39_0_003]
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
