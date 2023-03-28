import { Logger } from "pino";
import { inject, makeInjectable } from "@webiny/ioc";
import { coerce } from "semver";
import {
    MigrationRepositorySymbol,
    LoggerSymbol,
    MigrationSymbol,
    ExecutionTimeLimiterSymbol
} from "./symbols";
import { createPinoLogger, getChildLogger } from "./createPinoLogger";
import {
    MigrationRepository,
    DataMigration,
    DataMigrationContext,
    ExecutionTimeLimiter,
    MigrationRun,
    MigrationStatus,
    MigrationRunItem
} from "~/types";
import { executeWithRetry } from "./executeWithRetry";

export type IsMigrationApplicable = (migration: DataMigration) => boolean;

class MigrationNotFinished extends Error {}

export class MigrationRunner {
    private readonly logger: Logger;
    private readonly migrations: DataMigration[];
    private readonly repository: MigrationRepository;
    private readonly timeLimiter: ExecutionTimeLimiter;

    constructor(
        repository: MigrationRepository,
        timeLimiter: ExecutionTimeLimiter,
        migrations: DataMigration[],
        logger: Logger | undefined
    ) {
        this.repository = repository;
        this.timeLimiter = timeLimiter;
        this.migrations = migrations || [];

        if (!logger) {
            logger = createPinoLogger();
        }
        this.logger = logger;
    }

    async execute(projectVersion: string, isApplicable?: IsMigrationApplicable) {
        const lastRun = await this.getOrCreateRun();

        // We don't want to run multiple migration processes at the same time.
        if (lastRun.status === "running") {
            return;
        }

        try {
            this.validateIds(this.migrations);
        } catch (err) {
            lastRun.status = "error";
            lastRun.error = {
                message: err.message
            };
            await this.repository.saveRun(lastRun);
            return;
        }

        const [latestMigration] = await this.repository.listMigrations({ limit: 1 });

        this.logger.info(`Project version is %s.`, projectVersion);

        // Get current version, and coerce it to a valid SemVer.
        // With this, we can run migrations targeted for stable versions, released under a preid tag (e.g., `beta`).
        const currentVersion = coerce(projectVersion) + "";
        const startingId = latestMigration ? latestMigration.id : `${currentVersion}-000`;
        const lastId = `${currentVersion}-999`;

        // Create initial migration record.
        if (!latestMigration) {
            this.logger.info(
                `No migrations were ever executed. Creating initial migration record %s.`,
                startingId
            );
            await this.repository.logMigration({
                id: startingId,
                description: "starting point for applicable migrations detection",
                createdOn: new Date().toISOString(),
                reason: "initial migration"
            });
        } else {
            this.logger.info(`Latest migration ID is %s.`, latestMigration.id);
        }

        if (isApplicable) {
            this.logger.info(`Using custom "isApplicable" function.`);
        } else {
            this.logger.info(`Using migrations in the range of %s to %s.`, startingId, lastId);
        }

        const defaultIsApplicable: IsMigrationApplicable = mig => {
            return mig.getId() > startingId && mig.getId() <= lastId;
        };

        const isMigrationApplicable = isApplicable || defaultIsApplicable;

        const executableMigrations = this.migrations
            .filter(mig => {
                if (!isMigrationApplicable(mig)) {
                    lastRun.migrations.push({
                        id: mig.getId(),
                        status: "not-applicable"
                    });

                    return false;
                }
                return true;
            })
            .sort((a, b) => (a.getId() > b.getId() ? 1 : -1));

        this.logger.info(
            `Found %s applicable out of %s available migration(s).`,
            executableMigrations.length,
            this.migrations.length
        );

        // Are we're within the last 2 minutes of the execution time limit?
        const shouldCreateCheckpoint = () => {
            return this.timeLimiter() < 120000;
        };

        if (executableMigrations.length) {
            lastRun.status = "running";
            await this.repository.saveRun(lastRun);
        }

        for (const migration of executableMigrations) {
            const runItem = this.getOrCreateRunItem(lastRun, migration);
            const checkpoint = await this.repository.getCheckpoint(migration.getId());
            const logger = getChildLogger(this.logger, migration);

            if (checkpoint) {
                this.logger.info(checkpoint, `Found checkpoint ${migration.getId()}.`);
            }

            const context: DataMigrationContext = {
                projectVersion,
                logger,
                checkpoint,
                runningOutOfTime: shouldCreateCheckpoint,
                createCheckpoint: async (data: unknown) => {
                    await this.createCheckpoint(migration, data);
                },
                createCheckpointAndExit: async (data: unknown) => {
                    await this.createCheckpoint(migration, data);
                    // We throw an error to break out of the migration execution completely.
                    throw new MigrationNotFinished();
                }
            };
            const shouldExecute = checkpoint ? true : await migration.shouldExecute(context);

            if (!shouldExecute) {
                this.logger.info(`Skipping migration %s.`, migration.getId());
                this.setRunItem(lastRun, {
                    ...runItem,
                    status: "skipped"
                });

                await this.repository.logMigration({
                    id: migration.getId(),
                    description: migration.getDescription(),
                    createdOn: new Date().toISOString(),
                    duration: 0,
                    reason: "skipped"
                });

                continue;
            }

            const start = Date.now();
            try {
                this.setRunItem(lastRun, runItem);
                this.logger.info(
                    `Executing migration %s: %s`,
                    migration.getId(),
                    migration.getDescription()
                );
                await migration.execute(context);
                runItem.status = "done";
            } catch (err) {
                // If `MigrationNotFinished` was thrown, we will need to resume the migration.
                if (err instanceof MigrationNotFinished) {
                    lastRun.status = "pending";
                    runItem.status = "pending";
                    return;
                }

                runItem.status = "error";
                lastRun.status = "error";
                lastRun.error = {
                    name: err.name || "Migration error",
                    message: err.message,
                    stack: err.stack,
                    data: err.data,
                    code: err.code
                };
                this.logger.error(err, err.message);
                return;
            } finally {
                const duration = Date.now() - start;
                // We sum duration from the previous run with the current run.
                runItem.duration = duration + (runItem.duration || 0);

                // Update run stats.
                this.setRunItem(lastRun, runItem);
                await this.repository.saveRun(lastRun);

                this.logger.info(
                    `Finished executing migration %s in %sms.`,
                    migration.getId(),
                    duration
                );
            }

            await this.repository.logMigration({
                id: migration.getId(),
                description: migration.getDescription(),
                createdOn: new Date().toISOString(),
                duration: runItem.duration,
                reason: "executed"
            });

            this.logger.info(`Deleting checkpoint ${migration.getId()}.`);
            await this.repository.deleteCheckpoint(migration.getId());
        }

        await new Promise(resolve => setTimeout(resolve, 10000));
        lastRun.status = "done";
        await this.repository.saveRun(lastRun);

        this.logger.info(`Finished processing applicable migrations.`);
    }

    async getStatus(): Promise<MigrationStatus> {
        const lastRun = await this.repository.getLastRun();
        if (!lastRun) {
            throw new Error(`No migrations were ever executed!`);
        }

        // Since we don't store migration descriptions to DB, we need to fetch them from actual migration objects.
        const withDescriptions = lastRun.migrations.map(mig => {
            const dataMigration = this.migrations.find(dm => dm.getId() === mig.id);
            return {
                ...mig,
                description: dataMigration ? dataMigration.getDescription() : "N/A"
            };
        });

        return { ...lastRun, migrations: withDescriptions };
    }

    private validateIds(migrations: DataMigration[]) {
        const ids = new Set();
        for (const mig of migrations) {
            const id = mig.getId();
            if (id.endsWith("-000")) {
                const error = new Error(`Migration ID must not end with "000": ${id}`);
                this.logger.error(error);
                throw error;
            }

            if (ids.has(id)) {
                const error = new Error(`Duplicate migration ID found: ${id}`);
                this.logger.error(error);
                throw error;
            }
            ids.add(id);
        }
    }

    private async createCheckpoint(migration: DataMigration, checkpoint: unknown) {
        this.logger.info(checkpoint, `Saving checkpoint ${migration.getId()}`);
        const execute = () => this.repository.createCheckpoint(migration.getId(), checkpoint);
        await executeWithRetry(execute);
    }

    private async getOrCreateRun() {
        const completedStatus = ["done", "error"];
        let currentRun = await this.repository.getLastRun();
        if (!currentRun || completedStatus.includes(currentRun.status)) {
            currentRun = {
                status: "init",
                createdOn: new Date().toISOString(),
                migrations: []
            };

            await this.repository.saveRun(currentRun);
        }

        return currentRun;
    }

    private getOrCreateRunItem(run: MigrationRun, migration: DataMigration) {
        return (
            run.migrations.find(item => item.id === migration.getId()) || {
                id: migration.getId(),
                duration: 0,
                status: "running"
            }
        );
    }

    private setRunItem(run: MigrationRun, item: MigrationRunItem) {
        const index = run.migrations.findIndex(runItem => runItem.id === item.id);
        if (index < 0) {
            run.migrations.push(item);
        } else {
            run.migrations = [
                ...run.migrations.slice(0, index),
                item,
                ...run.migrations.slice(index + 1)
            ];
        }
    }
}

makeInjectable(MigrationRunner, [
    inject(MigrationRepositorySymbol),
    inject(ExecutionTimeLimiterSymbol),
    inject(MigrationSymbol, { multi: true, optional: true }),
    inject(LoggerSymbol, { optional: true })
]);
