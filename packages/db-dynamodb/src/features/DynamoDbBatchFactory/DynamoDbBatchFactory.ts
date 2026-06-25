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

/* Type errors on `client` params are expected until Task 5 updates batch param types
   from DynamoDocClient to DynamoDbDocumentClient.Interface. */
export class DynamoDbBatchFactoryImpl implements IDynamoDbBatchFactory {
    public createEntityWriter<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbBatchFactoryCreateEntityWriterParams<T>
    ): IEntityWriteBatch<T> {
        return createEntityWriteBatch({
            schema: params.schema,
            // @ts-expect-error — will be fixed in Task 5
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
            // @ts-expect-error — will be fixed in Task 5
            client: params.client,
            read: params.read
        });
    }

    public createTableWriter(
        params: IDynamoDbBatchFactoryCreateTableWriterParams
    ): ITableWriteBatch {
        return createTableWriteBatch({
            // @ts-expect-error — will be fixed in Task 5
            table: params.client
        });
    }

    public createTableReader(
        params: IDynamoDbBatchFactoryCreateTableReaderParams
    ): ITableReadBatch {
        return createTableReadBatch({
            // @ts-expect-error — will be fixed in Task 5
            table: params.client
        });
    }
}
