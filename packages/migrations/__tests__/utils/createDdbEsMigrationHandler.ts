import { Client } from "@elastic/elasticsearch";
import { Constructor } from "@webiny/ioc";
import { createDdbEsProjectMigration, DataMigration } from "@webiny/data-migration";
import { getPrimaryDynamoDbTable } from "~tests/utils/getPrimaryDynamoDbTable";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { useHandler } from "./useHandler";
import { runResumableMigration } from "./runResumableMigration";

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
    // Create a time limiter mock, which we can modify by reference.
    const timeLimiter = { timeLeft: -1 };

    const handler = useHandler(
        createDdbEsProjectMigration({
            primaryTable: config.primaryTable,
            dynamoToEsTable: config.dynamoToEsTable,
            migrations: config.migrations,
            elasticsearchClient: config.elasticsearchClient || createElasticsearchClient(),
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
