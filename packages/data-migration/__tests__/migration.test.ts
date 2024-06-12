import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { useHandler } from "~tests/useHandler";
import { createTable } from "~/createTable";
import { createDdbMigration } from "~tests/createDdbMigration";
import {
    MigrationInvocationErrorResponse,
    MigrationItem,
    MigrationRepository,
    MigrationRun,
    MigrationRunItem
} from "~/types";
import { MigrationRepositoryImpl } from "~/repository/migrations.repository";
import { createDdbProjectMigration } from "~/handlers/createDdbProjectMigration";
import { DbItem, scan } from "@webiny/db-dynamodb";

jest.retryTimes(0);

function assertNotError(
    error: MigrationInvocationErrorResponse["error"] | undefined
): asserts error is undefined {
    if (error !== undefined) {
        throw Error(`Migration handler returned an error: ${error.message}`);
    }
}

function assertIsError(
    error: MigrationInvocationErrorResponse["error"] | undefined
): asserts error is MigrationInvocationErrorResponse["error"] {
    if (!error) {
        throw Error(`Migration handler did not return an error!`);
    }
}

const groupMigrations = (migrations: MigrationRunItem[]) => {
    return {
        executed: migrations.filter(mig => mig.status === "done"),
        skipped: migrations.filter(mig => mig.status === "skipped"),
        errored: migrations.filter(mig => mig.status === "error"),
        notApplicable: migrations.filter(mig => mig.status === "not-applicable")
    };
};

describe("Migration Lambda Handler", () => {
    const documentClient = getDocumentClient({
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
        tls: false,
        region: "local",
        credentials: { accessKeyId: "test", secretAccessKey: "test" }
    });

    const table = createTable({ name: String(process.env.DB_TABLE), documentClient });

    let repository: MigrationRepository;

    beforeEach(() => {
        repository = new MigrationRepositoryImpl(table);
        process.stdout.write(`\n===== ${expect.getState().currentTestName} =====\n`);
    });

    it("should create initial migration record", async () => {
        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: []
            })
        );

        await handler({ version: "0.1.0" });

        // Doing this assertion using native table.scan, to verify the DynamoDB item structure.
        const { items: Items, count: Count } = await scan<DbItem<MigrationRun | MigrationItem>>({
            table
        });
        expect(Count).toEqual(2);

        const migrationRecord = Items.find((item: { TYPE: string }) => item.TYPE === "migration");
        const migrationRunRecord = Items.find(
            (item: { TYPE: string }) => item.TYPE === "migration.run"
        );

        expect(migrationRecord).toMatchObject({
            PK: "MIGRATION#0.1.0-000",
            SK: "A",
            TYPE: "migration",
            GSI1_PK: "MIGRATIONS",
            GSI1_SK: "0.1.0-000",
            data: {
                id: "0.1.0-000",
                description: "starting point for applicable migrations detection",
                startedOn: expect.stringMatching(/^20/),
                finishedOn: expect.stringMatching(/^20/)
            }
        });
        expect(migrationRunRecord).toMatchObject({
            PK: expect.stringMatching("MIGRATION_RUN#"),
            SK: "A",
            TYPE: "migration.run",
            GSI1_PK: "MIGRATION_RUNS",
            GSI1_SK: expect.any(String),
            data: {
                status: "done"
            }
        });
    });

    it("should execute all migrations (empty system)", async () => {
        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: [
                    createDdbMigration("0.1.0-001"),
                    createDdbMigration("0.1.0-002"),
                    createDdbMigration("0.1.0-003")
                ]
            })
        );

        const { data, error } = await handler({ version: "0.1.0" });

        assertNotError(error);

        expect(data.status).toEqual("done");
        expect(data.migrations.length).toEqual(3);

        const migrations = await repository.listMigrations();
        expect(migrations.length).toEqual(4);

        expect(migrations[0].id).toEqual("0.1.0-003");
        expect(migrations[1].id).toEqual("0.1.0-002");
        expect(migrations[2].id).toEqual("0.1.0-001");
        expect(migrations[3].id).toEqual("0.1.0-000");

        const grouped = groupMigrations(data.migrations);
        expect(grouped.executed.length).toEqual(3);
    });

    it("should return migration results after an error", async () => {
        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: [
                    createDdbMigration("0.1.0-001"),
                    createDdbMigration("0.1.0-002", { error: true }),
                    createDdbMigration("0.1.0-003")
                ]
            })
        );

        const { data, error } = await handler({ version: "0.1.0" });
        assertNotError(error);

        const grouped = groupMigrations(data.migrations);
        expect(data.migrations.length).toEqual(2);
        expect(data.status).toEqual("error");
        expect(grouped.executed[0].id).toBe("0.1.0-001");
        expect(grouped.errored[0].id).toBe("0.1.0-002");
    });

    it("should execute migrations that were not yet applied", async () => {
        const allMigrations = [
            createDdbMigration("0.1.0-001"),
            createDdbMigration("0.1.0-002"),
            createDdbMigration("0.1.0-003")
        ];

        const spy = jest.spyOn(allMigrations[0].prototype, "execute");

        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        // This sets the starting point for this test.
        await repository.logMigration({
            id: "0.1.0-001",
            description: "0.1.0-001",
            reason: "executed"
        });

        // Run assertions
        const { data, error } = await handler({ version: "0.1.0" });

        assertNotError(error);

        const migrations = await repository.listMigrations();
        // This time, we expect 3 migrations, because initial migration record will not be inserted.
        expect(migrations.length).toEqual(3);

        const grouped = groupMigrations(data.migrations);
        expect(data.migrations.length).toEqual(3);
        expect(grouped.executed.length).toEqual(2);
        expect(grouped.skipped.length).toEqual(0);
        expect(grouped.notApplicable.length).toEqual(1);
        expect(spy).toHaveBeenCalledTimes(0);
    });

    it("should skip and log migrations, if `shouldExecute` returns `false`", async () => {
        const allMigrations = [
            createDdbMigration("0.1.0-001", { skip: true }),
            createDdbMigration("0.1.0-002", { skip: true }),
            createDdbMigration("0.1.0-003")
        ];

        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        // Run assertions
        const { data, error } = await handler({ version: "0.1.0" });
        assertNotError(error);

        const migrations = await repository.listMigrations();
        const grouped = groupMigrations(data.migrations);

        // We also expect the initial migration to be logged.
        expect(migrations.length).toEqual(4);
        expect(data.migrations.length).toEqual(3);
        expect(grouped.executed.length).toEqual(1);
        expect(grouped.skipped.length).toEqual(2);
        expect(grouped.notApplicable.length).toEqual(0);
    });

    it("should not execute older or newer migrations", async () => {
        const allMigrations = [
            createDdbMigration("1.0.0-001"),
            createDdbMigration("1.1.0-001"),
            createDdbMigration("2.0.0-001"),
            createDdbMigration("2.1.0-001"),
            createDdbMigration("2.1.0-002"),
            createDdbMigration("3.0.0-001"),
            createDdbMigration("3.0.0-002")
        ];

        const spies = allMigrations.map(klass => jest.spyOn(klass.prototype, "execute"));

        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        await repository.logMigration({
            id: "1.1.0-001",
            description: "1.1.0-001",
            reason: "executed"
        });

        // Run assertions
        const { data, error } = await handler({ version: "2.1.0" });

        assertNotError(error);

        // Should run several migrations
        {
            expect(spies[2]).toHaveBeenCalledTimes(1);
            expect(spies[3]).toHaveBeenCalledTimes(1);
            expect(spies[4]).toHaveBeenCalledTimes(1);
            const migrations = await repository.listMigrations();
            const grouped = groupMigrations(data.migrations);
            expect(migrations.length).toEqual(4);
            expect(grouped.executed.length).toEqual(3);
            expect(grouped.skipped.length).toEqual(0);
            expect(grouped.notApplicable.length).toEqual(4);
        }

        // Should NOT run any migrations.
        {
            jest.clearAllMocks();
            const { data, error } = await handler({ version: "0.1.0" });
            assertNotError(error);

            const migrations = await repository.listMigrations();
            expect(migrations.length).toEqual(4);
            const grouped = groupMigrations(data.migrations);
            expect(grouped.executed.length).toEqual(0);
            expect(grouped.notApplicable.length).toEqual(7);
            for (const spy of spies) {
                expect(spy).toHaveBeenCalledTimes(0);
            }
        }
    });

    it("should apply user-provided migration filter", async () => {
        const allMigrations = [
            createDdbMigration("1.0.0-001"),
            createDdbMigration("1.1.0-001"),
            createDdbMigration("2.0.0-001"),
            createDdbMigration("2.1.0-001"),
            createDdbMigration("2.1.0-002"),
            createDdbMigration("3.0.0-001"),
            createDdbMigration("3.0.0-002")
        ];

        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations,
                isMigrationApplicable(migration) {
                    return migration.getId() === "2.1.0-001";
                }
            })
        );

        // Run assertions
        const { data, error } = await handler({ version: "0.1.0" });
        assertNotError(error);
        const grouped = groupMigrations(data.migrations);

        expect(data.migrations.length).toEqual(7);
        expect(grouped.executed.length).toEqual(1);
        expect(grouped.skipped.length).toEqual(0);
        expect(grouped.notApplicable.length).toEqual(6);
    });

    it("should throw error on duplicate migration IDs", async () => {
        const allMigrations = [
            createDdbMigration("1.0.0-001"),
            createDdbMigration("1.1.0-001"),
            createDdbMigration("2.0.0-001"),
            createDdbMigration("2.1.0-001"),
            createDdbMigration("2.1.0-001")
        ];

        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        const { data, error } = await handler({ version: "0.1.0" });
        // We don't expect an error because Lambda invocation to get "status" should go without errors.
        assertNotError(error);
        // We DO, however, expect an error in the status response.
        expect(data.status).toEqual("error");
        expect(data.error?.message).toEqual("Duplicate migration ID found: 2.1.0-001");
    });

    it("should throw error on migration ID ending with 000", async () => {
        const allMigrations = [createDdbMigration("1.0.0-000")];

        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        const { data, error } = await handler({ version: "0.1.0" });
        assertNotError(error);
        expect(data.status).toEqual("error");
        expect(data.migrations.length).toEqual(0);
        expect(data.error?.message).toEqual('Migration ID must not end with "000": 1.0.0-000');
    });

    it("should throw error when project ID is 0.0.0", async () => {
        const allMigrations = [createDdbMigration("1.0.0-001")];

        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        const { error } = await handler({ version: "0.0.0" });
        assertIsError(error);
        expect(error.message).toMatch(`This project is using a development version 0.0.0`);
    });

    it("should run migrations in preid releases", async () => {
        const allMigrations = [
            createDdbMigration("1.0.0-001"),
            createDdbMigration("1.1.0-001"),
            createDdbMigration("2.0.0-001"),
            createDdbMigration("2.1.0-001"),
            createDdbMigration("2.1.0-002")
        ];

        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        const { data, error } = await handler({ version: "2.1.0-beta.1" });
        assertNotError(error);
        const grouped = groupMigrations(data.migrations);
        expect(data.migrations.length).toEqual(5);
        expect(grouped.executed.length).toBe(2);
        expect(grouped.notApplicable.length).toBe(3);
    });

    it("should run migrations that match a given pattern", async () => {
        const allMigrations = [
            createDdbMigration("1.0.0-001"),
            createDdbMigration("1.1.0-001"),
            createDdbMigration("2.0.0-001"),
            createDdbMigration("2.1.0-001"),
            createDdbMigration("2.1.0-002")
        ];

        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        const exactMatch = await handler({ version: "1.1.0", pattern: "2.1.0-001" });
        assertNotError(exactMatch.error);
        const data1 = groupMigrations(exactMatch.data.migrations);
        expect(data1.notApplicable.length).toBe(4);
        expect(data1.executed.length).toBe(1);
        expect(data1.executed[0].id).toBe("2.1.0-001");

        const wildcardMatch = await handler({ version: "1.1.0", pattern: "2.1.0*" });
        assertNotError(wildcardMatch.error);
        const data2 = groupMigrations(wildcardMatch.data.migrations);
        expect(data2.notApplicable.length).toBe(3);
        expect(data2.executed.length).toBe(2);
        expect(data2.executed[0].id).toBe("2.1.0-001");
        expect(data2.executed[1].id).toBe("2.1.0-002");
    });

    it("should skip migrations defined by WEBINY_MIGRATION_SKIP env var", async () => {
        const allMigrations = [
            createDdbMigration("1.0.0-001"),
            createDdbMigration("1.1.0-001"),
            createDdbMigration("2.0.0-001"),
            createDdbMigration("2.1.0-001"),
            createDdbMigration("2.1.0-002")
        ];

        process.env["WEBINY_MIGRATION_SKIP_2_0_0_001"] = "true";
        process.env["WEBINY_MIGRATION_SKIP_2_1_0_002"] = "true";

        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        const exactMatch = await handler({ version: "1.0.0", pattern: "*" });
        assertNotError(exactMatch.error);
        const data1 = groupMigrations(exactMatch.data.migrations);
        expect(data1.notApplicable.length).toBe(0);
        expect(data1.skipped.length).toBe(2);
        expect(data1.executed.length).toBe(3);
        expect(data1.executed[0].id).toBe("1.0.0-001");
        expect(data1.executed[1].id).toBe("1.1.0-001");
        expect(data1.executed[2].id).toBe("2.1.0-001");
    });
});
