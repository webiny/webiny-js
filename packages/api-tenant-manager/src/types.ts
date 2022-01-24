import { Context } from "@webiny/handler/types";

export interface TenantManagerContext extends Context {
    tenantManager: boolean;
}
