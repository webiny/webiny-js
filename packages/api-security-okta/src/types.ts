import "@webiny/api-tenancy/types.js";
import type { SecurityContext } from "@webiny/api-security/types.js";
import type { TenancyContext } from "@webiny/api-tenancy/types.js";
import type { I18NContext } from "@webiny/api-i18n/types.js";

/**
 * @internal
 */
export type Context = TenancyContext & SecurityContext & I18NContext;
