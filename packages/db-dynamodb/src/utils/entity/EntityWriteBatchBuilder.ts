import type { EntitySchema } from "~/utils/EntitySchema.js";
import type { BatchWriteItem, IDeleteBatchItem, IPutBatchItem } from "~/utils/batch/types.js";
import type { IEntityWriteBatchBuilder } from "./types.js";

export class EntityWriteBatchBuilder implements IEntityWriteBatchBuilder {
    private readonly schema: EntitySchema;

    public constructor(schema: EntitySchema) {
        this.schema = schema;
    }

    public put<T extends Record<string, any>>(item: IPutBatchItem<T>): BatchWriteItem {
        return this.schema.toPutRequest(item) as unknown as BatchWriteItem;
    }

    public delete(item: IDeleteBatchItem): BatchWriteItem {
        return this.schema.toDeleteRequest(item) as unknown as BatchWriteItem;
    }
}

export const createEntityWriteBatchBuilder = (schema: EntitySchema): IEntityWriteBatchBuilder => {
    return new EntityWriteBatchBuilder(schema);
};
