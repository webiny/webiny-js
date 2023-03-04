import { pino, Logger } from "pino";
import { inject, makeInjectable } from "@webiny/ioc";
import {
    MigrationResult,
    ExecutedMigrationResponse,
    SkippedMigrationResponse,
    MigrationRepository,
    DataMigration
} from "~/types";

import { MigrationRepositorySymbol, LoggerSymbol } from "./symbols";

export type IsMigrationApplicable = (migration: DataMigration) => boolean;

export class MigrationRunner {
    private readonly logger: Logger;
    private readonly repository: MigrationRepository;

    constructor(repository: MigrationRepository, logger: Logger | undefined) {
        this.repository = repository;

        if (!logger) {
            logger = pino({
                transport: {
                    target: "pino-pretty"
                }
            });
        }
        this.logger = logger;
    }

    async execute(migrations: DataMigration[] = [], isApplicable?: IsMigrationApplicable) {
        this.validateIds(migrations);
        const [latestMigration] = await this.repository.listMigrations({ limit: 1 });

        const currentVersion = process.env.WEBINY_VERSION;
        const startingId = latestMigration ? latestMigration.id : `${currentVersion}-000`;
        const lastId = `${currentVersion}-999`;

        // Create zero-migration record.
        if (!latestMigration) {
            await this.repository.logMigration({
                id: startingId,
                name: "starting point for applicable migrations detection",
                createdOn: new Date().toISOString(),
                duration: 0
            });
        }

        const executed: ExecutedMigrationResponse[] = [];
        const skipped: SkippedMigrationResponse[] = [];
        const notApplicable: SkippedMigrationResponse[] = [];

        const defaultIsApplicable: IsMigrationApplicable = mig => {
            return mig.getId() > startingId && mig.getId() <= lastId;
        };

        const isMigrationApplicable = isApplicable || defaultIsApplicable;

        const executableMigrations = migrations
            .filter(mig => {
                if (!isMigrationApplicable(mig)) {
                    notApplicable.push({
                        id: mig.getId(),
                        name: mig.getId(),
                        reason: "not applicable"
                    });

                    return false;
                }
                return true;
            })
            .sort((a, b) => (a.getId() > b.getId() ? 1 : -1));

        this.logger.info(`Found %s applicable migrations.`, executableMigrations.length);

        for (const migration of executableMigrations) {
            const logger = this.logger.child({
                migrationId: migration.getId()
            });

            const shouldExecute = await migration.shouldExecute(logger);

            if (!shouldExecute) {
                skipped.push({
                    id: migration.getId(),
                    name: migration.getName(),
                    reason: "migration already applied"
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
                await migration.execute(logger);
            } catch (err) {
                result.success = false;
                this.logger.error(err, err.message);
            } finally {
                result.duration = Date.now() - start;
            }

            executed.push({
                id: migration.getId(),
                name: migration.getName(),
                result
            });

            if (result.success) {
                await this.repository.logMigration({
                    id: migration.getId(),
                    name: migration.getName(),
                    createdOn: new Date().toISOString(),
                    duration: result.duration
                });
            }
        }

        return { executed, skipped, notApplicable };
    }

    private validateIds(migrations: DataMigration[]) {
        const ids = new Set();
        for (const mig of migrations) {
            const id = mig.getId();
            if (ids.has(id)) {
                const error = new Error(`Duplicate ID found: ${id}`);
                this.logger.error(error);
                throw error;
            }
            ids.add(id);
        }
    }
}

makeInjectable(MigrationRunner, [
    inject(MigrationRepositorySymbol),
    inject(LoggerSymbol, { optional: true })
]);
