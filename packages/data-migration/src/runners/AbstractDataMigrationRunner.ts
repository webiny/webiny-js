import { DataMigration, DataMigrationRunner, MigrationResult, WithLog } from "~/types";

export abstract class AbstractDataMigrationRunner<TMigrationContext>
    implements DataMigrationRunner<TMigrationContext>
{
    abstract getName(): string;

    abstract canExecute(migration: DataMigration<TMigrationContext>): boolean;

    abstract getMigrationContext(): TMigrationContext;

    async execute(migration: DataMigration<TMigrationContext>): Promise<MigrationResult> {
        const result: MigrationResult = {
            success: true,
            logs: [],
            duration: 0,
            runner: this.getName()
        };

        const log = (message: string, data?: any) => {
            result.logs.push({ message, data });
        };

        const migrationContext: WithLog<TMigrationContext> = { ...this.getMigrationContext(), log };

        if (await migration.shouldExecute(migrationContext)) {
            const start = Date.now();
            try {
                await migration.execute(migrationContext);
            } catch (err) {
                result.logs.push(err.message);
                result.success = false;
            } finally {
                result.duration = Date.now() - start;
            }
        }
        return result;
    }
}
