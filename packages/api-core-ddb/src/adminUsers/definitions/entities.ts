import { createEntity, standardEntityAttributes } from "@webiny/db-dynamodb";
import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { ENTITIES } from "../types.js";
import type {
    IAdminUserEntity,
    IAdminUserEntityAttributes
} from "~/adminUsers/definitions/types.js";

export const createUserEntity = (table: Table<string, string, string>): IAdminUserEntity => {
    return createEntity<IAdminUserEntityAttributes>({
        name: ENTITIES.USERS,
        table,
        attributes: {
            ...standardEntityAttributes
        }
    });
};
