import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { useHandler } from "~tests/useHandler";
import { createTable } from "~/createTable";
import { createDdbMigration } from "~tests/createDdbMigration";
import { MigrationEventHandlerResponse, MigrationRepository } from "~/types";
import { MigrationRepositoryImpl } from "~/repository/migrations.repository";
import { createDdbProjectMigration } from "~/handlers/createDdbProjectMigration";

jest.retryTimes(0);

function assertNotError(error: MigrationEventHandlerResponse["error"]): asserts error is undefined {
    if (error) {
        throw Error(`Migration handler returned an error: ${error.message}`);
    }
}

describe("Migration Lambda Handler", () => {
    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
        sslEnabled: false,
        region: "local",
        accessKeyId: "test",
        secretAccessKey: "test"
    });

    let repository: MigrationRepository;
    let table: ReturnType<typeof createTable>;

    beforeEach(() => {
        table = createTable({ name: String(process.env.DB_TABLE), documentClient });
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
        const { Items, Count } = await table.scan();
        expect(Count).toEqual(1);
        expect(Items[0]).toMatchObject({
            PK: "MIGRATION#0.1.0-000",
            SK: "A",
            TYPE: "migration",
            GSI1_PK: "MIGRATIONS",
            GSI1_SK: "0.1.0-000",
            data: {
                id: "0.1.0-000",
                description: "starting point for applicable migrations detection",
                createdOn: expect.stringMatching(/^20/)
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

        expect(data.executed.length).toEqual(3);

        const migrations = await repository.listMigrations();
        expect(migrations.length).toEqual(4);

        expect(migrations[0].id).toEqual("0.1.0-003");
        expect(migrations[1].id).toEqual("0.1.0-002");
        expect(migrations[2].id).toEqual("0.1.0-001");
        expect(migrations[3].id).toEqual("0.1.0-000");
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

        expect(data.executed.length).toBe(3);
        expect(data.executed[0].id).toBe("0.1.0-001");
        expect(data.executed[0].result.success).toBe(true);
        expect(data.executed[1].id).toBe("0.1.0-002");
        expect(data.executed[1].result.success).toBe(false);
    });

    it("should execute migrations that were not yet applied", async () => {
        const allMigrations = [
            createDdbMigration("0.1.0-001"),
            createDdbMigration("0.1.0-002"),
            createDdbMigration("0.1.0-003")
        ];

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
            createdOn: new Date().toISOString(),
            duration: 0,
            reason: "executed"
        });

        // Run assertions
        const { data, error } = await handler({ version: "0.1.0" });

        assertNotError(error);

        const migrations = await repository.listMigrations();
        // This time, we expect 3 migrations, because initial migration record will not be inserted.
        expect(migrations.length).toEqual(3);
        expect(data.executed.length).toEqual(2);
        expect(data.skipped.length).toEqual(0);
        expect(data.notApplicable.length).toEqual(1);
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
        // We also expect the initial migration to be logged.
        expect(migrations.length).toEqual(4);
        expect(data.executed.length).toEqual(1);
        expect(data.skipped.length).toEqual(2);
        expect(data.notApplicable.length).toEqual(0);
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

        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        await repository.logMigration({
            id: "1.1.0-001",
            description: "1.1.0-001",
            createdOn: new Date().toISOString(),
            duration: 0,
            reason: "executed"
        });

        // Run assertions
        const { data, error } = await handler({ version: "2.1.0" });

        assertNotError(error);

        // Should run several migrations
        {
            const migrations = await repository.listMigrations();
            expect(migrations.length).toEqual(4);
            expect(data.executed.length).toEqual(3);
            expect(data.skipped.length).toEqual(0);
            expect(data.notApplicable.length).toEqual(4);
        }

        // Should NOT run any migrations.
        {
            const { data, error } = await handler({ version: "0.1.0" });

            assertNotError(error);

            const migrations = await repository.listMigrations();
            expect(migrations.length).toEqual(4);
            expect(data.executed.length).toEqual(0);
            expect(data.skipped.length).toEqual(0);
            expect(data.notApplicable.length).toEqual(7);
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

        expect(data.executed.length).toEqual(1);
        expect(data.skipped.length).toEqual(0);
        expect(data.notApplicable.length).toEqual(6);
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

        const { error } = await handler({ version: "0.1.0" });

        expect(error?.message).toMatch("Duplicate migration ID found");
    });

    it("should throw error on migration ID ending with 000", async () => {
        const allMigrations = [createDdbMigration("1.0.0-000")];

        const handler = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        const { error } = await handler({ version: "0.1.0" });

        expect(error?.message).toMatch(`Migration ID must not end with "000": 1.0.0-000`);
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

        expect(error?.message).toMatch(`This project is using a development version 0.0.0`);
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

        expect(data.executed.length).toBe(2);
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
        expect(exactMatch.data.executed.length).toBe(1);
        expect(exactMatch.data.executed[0].id).toBe("2.1.0-001");

        const wildcardMatch = await handler({ version: "1.1.0", pattern: "2.1.0*" });
        assertNotError(wildcardMatch.error);
        expect(wildcardMatch.data.executed.length).toBe(2);
        expect(wildcardMatch.data.executed[0].id).toBe("2.1.0-001");
        expect(wildcardMatch.data.executed[1].id).toBe("2.1.0-002");
    });
});
