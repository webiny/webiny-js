import { createEntity, standardEntityAttributes } from "@webiny/db-dynamodb";
import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { ENTITIES } from "../types.js";
import type { IApiKeyEntity, IRoleEntity, ITeamEntity } from "~/security/definitions/types.js";

export const createRoleEntity = (table: Table<string, string, string>): IRoleEntity => {
    return createEntity({
        name: ENTITIES.ROLE,
        table,
        attributes: {
            ...standardEntityAttributes
        }
    });
};

export const createTeamEntity = (table: Table<string, string, string>): ITeamEntity => {
    return createEntity({
        name: ENTITIES.TEAM,
        table,
        attributes: {
            ...standardEntityAttributes
        }
    });
};

export const createApiKeyEntity = (table: Table<string, string, string>): IApiKeyEntity => {
    return createEntity({
        name: ENTITIES.API_KEY,
        table,
        attributes: {
            ...standardEntityAttributes
        }
    });
};
