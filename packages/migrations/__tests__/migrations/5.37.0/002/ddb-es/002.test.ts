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
import { getTotalItems, insertTestEntries } from "./insertTestEntries";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { getDecompressedData } from "~tests/migrations/5.37.0/003/ddb-es/getDecompressedData";
import { createLocalesData, createTenantsData } from "~tests/migrations/5.35.0/006/ddb-es/006.data";

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

        try {
            await insertTestEntries({
                ddbTable,
                ddbToEsTable,
                elasticsearchClient
            });
        } catch (ex) {
            console.log(
                "Error inserting test entries: ",
                JSON.stringify({
                    message: ex.message,
                    stack: ex.stack,
                    data: ex.data,
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
        expect(entries.length).toBe(getTotalItems());
        const setCheck = new Set<string>();
        for (const entry of entries) {
            expect(entry.location?.folderId).toBe("root");
            setCheck.add(`${entry.PK}:${entry.SK}`);
        }
        expect(setCheck.size).toBe(entries.length);

        const ddbEsEntries = await scanTable(ddbToEsTable, {
            limit: 10000000
        });
        expect(ddbEsEntries.length).toBe(entries.length / 2);
        for (const entry of ddbEsEntries) {
            const data = await getDecompressedData(entry.data);
            expect(data.location?.folderId).toBe("root");
        }
    });

    it("should not run migration if data is already in the expected shape", async () => {
        await insertTestData(ddbTable, [...createTenantsData(), ...createLocalesData()]);
        await insertTestEntries({
            ddbTable,
            ddbToEsTable,
            options: {
                maxItems: 10
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
