import { createAbstraction } from "@webiny/feature/admin";

export interface IDebugEntry {
    seq: number;
    namespace: string;
    timestamp: number;
    elapsed: number;
    data: unknown;
}

/**
 * What the API writes under `extensions.debug` for an identity allowed to capture.
 */
export interface IDebugPayload {
    enabled: boolean;
    requestId?: string;
    url?: string;
    namespaces?: string[];
    operations?: string[];
    entries?: IDebugEntry[];
    bytes?: number;
    dropped?: number;
    truncated?: boolean;
}

export interface ICollectedDebugSession extends IDebugPayload {
    collectedAt: number;
}

export interface IDebugSessionsRepository {
    /**
     * Whether capture is on for the current identity: it holds the permission, and has not turned
     * capture off itself.
     */
    isCaptureOn(): boolean;
    /**
     * Whether the current identity holds the permission at all.
     */
    canCapture(): boolean;
    setCaptureOn(enabled: boolean): void;
    getSessions(): ICollectedDebugSession[];
    getEntryCount(): number;
    collect(payload: IDebugPayload): void;
    clear(): void;
}

/**
 * Holds the debug toggle and the sessions collected from API responses.
 */
export const DebugSessionsRepository =
    createAbstraction<IDebugSessionsRepository>("DebugSessionsRepository");

export namespace DebugSessionsRepository {
    export type Interface = IDebugSessionsRepository;
    export type Payload = IDebugPayload;
    export type Entry = IDebugEntry;
    export type Session = ICollectedDebugSession;
}
