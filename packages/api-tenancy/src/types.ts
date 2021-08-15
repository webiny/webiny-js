import { Context } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { HttpContext } from "@webiny/handler-http/types";
import { Tenancy } from "./Tenancy";

export interface Tenant {
    id: string;
    name: string;
    parent: string | null;
}

export interface TenancyContext extends Context, HttpContext, DbContext {
    tenancy: Tenancy;
}
