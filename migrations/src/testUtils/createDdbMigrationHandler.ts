import { Constructor } from "@webiny/ioc";
import { createDdbProjectMigration, DataMigration } from "@webiny/data-migration";
import { getPrimaryDynamoDbTable } from "./getPrimaryDynamoDbTable";
import { useHandler } from "./useHandler";

interface DdbMigrationHandlerConfig {
    table: ReturnType<typeof getPrimaryDynamoDbTable>;
    migration: Constructor<DataMigration>;
}

export function createDdbMigrationHandler(config: DdbMigrationHandlerConfig) {
    const { handler } = useHandler(
        createDdbProjectMigration({
            primaryTable: config.table,
            migrations: [config.migration],
            isMigrationApplicable: () => true
        })
    );

    return () => handler({}, {} as any);
}
