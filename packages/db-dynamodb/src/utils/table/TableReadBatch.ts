import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";
import type { EntitySchema } from "~/utils/EntitySchema.js";
import type {
    IEntityReadBatchBuilder,
    IEntityReadBatchBuilderGetResponse
} from "~/utils/entity/types.js";
import { batchReadAll } from "~/utils/batch/batchRead.js";
import { createEntityReadBatchBuilder } from "~/utils/entity/EntityReadBatchBuilder.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { ITableReadBatch, ITableReadBatchKey } from "./types.js";

export interface ITableReadBatchParams {
    table: DynamoDocClient;
}

export class TableReadBatch implements ITableReadBatch {
    private readonly client: DynamoDocClient;
    private readonly _items: IEntityReadBatchBuilderGetResponse[] = [];
    private readonly builders: Map<string, IEntityReadBatchBuilder> = new Map();

    public constructor(params: ITableReadBatchParams) {
        this.client = params.table;
    }

    public get total(): number {
        return this._items.length;
    }

    public get items(): IEntityReadBatchBuilderGetResponse[] {
        return Array.from(this._items);
    }

    public get(schema: EntitySchema, input: ITableReadBatchKey): void {
        const builder = this.getBuilder(schema);

        const items = Array.isArray(input) ? input : [input];
        for (const item of items) {
            this._items.push(builder.get(item));
        }
    }

    public async execute<T = GenericRecord>(): Promise<T[]> {
        if (this._items.length === 0) {
            return [];
        }
        const items = Array.from(this._items);
        this._items.length = 0;

        return await batchReadAll<T>({
            client: this.client,
            items
        });
    }

    private getBuilder(schema: EntitySchema): IEntityReadBatchBuilder {
        const builder = this.builders.get(schema.name);
        if (builder) {
            return builder;
        }

        const newBuilder = createEntityReadBatchBuilder(schema);
        this.builders.set(schema.name, newBuilder);
        return newBuilder;
    }
}

export const createTableReadBatch = (params: ITableReadBatchParams): ITableReadBatch => {
    return new TableReadBatch(params);
};
