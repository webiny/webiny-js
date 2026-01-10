import type { IEntity, IStandardEntityAttributes } from "@webiny/db-dynamodb";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

export interface ITenantsEntityAttributes extends Omit<IStandardEntityAttributes<Tenant>, "TYPE"> {
    TYPE: string;
}

export type ITenantsEntity = IEntity<ITenantsEntityAttributes>;
