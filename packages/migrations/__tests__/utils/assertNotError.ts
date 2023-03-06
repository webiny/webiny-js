import { MigrationEventHandlerResponse } from "@webiny/data-migration";

export function assertNotError(
    error: MigrationEventHandlerResponse["error"]
): asserts error is undefined {
    if (error) {
        throw Error(`Migration handler returned an error: ${error.message}`);
    }
}
