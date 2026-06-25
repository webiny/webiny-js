import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { IEntryEntity, IEntryEntityAttributesData } from "~/definitions/types.js";

export interface CreateEntryEntityParams {
    client: DynamoDbDocumentClient.Interface;
    entityFactory: DynamoDbEntityFactory.Interface;
    entityName: string;
}

export const createEntryEntity = (params: CreateEntryEntityParams): IEntryEntity => {
    const { client, entityFactory, entityName } = params;
    return entityFactory.createStandard<IEntryEntityAttributesData>({
        name: entityName,
        client
    });
};
