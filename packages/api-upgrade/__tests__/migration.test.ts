import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { useHandler } from "~tests/useHandler";
import { createMigrationEventHandler } from "~/createMigrationEventHandler";
import { createTable } from "~/createTable";
import { createMigrationsRepository } from "~/repository/migrations.repository";
import { createDdbMigration } from "~tests/createDdbMigration";
import { DynamoDbMigrationRunner } from "~/runners/DynamoDbMigrationRunner";
import { createEsMigration } from "~tests/createEsMigration";

jest.retryTimes(0);

describe("Migration Lambda Handler", () => {
    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
        sslEnabled: false,
        region: "local",
        accessKeyId: "test",
        secretAccessKey: "test"
    });

    let repository: ReturnType<typeof createMigrationsRepository>;
    let table: ReturnType<typeof createTable>;

    beforeEach(() => {
        table = createTable({ name: String(process.env.DB_TABLE), documentClient });
        repository = createMigrationsRepository(table);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should create zero-migration record", async () => {
        const { handler } = useHandler(
            createMigrationEventHandler({
                migrations: [],
                runners: [],
                repository
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
                name: "starting point for applicable migrations detection",
                createdOn: expect.stringMatching(/^20/)
            }
        });
    });

    it("should execute all migrations (empty system)", async () => {
        const { handler } = useHandler(
            createMigrationEventHandler({
                migrations: [
                    createDdbMigration("0.0.0-001"),
                    createDdbMigration("0.0.0-003"),
                    createDdbMigration("0.0.0-002")
                ],
                runners: [
                    new DynamoDbMigrationRunner({
                        table,
                        documentClient
                    })
                ],
                repository
            })
        );

        await handler({}, {} as any);

        const migrations = await repository.listMigrations();
        expect(migrations.length).toEqual(4);
        expect(migrations[0].id).toEqual("0.0.0-003");
        expect(migrations[1].id).toEqual("0.0.0-002");
        expect(migrations[2].id).toEqual("0.0.0-001");
        expect(migrations[3].id).toEqual("0.0.0-000");
    });

    it("should return migration results with logs", async () => {
        const { handler } = useHandler(
            createMigrationEventHandler({
                migrations: [
                    createDdbMigration("0.0.0-001"),
                    createDdbMigration("0.0.0-003"),
                    createDdbMigration("0.0.0-002")
                ],
                runners: [
                    new DynamoDbMigrationRunner({
                        table,
                        documentClient
                    })
                ],
                repository
            })
        );

        const { executed } = await handler({}, {} as any);

        expect(executed).toBeTruthy();
        expect(executed.length).toBe(3);
        expect(executed[0].id).toBe("0.0.0-001");
        expect(executed[1].id).toBe("0.0.0-002");
        expect(executed[2].id).toBe("0.0.0-003");
    });

    it("should return migration results after an error", async () => {
        const { handler } = useHandler(
            createMigrationEventHandler({
                migrations: [
                    createDdbMigration("0.0.0-001"),
                    createDdbMigration("0.0.0-003"),
                    createDdbMigration("0.0.0-002", { error: true })
                ],
                runners: [
                    new DynamoDbMigrationRunner({
                        table,
                        documentClient
                    })
                ],
                repository
            })
        );

        // TODO: get TS to show proper return type here
        const { executed } = await handler({}, {} as any);

        expect(executed).toBeTruthy();
        expect(executed.length).toBe(2);
        expect(executed[0].id).toBe("0.0.0-001");
        expect(executed[0].result.success).toBe(true);
        expect(executed[1].id).toBe("0.0.0-002");
        expect(executed[1].result.success).toBe(false);
    });

    it("should skip migrations that don't have a runner", async () => {
        const { handler } = useHandler(
            createMigrationEventHandler({
                migrations: [
                    createDdbMigration("0.0.0-001"),
                    createEsMigration("0.0.0-003"),
                    createEsMigration("0.0.0-002")
                ],
                runners: [
                    new DynamoDbMigrationRunner({
                        table,
                        documentClient
                    })
                ],
                repository
            })
        );

        const { executed, skipped } = await handler({}, {} as any);

        expect(executed.length).toEqual(1);
        expect(executed[0].id).toEqual("0.0.0-001");
        expect(executed[0].result.runner).toEqual("dynamodb-migration-runner");
        expect(skipped.length).toEqual(2);
        expect(skipped[0].id).toEqual("0.0.0-002");
        expect(skipped[0].reason).toEqual("no-runner");
        expect(skipped[1].id).toEqual("0.0.0-003");
        expect(skipped[1].reason).toEqual("no-runner");
    });

    it("should execute 2 out of 3 migrations", async () => {
        const allMigrations = [
            createDdbMigration("0.0.0-001"),
            createDdbMigration("0.0.0-003"),
            createDdbMigration("0.0.0-002")
        ];

        const migration1 = jest.spyOn(allMigrations[0], "execute");
        const migration2 = jest.spyOn(allMigrations[1], "execute");
        const migration3 = jest.spyOn(allMigrations[2], "execute");

        const { handler } = useHandler(
            createMigrationEventHandler({
                migrations: allMigrations,
                runners: [
                    new DynamoDbMigrationRunner({
                        table,
                        documentClient
                    })
                ],
                repository
            })
        );

        await repository.logMigration({
            id: "0.0.0-001",
            name: "0.0.0-001",
            createdOn: new Date().toISOString(),
            duration: 0,
            logs: []
        });

        // Run assertions
        await handler({}, {} as any);

        const migrations = await repository.listMigrations();
        // This time, we expect 3 migrations, because zero-migration will not be inserted.
        expect(migrations.length).toEqual(3);
        expect(migration1).not.toHaveBeenCalled();
        expect(migration2).toHaveBeenCalled();
        expect(migration3).toHaveBeenCalled();
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

        const spies = allMigrations.map(migration => {
            return jest.spyOn(migration, "execute");
        });

        const { handler } = useHandler(
            createMigrationEventHandler({
                migrations: allMigrations,
                runners: [
                    new DynamoDbMigrationRunner({
                        table,
                        documentClient
                    })
                ],
                repository
            })
        );

        await repository.logMigration({
            id: "1.1.0-001",
            name: "1.1.0-001",
            createdOn: new Date().toISOString(),
            duration: 0,
            logs: []
        });

        process.env.WEBINY_VERSION = "2.1.0";

        // Run assertions
        await handler({}, {} as any);

        // Should run several migrations
        {
            const migrations = await repository.listMigrations();
            expect(migrations.length).toEqual(4);
            expect(spies[0]).not.toHaveBeenCalled();
            expect(spies[1]).not.toHaveBeenCalled();
            expect(spies[2]).toHaveBeenCalled();
            expect(spies[3]).toHaveBeenCalled();
            expect(spies[4]).toHaveBeenCalled();
            expect(spies[6]).not.toHaveBeenCalled();
        }

        jest.clearAllMocks();

        // Should NOT run any migrations.
        {
            await handler({}, {} as any);
            const migrations = await repository.listMigrations();
            expect(migrations.length).toEqual(4);
            expect(spies[0]).not.toHaveBeenCalled();
            expect(spies[1]).not.toHaveBeenCalled();
            expect(spies[2]).not.toHaveBeenCalled();
            expect(spies[3]).not.toHaveBeenCalled();
            expect(spies[4]).not.toHaveBeenCalled();
            expect(spies[6]).not.toHaveBeenCalled();
        }
    });
});
