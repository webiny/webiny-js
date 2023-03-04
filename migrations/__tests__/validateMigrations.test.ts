import { createDdbEsProjectMigration, createDdbProjectMigration } from "@webiny/data-migration";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/client";
import {
    assertNotError,
    getDynamoToEsTable,
    getPrimaryDynamoDbTable,
    useHandler
} from "~/testUtils";
import { migrations as ddbMigrations } from "~/ddb";
import { migrations as ddbEsMigrations } from "~/ddb-es";

jest.retryTimes(0);

// This test runs all migrations to make sure that they have unique IDs, and that
// they're executable without any obvious errors. Individual migration tests are located
// next to the migration implementations.
describe("Validate Migrations", () => {
    let primaryTable: ReturnType<typeof getPrimaryDynamoDbTable>;
    let dynamoToEsTable: ReturnType<typeof getDynamoToEsTable>;

    beforeEach(() => {
        primaryTable = getPrimaryDynamoDbTable();
        dynamoToEsTable = getDynamoToEsTable();

        process.stdout.write(`\n===== ${expect.getState().currentTestName} =====\n`);
    });

    it("should run all DDB migrations", async () => {
        const migrations = ddbMigrations();
        const { handler } = useHandler(
            createDdbProjectMigration({
                primaryTable,
                migrations,
                isMigrationApplicable: () => true
            })
        );

        const { data, error } = await handler({}, {} as any);

        assertNotError(error);

        // GOAL: Expect all registered migrations to be processed.
        // A vast majority of migrations will not actually be executed, because the conditions for execution
        // will not be met, due to the system not being installed, data records missing, etc.
        // However, all migrations will have their `shouldExecute` method invoked. Thus, we have to add
        // `executed` and `skipped` migrations for this assertion to be correct.
        expect(data.executed.length + data.skipped.length).toEqual(migrations.length);
        expect(data.notApplicable.length).toEqual(0);
    });

    it("should run all DDB-ES migrations", async () => {
        const migrations = ddbEsMigrations();
        const { handler } = useHandler(
            createDdbEsProjectMigration({
                primaryTable,
                dynamoToEsTable,
                migrations,
                elasticsearchClient: createElasticsearchClient(),
                isMigrationApplicable: () => true
            })
        );

        const { data, error } = await handler({}, {} as any);

        assertNotError(error);

        // GOAL: Expect all registered migrations to be processed.
        // A vast majority of migrations will not actually be executed, because the conditions for execution
        // will not be met, due to the system not being installed, data records missing, etc.
        // However, all migrations will have their `shouldExecute` method invoked. Thus, we have to add
        // `executed` and `skipped` migrations for this assertion to be correct.
        expect(data.executed.length + data.skipped.length).toEqual(migrations.length);
        expect(data.notApplicable.length).toEqual(0);
    });
});
