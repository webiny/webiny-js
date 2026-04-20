// Tasks SDK type declarations.
export const TASKS_DECLARATIONS = `
type SdkTaskStatus =
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "aborted"
    | "stopped";

interface SdkTaskDefinition {
    /** Unique task definition ID. */
    id: string;
    /** Human-readable task title. */
    title: string;
    /** Task description. */
    description?: string;
}

interface SdkTaskRun {
    /** Unique task run ID. */
    id: string;
    /** ISO timestamp when the task started. */
    startedOn?: string;
    /** ISO timestamp when the task finished. */
    finishedOn?: string;
    /** Task name. */
    name?: string;
    /** The task definition ID this run belongs to. */
    definitionId: string;
    /** Number of iterations the task has completed. */
    iterations?: number;
    /** Parent task run ID, if this is a child task. */
    parentId?: string;
    /** Step Functions execution name. */
    executionName?: string;
    /** Raw event response from the task runner. */
    eventResponse?: unknown;
    /** Current task status. */
    taskStatus: SdkTaskStatus;
    /** Input data passed to the task. */
    input?: unknown;
    /** Output data produced by the task. */
    output?: unknown;
}

interface SdkTaskLogItem {
    /** Log message. */
    message: string;
    /** ISO timestamp of the log entry. */
    createdOn: string;
    /** Log level or type (e.g. "info", "error"). */
    type: string;
    /** Additional structured data. */
    data?: unknown;
    /** Error details, if this is an error log entry. */
    error?: unknown;
}

interface SdkTaskLog {
    /** Unique log ID. */
    id: string;
    /** ISO timestamp when the log was created. */
    createdOn: string;
    /** Step Functions execution name. */
    executionName?: string;
    /** Iteration number this log belongs to. */
    iteration?: number;
    /** Individual log entries within this log. */
    items: SdkTaskLogItem[];
}

interface SdkListLogsParams {
    where?: {
        /** Filter logs by task run ID. */
        task?: string;
    };
}

interface SdkTriggerTaskParams {
    /** The task definition ID to trigger. */
    definition: string;
    /** Input data to pass to the task. */
    input?: Record<string, unknown>;
}

interface SdkAbortTaskParams {
    /** The task run ID to abort. */
    id: string;
    /** Optional reason for aborting the task. */
    message?: string;
}

interface SdkTasks {
    /** List all registered task definitions. */
    listDefinitions(): Promise<SdkResult<SdkTaskDefinition[], SdkError>>;

    /** List all task runs with their status and I/O data. */
    listTasks(): Promise<SdkResult<SdkTaskRun[], SdkError>>;

    /** List execution logs, optionally filtered by task run ID. */
    listLogs(params?: SdkListLogsParams): Promise<SdkResult<SdkTaskLog[], SdkError>>;

    /** Trigger a task and start an async execution. */
    triggerTask(params: SdkTriggerTaskParams): Promise<SdkResult<SdkTaskRun, SdkError>>;

    /** Abort a running task at its next safe checkpoint. */
    abortTask(params: SdkAbortTaskParams): Promise<SdkResult<SdkTaskRun, SdkError>>;
}
`;
