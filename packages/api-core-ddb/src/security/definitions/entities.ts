import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { StorageApiKey, StorageRole, StorageTeam } from "@webiny/api-core/types/security.js";
import { ENTITIES } from "../types.js";
import type { IApiKeyEntity, IRoleEntity, ITeamEntity } from "~/security/definitions/types.js";

interface Params {
    client: DynamoDbDocumentClient.Interface;
    entityFactory: DynamoDbEntityFactory.Interface;
}

export const createRoleEntity = ({ client, entityFactory }: Params): IRoleEntity => {
    return entityFactory.createStandard<StorageRole>({
        name: ENTITIES.ROLE,
        client
    });
};

export const createTeamEntity = ({ client, entityFactory }: Params): ITeamEntity => {
    return entityFactory.createStandard<StorageTeam>({
        name: ENTITIES.TEAM,
        client
    });
};

export const createApiKeyEntity = ({ client, entityFactory }: Params): IApiKeyEntity => {
    return entityFactory.createStandard<StorageApiKey>({
        name: ENTITIES.API_KEY,
        client
    });
};
