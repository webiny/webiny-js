import { Logger } from "pino";
import { inject, makeInjectable } from "@webiny/ioc";
import { coerce } from "semver";
import { MigrationRepositorySymbol, LoggerSymbol, MigrationSymbol } from "./symbols";
import { createPinoLogger, getChildLogger } from "./createPinoLogger";
import {
    MigrationResult,
    ExecutedMigrationResponse,
    SkippedMigrationResponse,
    MigrationRepository,
    DataMigration
} from "~/types";

export type IsMigrationApplicable = (migration: DataMigration) => boolean;

export class MigrationRunner {
    private readonly logger: Logger;
    private readonly migrations: DataMigration[];
    private readonly repository: MigrationRepository;

    constructor(
        repository: MigrationRepository,
        migrations: DataMigration[],
        logger: Logger | undefined
    ) {
        this.repository = repository;
        this.migrations = migrations || [];

        if (!logger) {
            logger = createPinoLogger();
        }
        this.logger = logger;
    }

    async execute(projectVersion: string, isApplicable?: IsMigrationApplicable) {
        this.validateIds(this.migrations);
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
                duration: 0,
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

        const executed: ExecutedMigrationResponse[] = [];
        const skipped: SkippedMigrationResponse[] = [];
        const notApplicable: SkippedMigrationResponse[] = [];

        const defaultIsApplicable: IsMigrationApplicable = mig => {
            return mig.getId() > startingId && mig.getId() <= lastId;
        };

        const isMigrationApplicable = isApplicable || defaultIsApplicable;

        const executableMigrations = this.migrations
            .filter(mig => {
                if (!isMigrationApplicable(mig)) {
                    notApplicable.push({
                        id: mig.getId(),
                        description: mig.getDescription(),
                        reason: "not applicable"
                    });

                    return false;
                }
                return true;
            })
            .sort((a, b) => (a.getId() > b.getId() ? 1 : -1));

        this.logger.info(`Found %s applicable migration(s).`, executableMigrations.length);

        for (const migration of executableMigrations) {
            const logger = getChildLogger(this.logger, migration);

            const shouldExecute = await migration.shouldExecute(logger);

            if (!shouldExecute) {
                this.logger.info(`Skipping migration %s.`, migration.getId());
                skipped.push({
                    id: migration.getId(),
                    description: migration.getDescription(),
                    reason: "migration already applied"
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

            const result: MigrationResult = {
                duration: 0,
                logs: [],
                success: true
            };

            const start = Date.now();
            try {
                this.logger.info(
                    `Executing migration %s: %s.`,
                    migration.getId(),
                    migration.getDescription()
                );
                await migration.execute(logger);
            } catch (err) {
                result.success = false;
                this.logger.error(err, err.message);
            } finally {
                result.duration = Date.now() - start;
                this.logger.info(
                    `Finished executing migration %s in %sms.`,
                    migration.getId(),
                    result.duration
                );
            }

            executed.push({
                id: migration.getId(),
                description: migration.getDescription(),
                result
            });

            if (result.success) {
                await this.repository.logMigration({
                    id: migration.getId(),
                    description: migration.getDescription(),
                    createdOn: new Date().toISOString(),
                    duration: result.duration,
                    reason: "executed"
                });
            }
        }

        this.logger.info(`Finished processing applicable migrations.`);

        return { executed, skipped, notApplicable };
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
}

makeInjectable(MigrationRunner, [
    inject(MigrationRepositorySymbol),
    inject(MigrationSymbol, { multi: true, optional: true }),
    inject(LoggerSymbol, { optional: true })
]);
