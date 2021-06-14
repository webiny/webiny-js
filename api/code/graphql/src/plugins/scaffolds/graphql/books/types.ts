import { ContextInterface as Context } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { BaseI18NContentContext } from "@webiny/api-i18n-content/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { SecurityIdentity } from "@webiny/api-security/types";

export interface BookEntity {
    PK: string;
    SK: string;
    id: string;
    title: string;
    description?: string;
    createdOn: string;
    savedOn: string;
    createdBy: SecurityIdentity;
    webinyVersion: string;
}

export interface BooksContext
    extends Context,
        I18NContext,
        BaseI18NContentContext,
        TenancyContext {}
