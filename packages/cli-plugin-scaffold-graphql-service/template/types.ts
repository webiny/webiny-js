import { ContextInterface as Context } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { BaseI18NContentContext as I18NContentContext } from "@webiny/api-i18n-content/types";
import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";

export interface TargetDataModelEntity {
    PK: string;
    SK: string;
    id: string;
    title: string;
    description?: string;
    createdOn: string;
    savedOn: string;
    createdBy: Pick<SecurityIdentity, "id" | "displayName" | "type">;
    webinyVersion: string;
}

export interface TargetDataModelsContext
    extends Context,
        I18NContext,
        I18NContentContext,
        SecurityContext {}
