import type { IReadBatchItem } from "~/utils/batch/types.js";
import type {
    IEntityReadBatch,
    IEntityReadBatchBuilder,
    IEntityReadBatchBuilderGetResponse,
    IEntityReadBatchKey
} from "./types.js";
import type { Entity as ToolboxEntity, TableDef } from "~/toolbox.js";
import { batchReadAll } from "~/utils/batch/batchRead.js";
import { createEntityReadBatchBuilder } from "./EntityReadBatchBuilder.js";
import type { EntityOption } from "./getEntity.js";
import { getEntity } from "./getEntity.js";

export interface IEntityReadBatchParams {
    entity: EntityOption;
    read?: IReadBatchItem[];
}

export class EntityReadBatch<T> implements IEntityReadBatch<T> {
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

    public async execute() {
        return await batchReadAll<T>({
            table: this.entity.table as TableDef,
            items: this._items
        });
    }
}

export const createEntityReadBatch = <T>(params: IEntityReadBatchParams): IEntityReadBatch<T> => {
    return new EntityReadBatch<T>(params);
};
