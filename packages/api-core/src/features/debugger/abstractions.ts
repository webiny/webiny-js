import { createAbstraction } from "@webiny/feature/api";

/**
 * Registry of debug namespace prefixes.
 *
 * Packages augment this interface to claim their own prefix:
 *
 * ```ts
 * declare module "@webiny/api-core/features/debugger/abstractions.js" {
 *     interface DebugNamespaces {
 *         cms: `cms.${string}`;
 *     }
 * }
 * ```
 *
 * The module specifier must be exactly the one above - a relative path augments nothing.
 */
export interface DebugNamespaces {
    core: `core.${string}`;
}

export type DebugNamespace = DebugNamespaces[keyof DebugNamespaces];

/**
 * Produces the payload to capture. Invoked only when capture is active, so building an expensive
 * payload costs nothing when the debugger is off.
 */
export interface IDebugPayloadFactory {
    (): unknown;
}

export interface IDebugEntry {
    seq: number;
    namespace: string;
    timestamp: number;
    /** Milliseconds since the session started. */
    elapsed: number;
    /** Already serialized and capped. Valid JSON. */
    json: string;
    bytes: number;
}

export interface IDebugSession {
    namespaces: string[];
    startedAt: number;
    entries: IDebugEntry[];
    bytes: number;
    /** Entries discarded from the front of the buffer because the total budget was exceeded. */
    dropped: number;
    /** True once any single entry's payload was replaced by the per-entry cap marker. */
    truncated: boolean;
}

export interface IDebuggerStartParams {
    namespaces: string[];
}

export interface IDebugDeliveryTarget {
    type: string;
}

export interface IDebuggerTransportDeliverParams {
    target: IDebugDeliveryTarget;
    session: IDebugSession;
}

export interface IDebugger {
    /**
     * Opens a capture session, replacing any existing one.
     */
    start(params: IDebuggerStartParams): void;
    /**
     * Captures a payload, if a session is open and the namespace matches its filter.
     * Never throws.
     */
    log(namespace: DebugNamespace, payload: IDebugPayloadFactory): void;
    /**
     * Whether a namespace would currently be captured. For guarding expensive work *around* a log
     * call - `log` already performs this check itself.
     */
    isEnabled(namespace: DebugNamespace): boolean;
    /**
     * Hands the session to every transport that can deliver it, then closes it.
     */
    flush(target: IDebugDeliveryTarget): Promise<void>;
    /**
     * Closes the session without delivering it.
     */
    discard(): void;
}

export interface IDebuggerTransport {
    canDeliver(target: IDebugDeliveryTarget): boolean;
    deliver(params: IDebuggerTransportDeliverParams): Promise<void> | void;
}

/** Captures debug payloads for the current request, for delivery to a permitted identity. */
export const Debugger = createAbstraction<IDebugger>("Debugger");

export namespace Debugger {
    export type Interface = IDebugger;
    export type Session = IDebugSession;
    export type Entry = IDebugEntry;
    export type StartParams = IDebuggerStartParams;
    export type PayloadFactory = IDebugPayloadFactory;
}

/** Delivers a finished debug session to a sink. */
export const DebuggerTransport = createAbstraction<IDebuggerTransport>("DebuggerTransport");

export namespace DebuggerTransport {
    export type Interface = IDebuggerTransport;
    export type Target = IDebugDeliveryTarget;
    export type DeliverParams = IDebuggerTransportDeliverParams;
}
