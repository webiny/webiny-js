import type { PersistenceErrorSource } from "~/domain/PersistenceErrorSource.js";
import { PersistenceError } from "~/domain/PersistenceError.js";

export class AssignmentPersistenceError extends PersistenceError {
    override readonly code = "Workflows/Assignment/Persistence" as const;

    constructor(error: PersistenceErrorSource) {
        super("The review assignments could not be read or saved.", error);
    }
}
