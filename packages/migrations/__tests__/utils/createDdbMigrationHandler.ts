import { Constructor } from "@webiny/ioc";
import { createDdbProjectMigration, DataMigration } from "@webiny/data-migration";
import { getPrimaryDynamoDbTable } from "./getPrimaryDynamoDbTable";
import { useHandler } from "./useHandler";
import { runResumableMigration } from "./runResumableMigration";

interface DdbMigrationHandlerConfig {
    table: ReturnType<typeof getPrimaryDynamoDbTable>;
    migrations: Constructor<DataMigration>[];
}

interface Payload {
    version?: string;
    pattern?: string;
}

export function createDdbMigrationHandler(config: DdbMigrationHandlerConfig) {
    // Create a time limiter mock, which we can modify by reference.
    const timeLimiter = { timeLeft: -1 };

    const handler = useHandler(
        createDdbProjectMigration({
            primaryTable: config.table,
            migrations: config.migrations,
            isMigrationApplicable: () => true,
            timeLimiter: () => {
                // process.stdout.write(`Time left: ${(timeLimiter.timeLeft - 120000) / 1000}s\n`);
                return timeLimiter.timeLeft;
            }
        })
    );

    return async (payload?: Payload) => {
        return runResumableMigration(timeLimiter, handler, {
            version: "0.1.0",
            ...payload
        });
    };
}
