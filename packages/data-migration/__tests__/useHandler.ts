import { createHandler } from "@webiny/handler-aws/raw";
import { MigrationEventHandlerResponse } from "~/createMigrationEventHandler";

export const useHandler = (...plugins: any[]) => {
    const handler = createHandler<any, MigrationEventHandlerResponse>({
        plugins: [...plugins]
    });

    return { handler };
};
