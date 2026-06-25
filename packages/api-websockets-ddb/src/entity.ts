import type { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { IEntity } from "@webiny/db-dynamodb/exports/api/db.js";
import type { IStandardEntityAttributes } from "@webiny/db-dynamodb/exports/api/db.js";
import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";

const name = "SocketsConnectionRegistry";

interface Params {
    tableFactory: DynamoDbTableFactory.Interface;
    entityFactory: DynamoDbEntityFactory.Interface;
}

export const createEntity = (
    params: Params
): IEntity<IStandardEntityAttributes<ConnectionRegistry.Data>> => {
    const { tableFactory, entityFactory } = params;
    const table = tableFactory.create({
        name: String(process.env.DB_TABLE)
    });

    return entityFactory.createStandard<ConnectionRegistry.Data>({
        name,
        client: table,
        attributes: {
            GSI1_PK: {
                type: "string",
                required: true
            },
            GSI1_SK: {
                type: "string",
                required: true
            },
            GSI2_PK: {
                type: "string",
                required: true
            },
            GSI2_SK: {
                type: "string",
                required: true
            },
            TYPE: {
                type: "string",
                default: name,
                required: true
            },
            data: {
                type: "map",
                required: true
            }
        }
    });
};
