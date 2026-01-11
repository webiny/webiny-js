import type { IEntity, IStandardEntityAttributes } from "@webiny/db-dynamodb";
import type { AdminUser } from "@webiny/api-core/types/users.js";

export interface IAdminUserEntityAttributes extends IStandardEntityAttributes<AdminUser> {}

export type IAdminUserEntity = IEntity<IAdminUserEntityAttributes>;
