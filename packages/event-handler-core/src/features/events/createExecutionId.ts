import { randomUUID } from "node:crypto";
import type { Transport } from "./Transport.js";

/**
 * The id of a new handler execution: the platform's own id for the invocation when the transport
 * has one (the AWS request id on Lambda), a UUID otherwise. It labels the execution in errors and
 * debug captures; the stale-execution check doesn't rely on it being unique.
 */
export function createExecutionId(transport: Transport | undefined, rawArgs: any[]): string {
    const platformId = transport?.getExecutionId?.(...rawArgs);
    return platformId || randomUUID();
}
