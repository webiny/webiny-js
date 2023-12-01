import { SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { I18NContext } from "@webiny/api-i18n/types";

export type CoreContext = TenancyContext & SecurityContext & I18NContext;
