import type { EntitySchema } from "~/utils/EntitySchema.js";
import type {
    IEntityReadBatchBuilder,
    IEntityReadBatchBuilderGetResponse,
    IEntityReadBatchKey
} from "./types.js";

export class EntityReadBatchBuilder implements IEntityReadBatchBuilder {
    private readonly schema: EntitySchema;

    public constructor(schema: EntitySchema) {
        this.schema = schema;
    }

    public get(item: IEntityReadBatchKey): IEntityReadBatchBuilderGetResponse {
        return {
            Key: this.schema.toGetKeys(item) as IEntityReadBatchKey
        };
    }
}

export const createEntityReadBatchBuilder = (schema: EntitySchema): IEntityReadBatchBuilder => {
    return new EntityReadBatchBuilder(schema);
};
