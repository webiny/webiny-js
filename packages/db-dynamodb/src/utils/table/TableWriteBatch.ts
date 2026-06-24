import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";
import type { EntitySchema } from "~/utils/EntitySchema.js";
import type {
    BatchWriteItem,
    BatchWriteResult,
    IDeleteBatchItem,
    IPutBatchItem
} from "~/utils/batch/types.js";
import type { IEntityWriteBatchBuilder } from "~/utils/entity/types.js";
import { batchWriteAll } from "~/utils/batch/batchWrite.js";
import { createEntityWriteBatchBuilder } from "~/utils/entity/EntityWriteBatchBuilder.js";
import type { ITableWriteBatch } from "./types.js";

export interface ITableWriteBatchParams {
    table: DynamoDocClient;
    items?: BatchWriteItem[];
}

export class TableWriteBatch implements ITableWriteBatch {
    private readonly client: DynamoDocClient;
    private readonly _items: BatchWriteItem[] = [];
    private readonly builders: Map<string, IEntityWriteBatchBuilder> = new Map();

    public get total(): number {
        return this._items.length;
    }

    public get items(): BatchWriteItem[] {
        return Array.from(this._items);
    }

    public constructor(params: ITableWriteBatchParams) {
        this.client = params.table;
        if (!params.items?.length) {
            return;
        }
        this._items.push(...params.items);
    }

    public put(schema: EntitySchema, item: IPutBatchItem): void {
        const builder = this.getBuilder(schema);
        this._items.push(builder.put(item));
    }

    public delete(schema: EntitySchema, item: IDeleteBatchItem): void {
        const builder = this.getBuilder(schema);
        this._items.push(builder.delete(item));
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

    private getBuilder(schema: EntitySchema): IEntityWriteBatchBuilder {
        if (!schema.name) {
            throw new Error("Entity schema must have a name.");
        }

        const builder = this.builders.get(schema.name);
        if (builder) {
            return builder;
        }

        const newBuilder = createEntityWriteBatchBuilder(schema);
        this.builders.set(schema.name, newBuilder);
        return newBuilder;
    }
}

export const createTableWriteBatch = (params: ITableWriteBatchParams): ITableWriteBatch => {
    return new TableWriteBatch(params);
};
