import type { Entity as ToolboxEntity } from "~/toolbox.js";
import type {
    IEntityReadBatchBuilder,
    IEntityReadBatchBuilderGetResponse,
    IEntityReadBatchKey
} from "./types.js";
import { WebinyError } from "@webiny/error";
import type { Entity } from "./Entity.js";
import type { EntityOption } from "./getEntity.js";
import { getEntity } from "./getEntity.js";

export class EntityReadBatchBuilder implements IEntityReadBatchBuilder {
    private readonly entity: ToolboxEntity;

    public constructor(entity: EntityOption) {
        this.entity = getEntity(entity);
    }

    public get(item: IEntityReadBatchKey): IEntityReadBatchBuilderGetResponse {
        const result = this.entity.getBatch(item);
        if (!result.Table) {
            throw new WebinyError(`No table provided for entity ${this.entity.name}.`);
        } else if (!result.Key) {
            throw new WebinyError(`No key provided for entity ${this.entity.name}.`);
        }
        return result as unknown as IEntityReadBatchBuilderGetResponse;
    }
}

export const createEntityReadBatchBuilder = (
    entity: ToolboxEntity | Entity
): IEntityReadBatchBuilder => {
    return new EntityReadBatchBuilder(entity);
};
