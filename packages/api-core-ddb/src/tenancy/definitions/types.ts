import type { IEntity, IStandardEntityAttributes } from "@webiny/db-dynamodb";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

export interface ITenantEntityAttributes extends IStandardEntityAttributes<Tenant> {
    TYPE: string;
}

export type ITenantEntity = IEntity<ITenantEntityAttributes>;
