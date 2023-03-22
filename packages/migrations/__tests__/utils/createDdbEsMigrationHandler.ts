import { Client } from "@elastic/elasticsearch";
import { Constructor } from "@webiny/ioc";
import { createDdbEsProjectMigration, DataMigration } from "@webiny/data-migration";
import { getPrimaryDynamoDbTable } from "~tests/utils/getPrimaryDynamoDbTable";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/client";
import { useHandler } from "./useHandler";

interface DdbEsMigrationHandlerConfig {
    primaryTable: ReturnType<typeof getPrimaryDynamoDbTable>;
    dynamoToEsTable: ReturnType<typeof getPrimaryDynamoDbTable>;
    elasticsearchClient?: Client;
    migrations: Constructor<DataMigration>[];
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
            migrations: config.migrations,
            elasticsearchClient: config.elasticsearchClient || createElasticsearchClient(),
            isMigrationApplicable: () => true
        })
    );

    return (payload?: Payload) => handler({ version: "0.1.0", ...payload }, {} as any);
}
