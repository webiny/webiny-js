import { Constructor } from "@webiny/ioc";
import { createDdbEsProjectMigration, DataMigration } from "@webiny/data-migration";
import { getPrimaryDynamoDbTable } from "~/testUtils/getPrimaryDynamoDbTable";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/client";
import { useHandler } from "./useHandler";

interface DdbEsMigrationHandlerConfig {
    primaryTable: ReturnType<typeof getPrimaryDynamoDbTable>;
    dynamoToEsTable: ReturnType<typeof getPrimaryDynamoDbTable>;
    migration: Constructor<DataMigration>;
}

interface Payload {
    version: string;
    pattern?: string;
}

export function createDdbEsMigrationHandler(config: DdbEsMigrationHandlerConfig) {
    const { handler } = useHandler(
        createDdbEsProjectMigration({
            primaryTable: config.primaryTable,
            dynamoToEsTable: config.dynamoToEsTable,
            migrations: [config.migration],
            elasticsearchClient: createElasticsearchClient(),
            isMigrationApplicable: () => true
        })
    );

    return (payload?: Payload) => handler({ version: "0.1.0", ...payload }, {} as any);
}
