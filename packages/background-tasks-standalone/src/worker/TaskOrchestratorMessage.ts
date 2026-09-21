export interface TaskEventPayload {
    readonly webinyTaskId: string;
    readonly webinyTaskDefinitionId: string;
    readonly tenant: string;
    readonly delay: number;
    // Fields the shared TaskRunner/TaskEventValidation expects (AWS Step Functions execution context).
    // The single-process server has no Step Functions, so: `executionName` is a stable run identifier
    // (the task id, used by the runner for log entries), while `endpoint`/`stateMachineId` are
    // validate-only (unused by the runner off-AWS) and carry the callback URL / an empty marker.
    readonly endpoint: string;
    readonly executionName: string;
    readonly stateMachineId: string;
}

export interface StartMessage {
    readonly type: "start";
    readonly taskEvent: TaskEventPayload;
    readonly serverUrl: string;
    readonly maxDurationMs: number;
    readonly internalToken: string;
}

export interface DoneMessage {
    readonly type: "done";
    readonly taskId: string;
    readonly result: unknown;
}

export interface ErrorMessage {
    readonly type: "error";
    readonly taskId: string;
    readonly error: string;
}

export type WorkerToParentMessage = DoneMessage | ErrorMessage;
export type ParentToWorkerMessage = StartMessage;
