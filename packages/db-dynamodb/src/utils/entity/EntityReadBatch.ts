import type { IPutBatchItem } from "~/utils/batch/types.js";
import type {
    IEntityReadBatch,
    IEntityReadBatchBuilder,
    IEntityReadBatchBuilderGetResponse,
    IEntityReadBatchKey
} from "./types.js";
import type { Entity as ToolboxEntity, TableDef } from "~/toolbox.js";
import { batchReadAll } from "~/utils/batch/batchRead.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { createEntityReadBatchBuilder } from "./EntityReadBatchBuilder.js";
import type { EntityOption } from "./getEntity.js";
import { getEntity } from "./getEntity.js";

export interface IEntityReadBatchParams {
    entity: EntityOption;
    read?: IPutBatchItem[];
}

export class EntityReadBatch implements IEntityReadBatch {
    private readonly entity: ToolboxEntity;
    private readonly builder: IEntityReadBatchBuilder;
    private readonly _items: IEntityReadBatchBuilderGetResponse[] = [];

    public get total(): number {
        return this._items.length;
    }

    public get items(): IEntityReadBatchBuilderGetResponse[] {
        return Array.from(this._items);
    }

    public constructor(params: IEntityReadBatchParams) {
        this.entity = getEntity(params.entity);
        this.builder = createEntityReadBatchBuilder(this.entity);
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

    public async execute<T = GenericRecord>() {
        return await batchReadAll<T>({
            table: this.entity.table as TableDef,
            items: this._items
        });
    }
}

export const createEntityReadBatch = (params: IEntityReadBatchParams): IEntityReadBatch => {
    return new EntityReadBatch(params);
};
