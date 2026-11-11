import { randomUUID } from "node:crypto";

/**
 * The id of a new handler execution: the platform's own id for the invocation when there is one (the
 * AWS request id on Lambda, from `HandlerPlatform.getExecutionId()`), a UUID otherwise. It labels
 * the execution in errors and debug captures; the stale-execution check doesn't rely on it being
 * unique.
 */
export function createExecutionId(platformId: string | undefined): string {
    return platformId || randomUUID();
}
