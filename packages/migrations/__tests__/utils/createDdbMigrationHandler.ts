import { Constructor } from "@webiny/ioc";
import { createDdbProjectMigration, DataMigration } from "@webiny/data-migration";
import { getPrimaryDynamoDbTable } from "./getPrimaryDynamoDbTable";
import { useHandler } from "./useHandler";

interface DdbMigrationHandlerConfig {
    table: ReturnType<typeof getPrimaryDynamoDbTable>;
    migrations: Constructor<DataMigration>[];
}

interface Payload {
    version?: string;
    pattern?: string;
}

export function createDdbMigrationHandler(config: DdbMigrationHandlerConfig) {
    const { handler } = useHandler(
        createDdbProjectMigration({
            primaryTable: config.table,
            migrations: config.migrations,
            isMigrationApplicable: () => true
        })
    );

    return (payload?: Payload) => handler({ version: "0.1.0", ...payload }, {} as any);
}
