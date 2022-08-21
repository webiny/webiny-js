import { Context } from "@webiny/api/types";

export interface TenantManagerContext extends Context {
    tenantManager: boolean;
}
