import type { IEntity } from "@webiny/db-dynamodb";
import type { IStandardEntityAttributes } from "@webiny/db-dynamodb/exports/api/db.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";

export interface IAdminUserEntityAttributes extends IStandardEntityAttributes<AdminUser> {}

export type IAdminUserEntity = IEntity<IAdminUserEntityAttributes>;
