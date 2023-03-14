import { Logger, LogEvent } from "pino";

export { Logger };

export interface MigrationItem {
    id: string;
    description: string;
    createdOn: string;
    duration: number;
    reason: string;
}

export interface MigrationRepository {
    listMigrations(params?: { limit: number }): Promise<MigrationItem[]>;
    logMigration(migration: MigrationItem): Promise<void>;
}

export interface DataMigrationContext {
    projectVersion: string;
    logger: Logger;
}

export interface DataMigration {
    getId(): string;
    getDescription(): string;
    // This function should check of the migration needs to apply some changes to the system.
    // Returning `false` means "everything is ok, mark this migration as executed".
    shouldExecute(context: DataMigrationContext): Promise<boolean>;
    execute(context: DataMigrationContext): Promise<void>;
}

export interface MigrationResult {
    success: boolean;
    logs: LogEvent[];
    duration: number;
}

export interface ExecutedMigrationResponse {
    id: string;
    description: string;
    result: MigrationResult;
}

export interface SkippedMigrationResponse {
    id: string;
    description: string;
    reason: string;
}

export interface MigrationEventPayload {
    version?: string;
    pattern?: string;
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
