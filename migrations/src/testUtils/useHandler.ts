import { createHandler } from "@webiny/handler-aws/raw";
import { MigrationEventHandlerResponse } from "@webiny/data-migration";

export const useHandler = (...plugins: any[]) => {
    const handler = createHandler<any, MigrationEventHandlerResponse>({
        plugins: [...plugins]
    });

    return { handler };
};

export function assertNotError(error: MigrationEventHandlerResponse["error"]): asserts error is undefined {
    if (error) {
        throw Error(`Migration handler returned and error: ${error.message}`);
    }
}
