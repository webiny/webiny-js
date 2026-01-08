import { createStandardEntity } from "@webiny/db-dynamodb";
import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { ENTITIES } from "../types.js";

export const createUserEntity = (table: Table<string, string, string>) => {
    return createStandardEntity({
        name: ENTITIES.USERS,
        table
    });
};
