import { createHandler } from "@webiny/handler-aws/raw";
import { MigrationEventHandlerResponse } from "~/types";

interface Payload {
    version: string;
    pattern?: string;
}

export const useHandler = (...plugins: any[]) => {
    const handler = createHandler<any, MigrationEventHandlerResponse>({
        plugins: [...plugins]
    });

    return (payload?: Payload) => handler(payload, {} as any);
};
