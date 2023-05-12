import { SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

export type TestContext = SecurityContext & TenancyContext;
