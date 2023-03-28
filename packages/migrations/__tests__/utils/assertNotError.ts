import { MigrationInvocationErrorResponse } from "@webiny/data-migration";

export function assertNotError(
    error: MigrationInvocationErrorResponse["error"] | undefined
): asserts error is undefined {
    if (error) {
        throw Error(`Migration handler returned an error: ${error.message}`);
    }
}
