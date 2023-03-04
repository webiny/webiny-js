import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { useHandler } from "~tests/useHandler";
import { createTable } from "~/createTable";
import { createDdbMigration } from "~tests/createDdbMigration";
import { MigrationEventHandlerResponse, MigrationRepository } from "~/types";
import { MigrationRepositoryImpl } from "~/repository/migrations.repository";
import { createDdbProjectMigration } from "~/createDdbProjectMigration";

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
    });

    it("should create zero-migration record", async () => {
        const { handler } = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: []
            })
        );

        await handler({}, {} as any);

        // Doing this assertion using native table.scan, to verify the DynamoDB item structure.
        const { Items, Count } = await table.scan();
        expect(Count).toEqual(1);
        expect(Items[0]).toMatchObject({
            PK: "MIGRATION#0.0.0-000",
            SK: "A",
            TYPE: "migration",
            GSI1_PK: "MIGRATIONS",
            GSI1_SK: "0.0.0-000",
            data: {
                id: "0.0.0-000",
                description: "starting point for applicable migrations detection",
                createdOn: expect.stringMatching(/^20/)
            }
        });
    });

    it("should execute all migrations (empty system)", async () => {
        const { handler } = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: [
                    createDdbMigration("0.0.0-001"),
                    createDdbMigration("0.0.0-003"),
                    createDdbMigration("0.0.0-002")
                ]
            })
        );

        const { data, error } = await handler({}, {} as any);

        assertNotError(error);

        expect(data.executed.length).toEqual(3);

        const migrations = await repository.listMigrations();
        expect(migrations.length).toEqual(4);

        expect(migrations[0].id).toEqual("0.0.0-003");
        expect(migrations[1].id).toEqual("0.0.0-002");
        expect(migrations[2].id).toEqual("0.0.0-001");
        expect(migrations[3].id).toEqual("0.0.0-000");
    });

    it("should return migration results with logs", async () => {
        const { handler } = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: [
                    createDdbMigration("0.0.0-001"),
                    createDdbMigration("0.0.0-003"),
                    createDdbMigration("0.0.0-002")
                ]
            })
        );

        const { data, error } = await handler({}, {} as any);

        assertNotError(error);

        expect(data.executed).toBeTruthy();
        expect(data.executed.length).toBe(3);
        expect(data.executed[0].id).toBe("0.0.0-001");
        expect(data.executed[1].id).toBe("0.0.0-002");
        expect(data.executed[2].id).toBe("0.0.0-003");
    });

    it("should return migration results after an error", async () => {
        const { handler } = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: [
                    createDdbMigration("0.0.0-001"),
                    createDdbMigration("0.0.0-003"),
                    createDdbMigration("0.0.0-002", { error: true })
                ]
            })
        );

        const { data, error } = await handler({}, {} as any);

        assertNotError(error);

        expect(data.executed.length).toBe(3);
        expect(data.executed[0].id).toBe("0.0.0-001");
        expect(data.executed[0].result.success).toBe(true);
        expect(data.executed[1].id).toBe("0.0.0-002");
        expect(data.executed[1].result.success).toBe(false);
    });

    it("should execute 2 out of 3 migrations", async () => {
        const allMigrations = [
            createDdbMigration("0.0.0-001"),
            createDdbMigration("0.0.0-003"),
            createDdbMigration("0.0.0-002")
        ];

        const { handler } = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        await repository.logMigration({
            id: "0.0.0-001",
            description: "0.0.0-001",
            createdOn: new Date().toISOString(),
            duration: 0
        });

        // Run assertions
        const { data, error } = await handler({}, {} as any);

        assertNotError(error);

        const migrations = await repository.listMigrations();
        // This time, we expect 3 migrations, because zero-migration will not be inserted.
        expect(migrations.length).toEqual(3);
        expect(data.executed.length).toEqual(2);
        expect(data.skipped.length).toEqual(0);
        expect(data.notApplicable.length).toEqual(1);
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

        const { handler } = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        await repository.logMigration({
            id: "1.1.0-001",
            description: "1.1.0-001",
            createdOn: new Date().toISOString(),
            duration: 0
        });

        process.env.WEBINY_VERSION = "2.1.0";

        // Run assertions
        const { data, error } = await handler({}, {} as any);

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
            const { data, error } = await handler({}, {} as any);

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

        const { handler } = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations,
                isMigrationApplicable(migration) {
                    return migration.getId() === "2.1.0-001";
                }
            })
        );

        // Run assertions
        const { data, error } = await handler({}, {} as any);

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

        const { handler } = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        const { error } = await handler({}, {} as any);

        expect(error?.message).toMatch("Duplicate migration ID found");
    });

    it("should throw error on migration ID ending with 000", async () => {
        const allMigrations = [createDdbMigration("1.0.0-000")];

        const { handler } = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        const { error } = await handler({}, {} as any);

        expect(error?.message).toMatch(`Migration ID must not end with "000": 1.0.0-000`);
    });

    it("should run migrations in preid releases", async () => {
        process.env.WEBINY_VERSION = "2.1.0-beta.1";

        const allMigrations = [
            createDdbMigration("1.0.0-001"),
            createDdbMigration("1.1.0-001"),
            createDdbMigration("2.0.0-001"),
            createDdbMigration("2.1.0-001"),
            createDdbMigration("2.1.0-002")
        ];

        const { handler } = useHandler(
            createDdbProjectMigration({
                primaryTable: table,
                migrations: allMigrations
            })
        );

        const { data, error } = await handler({}, {} as any);

        assertNotError(error);

        expect(data.executed.length).toBe(2);
    });
});
