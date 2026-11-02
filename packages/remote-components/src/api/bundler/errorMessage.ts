/**
 * The message of a thrown value. Errors thrown inside a `node:vm` context come from that context's
 * own `Error`, so `instanceof Error` is false for them.
 */
export function errorMessage(cause: unknown): string {
    if (cause && typeof cause === "object" && "message" in cause) {
        return String(cause.message);
    }
    return String(cause);
}
