import type { EntitySchema } from "~/utils/EntitySchema.js";
import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";
import { batchWriteAll } from "~/utils/batch/batchWrite.js";
import type {
    BatchWriteItem,
    BatchWriteResult,
    IDeleteBatchItem,
    IPutBatchItem
} from "~/utils/batch/types.js";
import type { IEntityWriteBatch, IEntityWriteBatchBuilder } from "./types.js";
import type { ITableWriteBatch } from "~/utils/table/types.js";
import { createTableWriteBatch } from "~/utils/table/TableWriteBatch.js";
import { createEntityWriteBatchBuilder } from "./EntityWriteBatchBuilder.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IEntityWriteBatchParams<T = GenericRecord> {
    schema: EntitySchema;
    client: DynamoDbDocumentClient.Interface;
    put?: IPutBatchItem<T>[];
    delete?: IDeleteBatchItem[];
}

export class EntityWriteBatch<T> implements IEntityWriteBatch<T> {
    private readonly schema: EntitySchema;
    private readonly client: DynamoDbDocumentClient.Interface;
    private readonly _items: BatchWriteItem[] = [];
    private readonly builder: IEntityWriteBatchBuilder;

    public get total(): number {
        return this._items.length;
    }

    public get items(): BatchWriteItem[] {
        return Array.from(this._items);
    }

    public constructor(params: IEntityWriteBatchParams) {
        this.schema = params.schema;
        this.client = params.client;
        this.builder = createEntityWriteBatchBuilder(this.schema);
        for (const item of params.put || []) {
            this.put(item);
        }
        for (const item of params.delete || []) {
            this.delete(item);
        }
    }

    public put(item: IPutBatchItem<T>): void {
        this._items.push(this.builder.put(item));
    }

    public delete(item: IDeleteBatchItem): void {
        this._items.push(this.builder.delete(item));
    }

    public combine(items: BatchWriteItem[]): ITableWriteBatch {
        return createTableWriteBatch({
            table: this.client,
            items: this._items.concat(items)
        });
    }

    public async execute(): Promise<BatchWriteResult> {
        if (this._items.length === 0) {
            return [];
        }
        const items = Array.from(this._items);
        this._items.length = 0;

        return await batchWriteAll({
            items,
            table: this.client
        });
    }
}

export const createEntityWriteBatch = (params: IEntityWriteBatchParams): IEntityWriteBatch => {
    return new EntityWriteBatch(params);
};
