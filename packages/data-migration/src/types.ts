import { Logger } from "@webiny/logger";

export type { Logger };

export interface MigrationItem {
    id: string;
    description: string;
    reason: string;
    startedOn?: string;
    finishedOn?: string;
}

export interface MigrationRun {
    id: string;
    startedOn: string;
    finishedOn: string;
    status: "init" | "running" | "pending" | "done" | "error";
    migrations: MigrationRunItem[];
    context?: Record<string, any>;
    error?: {
        message: string;
        name?: string;
        code?: string;
        data?: Record<string, any>;
        stack?: string;
    };
}

export interface MigrationRunItem {
    id: string;
    status: "done" | "running" | "skipped" | "pending" | "not-applicable" | "error";
    startedOn?: string;
    finishedOn?: string;
}

export interface MigrationRepository {
    getLastRun(): Promise<MigrationRun | null>;
    saveRun(run: MigrationRun): Promise<void>;
    listMigrations(params?: { limit: number }): Promise<MigrationItem[]>;
    logMigration(migration: MigrationItem): Promise<void>;
    createCheckpoint(id: string, data: unknown): Promise<void>;
    getCheckpoint(id: string): Promise<unknown>;
    deleteCheckpoint(id: string): Promise<void>;
}

export interface DataMigrationContext<TCheckpoint = any> {
    projectVersion: string;
    logger: Logger;
    checkpoint?: TCheckpoint;
    forceExecute: boolean;
    runningOutOfTime: () => boolean;
    createCheckpoint: (data: TCheckpoint) => Promise<void>;
    createCheckpointAndExit: (data: TCheckpoint) => Promise<void>;
}

export interface DataMigration<TCheckpoint = any> {
    getId(): string;
    getDescription(): string;
    // This function should check of the migration needs to apply some changes to the system.
    // Returning `false` means "everything is ok, mark this migration as executed".
    shouldExecute(context: DataMigrationContext<TCheckpoint>): Promise<boolean>;
    execute(context: DataMigrationContext<TCheckpoint>): Promise<void>;
}

/**
 * Migration execution time limiter (in milliseconds).
 */
export type ExecutionTimeLimiter = () => number;

export interface MigrationEventPayload {
    command: "status" | "execute";
    version?: string;
    pattern?: string;
    force?: boolean;
}

export type MigrationEventHandlerResponse =
    // When migration is triggered (via `Event` invocation type), it simply gets invoked, and returns nothing.
    | undefined
    // Last migration run state.
    | MigrationStatusResponse
    // If an unhandled error is thrown, return the error object.
    | MigrationInvocationErrorResponse;

export interface MigrationInvocationErrorResponse {
    error: { message: string };
    data?: undefined;
}

export interface MigrationStatusRunItem extends MigrationRunItem {
    description: string;
}

export interface MigrationStatus extends MigrationRun {
    migrations: MigrationStatusRunItem[];
}

export interface MigrationStatusResponse {
    data: MigrationStatus;
    error?: undefined;
}
