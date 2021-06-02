import { ContextInterface as Context } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { HttpContext } from "@webiny/handler-http/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { BaseI18NContentContext } from "@webiny/api-i18n-content/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { SecurityIdentity } from "@webiny/api-security/types";

export interface Target {
    id: string;
    createdOn: string;
    createdBy: SecurityIdentity;
    title: string;
    description?: string;
}

export interface ApplicationContext
    extends Context,
        DbContext,
        HttpContext,
        I18NContext,
        BaseI18NContentContext,
        TenancyContext {}
