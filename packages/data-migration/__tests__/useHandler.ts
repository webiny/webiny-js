import { createHandler } from "@webiny/handler-aws/raw";
import { LambdaContext } from "@webiny/handler-aws/types";
import { MigrationEventHandlerResponse } from "~/types";

interface Payload {
    command?: string;
    version?: string;
    pattern?: string;
}

type NotUndefined<T> = T extends undefined ? never : T;

export const useHandler = (...plugins: any[]) => {
    const handler = createHandler<any, NotUndefined<MigrationEventHandlerResponse>>({
        plugins: [...plugins]
    });

    return (payload?: Payload): Promise<NotUndefined<MigrationEventHandlerResponse>> => {
        return runMigration({ payload, handler });
    };
};

interface RunMigrationParams {
    payload?: Payload;
    handler: ReturnType<typeof createHandler<any, NotUndefined<MigrationEventHandlerResponse>>>;
}

export const runMigration = async ({
    handler,
    payload
}: RunMigrationParams): Promise<NotUndefined<MigrationEventHandlerResponse>> => {
    const invokeMigration = async () => {
        return await handler(
            {
                ...payload,
                command: "execute"
            },
            {} as LambdaContext
        );
    };

    const getMigrationStatus = () => {
        return handler(
            {
                ...payload,
                command: "status"
            },
            {} as LambdaContext
        );
    };

    // Execute migration function. Invocation of `execute` doesn't return anything.
    await invokeMigration().catch(() => {
        // We ignore this error, because in real Lambda environment, we will not have a chance to return it.
    });

    // Get migration status.
    return getMigrationStatus();
};
