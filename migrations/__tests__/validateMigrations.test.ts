import { createDdbProjectMigration } from "@webiny/data-migration";
import { assertNotError, getPrimaryDynamoDbTable, useHandler } from "~/testUtils";
import { migrations } from "~/ddb";

jest.retryTimes(0);

// This test runs all migrations to make sure that they have unique IDs, and that
// they're executable without any obvious errors. Individual migration tests are located
// next to the migration implementations.
describe("Validate Migrations", () => {
    let table: ReturnType<typeof getPrimaryDynamoDbTable>;

    beforeEach(() => {
        table = getPrimaryDynamoDbTable();
    });

    it("should run all migrations", async () => {
        const ddbMigrations = migrations();
        const { handler } = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: ddbMigrations,
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
        expect(data.executed.length + data.skipped.length).toEqual(ddbMigrations.length);
        expect(data.notApplicable.length).toEqual(0);
    });
});
