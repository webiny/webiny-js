import { createRawEventHandler } from "@webiny/handler-aws";
import { DataMigration, DataMigrationRunner, MigrationRepository, MigrationResult } from "~/types";

interface CreateDataMigrationConfig {
    repository: MigrationRepository;
    // Runners set up migration contexts, and execute migrations.
    runners: DataMigrationRunner<any>[];
    // Migrations to execute.
    migrations: DataMigration<any>[];
}

export interface ExecutedMigrationResponse {
    id: string;
    name: string;
    result: MigrationResult;
}

export interface SkippedMigrationResponse {
    id: string;
    name: string;
    reason: string;
}

export interface MigrationEventHandlerResponse {
    executed: ExecutedMigrationResponse[];
    skipped: SkippedMigrationResponse[];
}

export const createMigrationEventHandler = ({
    repository,
    migrations,
    runners
}: CreateDataMigrationConfig) => {
    return createRawEventHandler(async () => {
        const [latestMigration] = await repository.listMigrations({ limit: 1 });

        const currentVersion = process.env.WEBINY_VERSION;
        const startingId = latestMigration ? latestMigration.id : `${currentVersion}-000`;
        const lastId = `${currentVersion}-999`;

        if (!latestMigration) {
            await repository.logMigration({
                id: startingId,
                name: "starting point for applicable migrations detection",
                createdOn: new Date().toISOString(),
                duration: 0,
                logs: []
            });
        }

        const executableMigrations = migrations
            .filter(mig => mig.getId() > startingId && mig.getId() <= lastId)
            .sort((a, b) => (a.getId() > b.getId() ? 1 : -1));

        const executed: ExecutedMigrationResponse[] = [];
        const skipped: SkippedMigrationResponse[] = [];

        for (const migration of executableMigrations) {
            // Find the first runner that can handle the migration.
            const runner = runners.find(runner => runner.canExecute(migration));
            if (runner) {
                const result = await runner.execute(migration);

                executed.push({
                    id: migration.getId(),
                    name: migration.getName(),
                    result
                });

                if (result.success) {
                    await repository.logMigration({
                        id: migration.getId(),
                        name: migration.getName(),
                        createdOn: new Date().toISOString(),
                        duration: result.duration,
                        logs: result.logs
                    });

                    continue;
                }

                // Migration was not successful, return response to the invoker.
                break;
            }

            skipped.push({
                id: migration.getId(),
                name: migration.getName(),
                reason: "no-runner"
            });
        }

        return { executed, skipped };
    });
};
