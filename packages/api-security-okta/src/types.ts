import "@webiny/api-tenancy/types";
import { SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { I18NContext } from "@webiny/api-i18n/types";

declare module "@webiny/api-tenancy/types" {
    interface TenantSettings {
        appClientId: string;
    }
}

/**
 * @internal
 */
export type Context = TenancyContext & SecurityContext & I18NContext;
