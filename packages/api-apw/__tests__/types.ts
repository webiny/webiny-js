import { Context as BaseContext } from "@webiny/api/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { SecurityContext } from "@webiny/api-security/types";

export interface TestContext extends BaseContext, SecurityContext, TenancyContext {}
