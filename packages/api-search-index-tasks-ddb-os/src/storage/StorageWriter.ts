import { StorageWriter as Abstraction } from "@webiny/api-search-index-tasks/abstractions/StorageWriter.js";
import { createTableWriteBatch, type IEntity, type IPutBatchItem } from "@webiny/db-dynamodb";
import { createOpenSearchTable, createOpenSearchEntity } from "@webiny/api-opensearch";
import { DynamoDBClient } from "@webiny/db-dynamodb/exports/api/db.js";

interface IBufferedRecord {
    entity: IEntity;
    data: Record<string, any>;
}

class DdbStorageWriterImpl implements Abstraction.Interface {
    private readonly table;
    private readonly entities: Record<string, IEntity> = {};
    private buffer: IBufferedRecord[] = [];

    constructor(dynamoDBClient: DynamoDBClient.Interface) {
        this.table = createOpenSearchTable({
            documentClient: dynamoDBClient.client
        });
    }

    put(record: Abstraction.Record): void {
        const entity = this.getEntity(record.entity);
        this.buffer.push({
            entity,
            data: record.data
        });
    }

    async execute(): Promise<void> {
        if (this.buffer.length === 0) {
            return;
        }

        const batch = createTableWriteBatch({
            table: this.table.table
        });

        for (const { entity, data } of this.buffer) {
            batch.put(entity.entity, data as IPutBatchItem);
        }

        await batch.execute();
        this.buffer = [];
    }

    private getEntity(name: string): IEntity {
        if (this.entities[name]) {
            return this.entities[name];
        }

        return (this.entities[name] = createOpenSearchEntity({
            table: this.table,
            entityName: name
        }));
    }
}

export const DdbStorageWriter = Abstraction.createImplementation({
    implementation: DdbStorageWriterImpl,
    dependencies: [DynamoDBClient]
});
