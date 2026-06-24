import type { Entity } from "./Entity.js";
import type { EntitySchema } from "~/utils/EntitySchema.js";
import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";

export type EntityOption = Entity | { schema: EntitySchema; client: DynamoDocClient; name: string };

export interface ResolvedEntity {
    schema: EntitySchema;
    client: DynamoDocClient;
    name: string;
}

export const getEntity = (entity: EntityOption): ResolvedEntity => {
    if (!entity.name) {
        throw new Error(`No name provided for entity.`);
    }

    if (!entity.client) {
        throw new Error(`No client provided for entity ${entity.name}.`);
    }

    return {
        schema: entity.schema,
        client: entity.client,
        name: entity.name
    };
};
