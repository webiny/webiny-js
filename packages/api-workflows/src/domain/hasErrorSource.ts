import type { PersistenceErrorSource } from "./PersistenceErrorSource.js";

/**
 * An error that keeps the raw storage error off its message and payload (R146). Server code logs
 * `source`; clients only get the fixed message.
 */
export interface ErrorWithSource extends Error {
    readonly source: PersistenceErrorSource;
}

/** Duck-typed so errors built in other packages are recognised. */
export const hasErrorSource = (error: unknown): error is ErrorWithSource => {
    return error instanceof Error && (error as Partial<ErrorWithSource>).source instanceof Error;
};
