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
import { CmsEntriesRootFolder_5_37_0_002 } from "~/migrations/5.37.0/002/ddb-es";
import { ddbItemPushes, insertTestEntries } from "./insertTestEntries";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { getDecompressedData } from "~tests/migrations/5.37.0/003/ddb-es/getDecompressedData";
import { createLocalesData, createTenantsData } from "~tests/migrations/5.35.0/006/ddb-es/006.data";
import { esGetIndexName, esGetIndexSettings } from "~/utils";

jest.retryTimes(0);
jest.setTimeout(9000000);

describe("5.37.0-002", () => {
    const documentClient = getDocumentClient();
    const ddbTable = getPrimaryDynamoDbTable({
        documentClient
    });
    const ddbToEsTable = getDynamoToEsTable({
        documentClient
    });
    const elasticsearchClient = createElasticsearchClient();

    beforeEach(async () => {
        process.env.ELASTIC_SEARCH_INDEX_PREFIX =
            new Date().toISOString().replace(/\.|\:/g, "-").toLowerCase() + "-";

        await elasticsearchClient.indices.deleteAll();
    });
    afterEach(async () => {
        await elasticsearchClient.indices.deleteAll();
    });

    logTestNameBeforeEachTest();

    it("should not run if no cms records found", async () => {
        await insertTestData(ddbTable, [...createTenantsData(), ...createLocalesData()]);
        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [CmsEntriesRootFolder_5_37_0_002]
        });

        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(0);
        expect(grouped.skipped.length).toBe(1);
        expect(grouped.notApplicable.length).toBe(0);
    });

    it("should execute migration", async () => {
        await insertTestData(ddbTable, [...createTenantsData(), ...createLocalesData()]);

        let totalEntries = 0;
        try {
            totalEntries = await insertTestEntries({
                ddbTable,
                ddbToEsTable,
                elasticsearchClient,
                options: {
                    maxItems: 1000,
                    maxTenants: 1,
                    maxLocales: 1
                }
            });
        } catch (ex) {
            console.log(
                "Error inserting test entries: ",
                JSON.stringify({
                    message: ex.message,
                    data: ex.data,
                    stack: ex.stack,
                    code: ex.code
                })
            );
            throw ex;
        }

        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            elasticsearchClient,
            dynamoToEsTable: ddbToEsTable,
            migrations: [CmsEntriesRootFolder_5_37_0_002]
        });
        const { data, error } = await handler();

        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(grouped.executed.length).toBe(1);
        expect(grouped.skipped.length).toBe(0);
        expect(grouped.notApplicable.length).toBe(0);

        const entries = await scanTable(ddbTable, {
            filters: [
                {
                    attr: "TYPE",
                    beginsWith: "cms.entry"
                }
            ],
            select: "specific_attributes",
            attributes: ["PK", "SK", "location"],
            limit: 10000000
        });
        /**
         * Must be total items inserted.
         * This is calculated from the tenant / locale combination, max items and amount of pushes for a single item.
         */
        expect(entries.length).toBe(ddbItemPushes * totalEntries);
        const setCheck = new Set<string>();
        for (const entry of entries) {
            expect(entry.location?.folderId).toBe("root");
            setCheck.add(`${entry.PK}:${entry.SK}`);
        }
        expect(setCheck.size).toBe(entries.length);

        const ddbEsRecords = await scanTable(ddbToEsTable, {
            limit: 10000000
        });
        const indexes = new Set<string>();
        expect(ddbEsRecords.length).toBe(totalEntries * 2);
        for (const record of ddbEsRecords) {
            const entry = await getDecompressedData(record.data);
            expect(entry.location?.folderId).toBe("root");

            indexes.add(
                esGetIndexName({
                    tenant: entry.tenant,
                    locale: entry.locale,
                    type: entry.modelId,
                    isHeadlessCmsModel: true
                })
            );
        }
        expect(indexes.size).toBeGreaterThanOrEqual(1);
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
        await insertTestData(ddbTable, [...createTenantsData(), ...createLocalesData()]);
        await insertTestEntries({
            ddbTable,
            ddbToEsTable,
            options: {
                maxItems: 1,
                maxTenants: 1,
                maxLocales: 1
            },
            elasticsearchClient
        });
        const handler = createDdbEsMigrationHandler({
            primaryTable: ddbTable,
            dynamoToEsTable: ddbToEsTable,
            elasticsearchClient,
            migrations: [CmsEntriesRootFolder_5_37_0_002]
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
