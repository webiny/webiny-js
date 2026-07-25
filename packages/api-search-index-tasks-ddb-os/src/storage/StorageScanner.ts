import { StorageScanner as Abstraction } from "@webiny/api-search-index-tasks/abstractions/StorageScanner.js";
import { scan } from "@webiny/db-dynamodb";
import { createOpenSearchTable } from "@webiny/api-opensearch";
import { DynamoDBClient } from "@webiny/db-dynamodb/exports/api/db.js";

interface IDynamoDbElasticsearchRecord {
    PK: string;
    SK: string;
    index: string;
    _et?: string;
    entity: string;
    data: Record<string, any>;
    modified: string;
    [key: string]: any;
}

interface IDdbCursor {
    PK: string;
    SK: string;
}

class DdbStorageScannerImpl implements Abstraction.Interface {
    private readonly table;

    constructor(dynamoDBClient: DynamoDBClient.Interface) {
        this.table = createOpenSearchTable({
            documentClient: dynamoDBClient.client
        });
    }

    async scan(cursor: string | undefined, limit: number): Promise<Abstraction.Result> {
        const startKey = cursor ? (JSON.parse(cursor) as IDdbCursor) : undefined;

        const results = await scan<IDynamoDbElasticsearchRecord>({
            table: this.table.table,
            options: {
                startKey,
                limit
            }
        });

        const items = results.items.map(item => ({
            index: item.index,
            entity: item._et || item.entity,
            data: item,
            modified: item.modified
        }));

        let nextCursor: string | undefined;
        if (results.lastEvaluatedKey?.PK && results.lastEvaluatedKey?.SK) {
            nextCursor = JSON.stringify({
                PK: results.lastEvaluatedKey.PK,
                SK: results.lastEvaluatedKey.SK
            });
        }

        return {
            items,
            cursor: nextCursor
        };
    }
}

export const DdbStorageScanner = Abstraction.createImplementation({
    implementation: DdbStorageScannerImpl,
    dependencies: [DynamoDBClient]
});
