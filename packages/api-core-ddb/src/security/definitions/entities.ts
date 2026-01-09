import { createStandardEntity } from "@webiny/db-dynamodb";
import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { ENTITIES } from "../types.js";

export const createRoleEntity = (table: Table<string, string, string>) => {
    return createStandardEntity({ name: ENTITIES.ROLE, table });
};

export const createTeamEntity = (table: Table<string, string, string>) => {
    return createStandardEntity({ name: ENTITIES.TEAM, table });
};

export const createApiKeyEntity = (table: Table<string, string, string>) => {
    return createStandardEntity({ name: ENTITIES.API_KEY, table });
};
