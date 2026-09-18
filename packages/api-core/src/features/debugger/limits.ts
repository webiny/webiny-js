/**
 * Capture limits. None of these are settable by the client.
 */
export interface IDebuggerLimits {
    /** Total serialized bytes a session may hold. Overflow drops entries from the front. */
    totalBytes: number;
    /** Maximum serialized size of a single entry, after the walk caps below are applied. */
    entryBytes: number;
    /** Runaway-loop guard. The byte budget is the real control. */
    entryCount: number;
    /** Maximum nesting depth walked before emitting a marker. */
    depth: number;
    /** Maximum characters kept from a single string value. */
    stringLength: number;
    /** Maximum items kept from a single array. */
    arrayLength: number;
}

export const DEFAULT_LIMITS: IDebuggerLimits = {
    totalBytes: 4 * 1024 * 1024,
    entryBytes: 512 * 1024,
    entryCount: 10000,
    depth: 10,
    stringLength: 10000,
    arrayLength: 100
};
