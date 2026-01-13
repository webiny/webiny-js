import { createStandardEntity, standardEntityAttributes } from "@webiny/db-dynamodb";
import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { ENTITIES } from "../types.js";
import type { IApiKeyEntity, IRoleEntity, ITeamEntity } from "~/security/definitions/types.js";
import type { ApiKey, Role, Team } from "@webiny/api-core/types/security.js";

export const createRoleEntity = (table: Table<string, string, string>): IRoleEntity => {
    return createStandardEntity<Role>({
        name: ENTITIES.ROLE,
        table
    });
};

export const createTeamEntity = (table: Table<string, string, string>): ITeamEntity => {
    return createStandardEntity<Team>({
        name: ENTITIES.TEAM,
        table,
        attributes: {
            ...standardEntityAttributes
        }
    });
};

export const createApiKeyEntity = (table: Table<string, string, string>): IApiKeyEntity => {
    return createStandardEntity<ApiKey>({
        name: ENTITIES.API_KEY,
        table,
        attributes: {
            ...standardEntityAttributes
        }
    });
};
