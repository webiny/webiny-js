import { createStandardEntity } from "@webiny/db-dynamodb";
import type { TableDef } from "@webiny/db-dynamodb/toolbox.js";
import { ENTITIES } from "../types.js";
import type { IAdminUserEntity } from "~/adminUsers/definitions/types.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";

export const createUserEntity = (table: TableDef): IAdminUserEntity => {
    return createStandardEntity<AdminUser>({
        name: ENTITIES.USERS,
        table
    });
};
