export interface TaskEventPayload {
    readonly webinyTaskId: string;
    readonly webinyTaskDefinitionId: string;
    readonly tenant: string;
    readonly delay: number;
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
