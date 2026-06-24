import type { EntitySchema } from "~/utils/EntitySchema.js";
import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";
import type { IReadBatchItem } from "~/utils/batch/types.js";
import type {
    IEntityReadBatch,
    IEntityReadBatchBuilder,
    IEntityReadBatchBuilderGetResponse,
    IEntityReadBatchKey
} from "./types.js";
import { batchReadAll } from "~/utils/batch/batchRead.js";
import { createEntityReadBatchBuilder } from "./EntityReadBatchBuilder.js";

export interface IEntityReadBatchParams {
    schema: EntitySchema;
    client: DynamoDocClient;
    read?: IReadBatchItem[];
}

export class EntityReadBatch<T> implements IEntityReadBatch<T> {
    private readonly schema: EntitySchema;
    private readonly client: DynamoDocClient;
    private readonly builder: IEntityReadBatchBuilder;
    private readonly _items: IEntityReadBatchBuilderGetResponse[] = [];

    public get total(): number {
        return this._items.length;
    }

    public get items(): IEntityReadBatchBuilderGetResponse[] {
        return Array.from(this._items);
    }

    public constructor(params: IEntityReadBatchParams) {
        this.schema = params.schema;
        this.client = params.client;
        this.builder = createEntityReadBatchBuilder(this.schema);
        for (const item of params.read || []) {
            this.get(item);
        }
    }

    public get(input: IEntityReadBatchKey | IEntityReadBatchKey[]): void {
        if (Array.isArray(input)) {
            this._items.push(
                ...input.map(item => {
                    return this.builder.get(item);
                })
            );
            return;
        }
        this._items.push(this.builder.get(input));
    }

    public async execute() {
        return await batchReadAll<T>({
            client: this.client,
            items: this._items
        });
    }
}

export const createEntityReadBatch = <T>(params: IEntityReadBatchParams): IEntityReadBatch<T> => {
    return new EntityReadBatch<T>(params);
};
