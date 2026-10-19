import { BaseError } from "@webiny/feature/api";
import type { PersistenceErrorSource } from "~/domain/PersistenceErrorSource.js";

/** The storage error's code only; its text stays on the server. */
export interface AssignmentPersistenceErrorCause {
    code?: string;
}

export interface AssignmentPersistenceErrorData {
    cause: AssignmentPersistenceErrorCause;
}

export class AssignmentPersistenceError extends BaseError<AssignmentPersistenceErrorData> {
    override readonly code = "Workflows/Assignment/Persistence" as const;
    /** The raw storage error, for server logs only; never sent to a client (R146). */
    declare public readonly source: PersistenceErrorSource;

    constructor(error: PersistenceErrorSource) {
        super({
            message: "The review assignments could not be read or saved.",
            data: { cause: { code: error.code } }
        });
        // Not enumerable: serialising the error never includes it.
        Object.defineProperty(this, "source", { value: error, enumerable: false });
    }
}
