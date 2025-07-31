import type { TenancyContext } from "@webiny/api-tenancy/types";
import type { DbContext } from "@webiny/handler-db/types";

export type Context = TenancyContext & DbContext;
