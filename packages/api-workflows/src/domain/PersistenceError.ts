import { BaseError } from "@webiny/feature/api";
import type { PersistenceErrorSource } from "./PersistenceErrorSource.js";
import { hasErrorSource } from "./hasErrorSource.js";

/** The storage error's code only; its text stays on the server. */
export interface PersistenceErrorCause {
    code?: string;
}

export interface PersistenceErrorData {
    cause: PersistenceErrorCause;
}

/**
 * The base of every persistence error (R146): a fixed message for the client, the storage
 * error's code in `data`, and the raw storage error on `source` for server logs. `source` is not
 * enumerable, so serialising the error never includes it. The one place that enforces the rule,
 * so no subclass can leak the raw error by accident.
 */
export abstract class PersistenceError extends BaseError<PersistenceErrorData> {
    /** The raw storage error, for server logs only; never sent to a client. */
    declare public readonly source: PersistenceErrorSource;

    /** `causeCode` defaults to the storage error's own code. */
    protected constructor(
        message: string,
        error: PersistenceErrorSource,
        causeCode: string | undefined = error.code
    ) {
        super({
            message,
            data: { cause: { code: causeCode } }
        });
        // A wrapped persistence error passes on its raw cause.
        const source = hasErrorSource(error) ? error.source : error;
        Object.defineProperty(this, "source", { value: source, enumerable: false });
    }
}
