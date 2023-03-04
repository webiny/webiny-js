import { createHandler } from "@webiny/handler-aws/raw";
import { MigrationEventHandlerResponse } from "~/types";

export const useHandler = (...plugins: any[]) => {
    const handler = createHandler<any, MigrationEventHandlerResponse>({
        plugins: [...plugins]
    });

    return { handler };
};
