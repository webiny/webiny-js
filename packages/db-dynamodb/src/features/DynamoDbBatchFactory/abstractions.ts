import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";
import type { EntitySchema } from "~/utils/EntitySchema.js";
import type { IPutBatchItem } from "~/utils/batch/types.js";
import type { IDeleteBatchItem } from "~/utils/batch/types.js";
import type { IReadBatchItem } from "~/utils/batch/types.js";
import type { IEntityWriteBatch } from "~/utils/entity/types.js";
import type { IEntityReadBatch } from "~/utils/entity/types.js";
import type { ITableWriteBatch } from "~/utils/table/types.js";
import type { ITableReadBatch } from "~/utils/table/types.js";

export interface IDynamoDbBatchFactoryCreateEntityWriterParams<T = GenericRecord> {
    schema: EntitySchema;
    client: DynamoDbDocumentClient.Interface;
    put?: IPutBatchItem<T>[];
    delete?: IDeleteBatchItem[];
}

export interface IDynamoDbBatchFactoryCreateEntityReaderParams {
    schema: EntitySchema;
    client: DynamoDbDocumentClient.Interface;
    read?: IReadBatchItem[];
}

export interface IDynamoDbBatchFactoryCreateTableWriterParams {
    client: DynamoDbDocumentClient.Interface;
}

export interface IDynamoDbBatchFactoryCreateTableReaderParams {
    client: DynamoDbDocumentClient.Interface;
}

export interface IDynamoDbBatchFactory {
    createEntityWriter<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbBatchFactoryCreateEntityWriterParams<T>
    ): IEntityWriteBatch<T>;

    createEntityReader<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbBatchFactoryCreateEntityReaderParams
    ): IEntityReadBatch<T>;

    createTableWriter(params: IDynamoDbBatchFactoryCreateTableWriterParams): ITableWriteBatch;

    createTableReader(params: IDynamoDbBatchFactoryCreateTableReaderParams): ITableReadBatch;
}

export const DynamoDbBatchFactory = createAbstraction<IDynamoDbBatchFactory>(
    "Db/DynamoDB/DynamoDbBatchFactory"
);

export namespace DynamoDbBatchFactory {
    export type Interface = IDynamoDbBatchFactory;
}
