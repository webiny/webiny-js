import { createStandardEntity, standardEntityAttributes } from "@webiny/db-dynamodb";
import type { StorageApiKey, StorageRole, StorageTeam } from "@webiny/api-core/types/security.js";
import type { TableDef } from "@webiny/db-dynamodb/toolbox.js";
import { ENTITIES } from "../types.js";
import type { IApiKeyEntity, IRoleEntity, ITeamEntity } from "~/security/definitions/types.js";

export const createRoleEntity = (table: TableDef): IRoleEntity => {
    return createStandardEntity<StorageRole>({
        name: ENTITIES.ROLE,
        table
    });
};

export const createTeamEntity = (table: TableDef): ITeamEntity => {
    return createStandardEntity<StorageTeam>({
        name: ENTITIES.TEAM,
        table,
        attributes: {
            ...standardEntityAttributes
        }
    });
};

export const createApiKeyEntity = (table: TableDef): IApiKeyEntity => {
    return createStandardEntity<StorageApiKey>({
        name: ENTITIES.API_KEY,
        table,
        attributes: {
            ...standardEntityAttributes
        }
    });
};
