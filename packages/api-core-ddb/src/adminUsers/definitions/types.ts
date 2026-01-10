import type { IEntity, IStandardEntityAttributes } from "@webiny/db-dynamodb";
import type { AdminUser } from "@webiny/api-core/types/users.js";

export interface IAdminUsersEntityAttributes
    extends IStandardEntityAttributes<AdminUser> {}

export type IAdminUsersEntity = IEntity<IAdminUsersEntityAttributes>;
