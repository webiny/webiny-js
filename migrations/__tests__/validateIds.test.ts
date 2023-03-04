import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createTable, createDdbProjectMigration } from "@webiny/data-migration";
import { assertNotError, useHandler } from "~/testUtils";
import { migrations } from "~/ddb";

jest.retryTimes(0);

describe("Validate Migrations", () => {
    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
        sslEnabled: false,
        region: "local",
        accessKeyId: "test",
        secretAccessKey: "test"
    });

    let table: ReturnType<typeof createTable>;

    beforeEach(() => {
        table = createTable({ name: String(process.env.DB_TABLE), documentClient });
    });

    it("should run all migrations", async () => {
        const ddbMigrations = migrations();
        const { handler } = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: ddbMigrations,
                isMigrationApplicable() {
                    // We want to run ALL migrations, no matter the DB version.
                    return true;
                }
            })
        );

        const { data, error } = await handler({}, {} as any);

        assertNotError(error);

        // Make sure that all registered migrations were executed.
        expect(data.executed.length).toEqual(ddbMigrations.length);
        expect(data.skipped.length).toEqual(0);
        expect(data.notApplicable.length).toEqual(0);
    });
});
