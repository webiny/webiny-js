import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { IModelEntity } from "~/definitions/types.js";
import type { StorageCmsModel } from "@webiny/api-headless-cms/types/index.js";

interface Params {
    client: DynamoDbDocumentClient.Interface;
    entityFactory: DynamoDbEntityFactory.Interface;
    entityName: string;
}

export const createModelEntity = (params: Params): IModelEntity => {
    const { client, entityFactory, entityName } = params;
    return entityFactory.createStandard<StorageCmsModel>({
        name: entityName,
        client
    });
};
