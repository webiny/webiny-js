import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { ENTITIES } from "../types.js";
import type { IAdminUserEntity } from "~/adminUsers/definitions/types.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";

interface Params {
    client: DynamoDbDocumentClient.Interface;
    entityFactory: DynamoDbEntityFactory.Interface;
}

export const createUserEntity = ({ client, entityFactory }: Params): IAdminUserEntity => {
    return entityFactory.createStandard<AdminUser>({
        name: ENTITIES.USERS,
        client
    });
};
