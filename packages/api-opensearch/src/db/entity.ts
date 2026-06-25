import { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { standardEntityAttributes } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";
import type { IOpenSearchEntity } from "~/db/types.js";

export interface ICreateOpenSearchEntityParams {
    client: DynamoDbDocumentClient.Interface;
    entityFactory: DynamoDbEntityFactory.Interface;
    entityName: string;
}

export const createOpenSearchEntity = (
    params: ICreateOpenSearchEntityParams
): IOpenSearchEntity => {
    const { client, entityFactory, entityName } = params;
    return entityFactory.create({
        name: entityName,
        client,
        attributes: {
            ...standardEntityAttributes,
            index: {
                type: "string",
                required: true
            }
        }
    }) as IOpenSearchEntity;
};
