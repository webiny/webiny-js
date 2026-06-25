import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { IGroupEntity } from "~/definitions/types.js";
import type { CmsGroup } from "@webiny/api-headless-cms/types/index.js";

interface Params {
    client: DynamoDbDocumentClient.Interface;
    entityFactory: DynamoDbEntityFactory.Interface;
    entityName: string;
}

export const createGroupEntity = (params: Params): IGroupEntity => {
    const { client, entityFactory, entityName } = params;
    return entityFactory.createStandard<CmsGroup>({
        name: entityName,
        client
    });
};
