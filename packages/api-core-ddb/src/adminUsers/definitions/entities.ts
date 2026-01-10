import { createEntity, standardEntityAttributes } from "@webiny/db-dynamodb";
import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { ENTITIES } from "../types.js";
import type {
    IAdminUsersEntity,
    IAdminUsersEntityAttributes
} from "~/adminUsers/definitions/types.js";

export const createUserEntity = (table: Table<string, string, string>): IAdminUsersEntity => {
    return createEntity<IAdminUsersEntityAttributes>({
        name: ENTITIES.USERS,
        table,
        attributes: {
            ...standardEntityAttributes
        }
    });
};
