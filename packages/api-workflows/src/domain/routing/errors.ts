import { BaseError } from "@webiny/feature/api";
import type { PersistenceErrorSource } from "~/domain/PersistenceErrorSource.js";

export interface RoutingDependencyErrorCause {
    code?: string;
    message: string;
}

export interface RoutingDependencyErrorData {
    cause: RoutingDependencyErrorCause;
}

/**
 * A lookup routing needs failed: users, settings or the folder chain (R116). The resolver turns
 * it into the pool; the inspector and candidate lists report it.
 */
export class RoutingDependencyError extends BaseError<RoutingDependencyErrorData> {
    override readonly code = "Workflows/Routing/Dependency" as const;

    constructor(error: PersistenceErrorSource) {
        super({
            message: error.message,
            data: { cause: { code: error.code, message: error.message } }
        });
    }
}
