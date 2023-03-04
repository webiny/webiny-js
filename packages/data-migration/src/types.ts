import { Logger, LogEvent } from "pino";

export { Logger };

export interface MigrationItem {
    id: string;
    name: string;
    createdOn: string;
    duration: number;
}

export interface MigrationRepository {
    listMigrations(params?: { limit: number }): Promise<MigrationItem[]>;
    logMigration(migration: MigrationItem): Promise<void>;
}

export interface DataMigration {
    getId(): string;
    getName(): string;
    // This function should check of the migration needs to apply some changes to the system.
    // Returning `false` means "everything is ok, mark this migration as executed".
    shouldExecute(logger: Logger): Promise<boolean>;
    execute(logger: Logger): Promise<void>;
}

export interface MigrationResult {
    success: boolean;
    logs: LogEvent[];
    duration: number;
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

export type MigrationEventHandlerResponse =
    // We can either have a `data`, or `error`, but never both.
    | {
          error: {
              message: string;
          };
          data?: never;
      }
    | {
          data: {
              // Executed migrations
              executed: ExecutedMigrationResponse[];
              // Applicable, but the migration itself decided it should not be executed.
              skipped: SkippedMigrationResponse[];
              // Not applicable; either out of version range, or already applied.
              notApplicable: SkippedMigrationResponse[];
          };
          error?: never;
      };