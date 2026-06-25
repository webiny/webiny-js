import { createEntityWriteBatch } from "~/utils/entity/EntityWriteBatch.js";
import { createEntityReadBatch } from "~/utils/entity/EntityReadBatch.js";
import { createTableWriteBatch } from "~/utils/table/TableWriteBatch.js";
import { createTableReadBatch } from "~/utils/table/TableReadBatch.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IDynamoDbBatchFactory } from "./abstractions.js";
import type { IDynamoDbBatchFactoryCreateEntityWriterParams } from "./abstractions.js";
import type { IDynamoDbBatchFactoryCreateEntityReaderParams } from "./abstractions.js";
import type { IDynamoDbBatchFactoryCreateTableWriterParams } from "./abstractions.js";
import type { IDynamoDbBatchFactoryCreateTableReaderParams } from "./abstractions.js";
import type { IEntityWriteBatch } from "~/utils/entity/types.js";
import type { IEntityReadBatch } from "~/utils/entity/types.js";
import type { ITableWriteBatch } from "~/utils/table/types.js";
import type { ITableReadBatch } from "~/utils/table/types.js";

export class DynamoDbBatchFactoryImpl implements IDynamoDbBatchFactory {
    public createEntityWriter<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbBatchFactoryCreateEntityWriterParams<T>
    ): IEntityWriteBatch<T> {
        return createEntityWriteBatch({
            schema: params.schema,
            client: params.client,
            put: params.put,
            delete: params.delete
        });
    }

    public createEntityReader<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbBatchFactoryCreateEntityReaderParams
    ): IEntityReadBatch<T> {
        return createEntityReadBatch<T>({
            schema: params.schema,
            client: params.client,
            read: params.read
        });
    }

    public createTableWriter(
        params: IDynamoDbBatchFactoryCreateTableWriterParams
    ): ITableWriteBatch {
        return createTableWriteBatch({
            table: params.client
        });
    }

    public createTableReader(
        params: IDynamoDbBatchFactoryCreateTableReaderParams
    ): ITableReadBatch {
        return createTableReadBatch({
            table: params.client
        });
    }
}
