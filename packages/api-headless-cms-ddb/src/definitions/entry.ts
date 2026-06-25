import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { IEntryEntity, IEntryEntityAttributesData } from "./types.js";

interface Params {
    client: DynamoDbDocumentClient.Interface;
    entityFactory: DynamoDbEntityFactory.Interface;
    entityName: string;
}

export const createEntryEntity = (params: Params): IEntryEntity => {
    const { client, entityFactory, entityName } = params;
    return entityFactory.createStandard<IEntryEntityAttributesData>({
        name: entityName,
        client
    });
};
